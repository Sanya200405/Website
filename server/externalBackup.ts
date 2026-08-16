import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { db, logActivity } from './db';
import {
  BACKUPS_DIR,
  UPLOADS_DIR,
  DB_PATH,
  getFullProjectJsonDump,
  createDatabaseBackup,
} from './backup';

const require = createRequire(import.meta.url);
const archiverPkg = require('archiver');
const archiver = typeof archiverPkg === 'function' ? archiverPkg : archiverPkg.default || archiverPkg;
const admZipPkg = require('adm-zip');
const AdmZip = typeof admZipPkg === 'function' ? admZipPkg : admZipPkg.default || admZipPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable External / Off-Site Backup Destination
// Can be set via environment variable EXTERNAL_BACKUP_PATH (e.g., secondary drive, USB, NAS mount)
export const DEFAULT_EXTERNAL_DIR = path.resolve(__dirname, '../data/external_backups');
export const EXTERNAL_BACKUP_DIR = process.env.EXTERNAL_BACKUP_PATH
  ? path.resolve(process.env.EXTERNAL_BACKUP_PATH)
  : DEFAULT_EXTERNAL_DIR;

// Remote webhook/storage endpoint (optional, kept strictly server-side)
export const EXTERNAL_BACKUP_ENDPOINT = process.env.EXTERNAL_BACKUP_ENDPOINT || null;
export const EXTERNAL_BACKUP_API_KEY = process.env.EXTERNAL_BACKUP_API_KEY || null;

if (!fs.existsSync(EXTERNAL_BACKUP_DIR)) {
  try {
    fs.mkdirSync(EXTERNAL_BACKUP_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create default external backup directory:', e);
  }
}

export interface ExternalBackupRecord {
  id: string;
  filename: string;
  destination_type: string;
  destination_target: string;
  size_bytes: number;
  size_formatted: string;
  status: 'success' | 'failed' | 'in_progress';
  error_message: string | null;
  duration_ms: number;
  manifest_json: string | null;
  created_at: string;
}

export interface ExternalBackupStatusInfo {
  isConfigured: boolean;
  destinationType: string;
  destinationDisplay: string;
  scheduleFrequency: string;
  lastBackupTime: string | null;
  lastBackupFilename: string | null;
  lastBackupSizeBytes: number;
  lastBackupSizeFormatted: string;
  lastBackupStatus: 'success' | 'failed' | 'in_progress' | 'idle';
  lastBackupError: string | null;
  totalExternalBackups: number;
  retentionMaxCount: number;
  dbSizeBytes: number;
  dbSizeFormatted: string;
  uploadsSizeBytes: number;
  uploadsSizeFormatted: string;
  totalUploadFiles: number;
}

export interface ArchiveRestoreResult {
  success: boolean;
  restoredDb: boolean;
  restoredUploadsCount: number;
  restoredFiles: string[];
  databaseSizeFormatted: string;
  manifest: any | null;
  message: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Returns sanitized destination information without exposing sensitive tokens or raw absolute internal server paths
 */
function getSanitizedDestinationDisplay(): { type: string; display: string } {
  if (EXTERNAL_BACKUP_ENDPOINT) {
    try {
      const url = new URL(EXTERNAL_BACKUP_ENDPOINT);
      return {
        type: 'Remote Cloud Storage API / Webhook',
        display: `${url.protocol}//${url.hostname}${url.pathname.substring(0, 12)}...`,
      };
    } catch {
      return {
        type: 'Remote Cloud Storage API / Webhook',
        display: 'Remote HTTPS Endpoint (Configured)',
      };
    }
  }

  const isCustom = Boolean(process.env.EXTERNAL_BACKUP_PATH);
  return {
    type: isCustom ? 'External Storage Volume / NAS Mount' : 'Secondary Off-Site Backup Directory',
    display: isCustom
      ? `Volume Mount: ${path.basename(EXTERNAL_BACKUP_DIR)}`
      : 'data/external_backups/ (Off-Site Disaster Recovery Vault)',
  };
}

/**
 * Creates a complete timestamped disaster recovery ZIP archive containing:
 * 1. database/project.db (atomic SQLite snapshot)
 * 2. database/project_data_dump.json (full relational JSON dump)
 * 3. uploads/ (all PDFs, CSV datasets, datasheets, diagrams)
 * 4. manifest.json (SHA256 checksum, file count, timestamp)
 */
export async function createExternalProjectBackup(initiatedBy: string = 'Automated Scheduler'): Promise<ExternalBackupRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `foc_disaster_recovery_${timestamp}.zip`;
  const tempZipPath = path.join(BACKUPS_DIR, `temp_${filename}`);
  const destPath = path.join(EXTERNAL_BACKUP_DIR, filename);

  const destInfo = getSanitizedDestinationDisplay();
  const recordId = 'ext_bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const createdAt = new Date().toISOString();

  // Temporary snapshot of SQLite database for bundling
  const tempDbSnapshotPath = path.join(BACKUPS_DIR, `temp_db_${timestamp}.db`);

  try {
    // 1. Perform atomic SQLite backup to temp snapshot file
    await db.backup(tempDbSnapshotPath);

    // Calculate SHA256 checksum of database
    const dbBuffer = fs.readFileSync(tempDbSnapshotPath);
    const dbHash = crypto.createHash('sha256').update(dbBuffer).digest('hex');

    // 2. Count and measure uploads
    let totalUploadsSize = 0;
    let totalUploadsCount = 0;
    const uploadFileNames: string[] = [];

    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      totalUploadsCount = files.length;
      for (const f of files) {
        try {
          const st = fs.statSync(path.join(UPLOADS_DIR, f));
          totalUploadsSize += st.size;
          uploadFileNames.push(f);
        } catch (_) {}
      }
    }

    // 3. Build manifest metadata
    const manifest = {
      project: 'FOC BLDC Motor Drive Engineering Workspace',
      archive_type: 'complete_disaster_recovery_bundle',
      version: '2.0.0',
      created_at: createdAt,
      initiated_by: initiatedBy,
      database: {
        file: 'database/project.db',
        sha256: dbHash,
        size_bytes: dbBuffer.length,
        size_formatted: formatBytes(dbBuffer.length),
      },
      json_export: {
        file: 'database/project_data_dump.json',
      },
      uploads: {
        directory: 'uploads/',
        total_files: totalUploadsCount,
        total_size_bytes: totalUploadsSize,
        total_size_formatted: formatBytes(totalUploadsSize),
      },
    };

    // 4. Pack complete ZIP archive using AdmZip
    const zip = new AdmZip();

    // Add database snapshot
    zip.addLocalFile(tempDbSnapshotPath, 'database', 'project.db');

    // Add full structured JSON dump
    const jsonDump = JSON.stringify(getFullProjectJsonDump(), null, 2);
    zip.addFile('database/project_data_dump.json', Buffer.from(jsonDump, 'utf8'));

    // Add all uploaded files
    if (fs.existsSync(UPLOADS_DIR)) {
      const uploadFiles = fs.readdirSync(UPLOADS_DIR);
      for (const uf of uploadFiles) {
        const fullUfPath = path.join(UPLOADS_DIR, uf);
        try {
          if (fs.statSync(fullUfPath).isFile()) {
            zip.addLocalFile(fullUfPath, 'uploads');
          }
        } catch (_) {}
      }
    }

    // Add manifest.json
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

    // Add recovery instruction text
    const readme = `# FOC BLDC Motor Drive - Complete Disaster Recovery Archive
Created: ${createdAt}
Checksum (DB SHA256): ${dbHash}

CONTENTS:
1. /database/project.db - Full SQLite database with all tables, tasks, tests, research papers, notes, motor parameters, and simulation models.
2. /database/project_data_dump.json - Relational JSON dump.
3. /uploads/ - All attached files, datasheets, CSV logs, and research PDFs.
4. /manifest.json - Verification hash and integrity metadata.

RESTORATION INSTRUCTIONS:
This archive can be restored directly via the Web Admin Console (Admin -> Backups & Resilience -> Restore Complete Project Archive).
Alternatively, extract 'project.db' into 'data/project.db' and 'uploads/' into 'uploads/'.
`;
    zip.addFile('README_DISASTER_RECOVERY.txt', Buffer.from(readme, 'utf8'));

    // 5. Write completed ZIP to external destination directory
    if (!fs.existsSync(EXTERNAL_BACKUP_DIR)) {
      fs.mkdirSync(EXTERNAL_BACKUP_DIR, { recursive: true });
    }
    zip.writeZip(destPath);

    // 6. If remote webhook is configured, post disaster recovery bundle or notification
    if (EXTERNAL_BACKUP_ENDPOINT) {
      try {
        await postToRemoteBackupEndpoint(destPath, manifest);
      } catch (remoteErr: any) {
        console.error('Warning: Remote webhook backup failed (local external archive succeeded):', remoteErr.message);
      }
    }

    const zipStats = fs.statSync(destPath);
    const durationMs = Date.now() - startTime;
    const sizeFormatted = formatBytes(zipStats.size);

    const record: ExternalBackupRecord = {
      id: recordId,
      filename,
      destination_type: destInfo.type,
      destination_target: destInfo.display,
      size_bytes: zipStats.size,
      size_formatted: sizeFormatted,
      status: 'success',
      error_message: null,
      duration_ms: durationMs,
      manifest_json: JSON.stringify(manifest),
      created_at: createdAt,
    };

    // Insert record in database
    try {
      db.prepare(`
        INSERT INTO external_backup_records (
          id, filename, destination_type, destination_target, size_bytes,
          size_formatted, status, error_message, duration_ms, manifest_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.id,
        record.filename,
        record.destination_type,
        record.destination_target,
        record.size_bytes,
        record.size_formatted,
        record.status,
        record.error_message,
        record.duration_ms,
        record.manifest_json,
        record.created_at
      );
    } catch (dbErr) {
      console.error('Failed to log external backup record to database:', dbErr);
    }

    logActivity(
      initiatedBy,
      null,
      `created complete disaster recovery archive (${sizeFormatted}) in ${destInfo.type}`,
      'Disaster Recovery',
      filename
    );

    // Enforce retention policy for off-site archives (retain latest 30)
    enforceExternalBackupRetention(30);

    return record;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const failedRecord: ExternalBackupRecord = {
      id: recordId,
      filename,
      destination_type: destInfo.type,
      destination_target: destInfo.display,
      size_bytes: 0,
      size_formatted: '0 B',
      status: 'failed',
      error_message: err.message || 'Unknown external backup error',
      duration_ms: durationMs,
      manifest_json: null,
      created_at: createdAt,
    };

    try {
      db.prepare(`
        INSERT INTO external_backup_records (
          id, filename, destination_type, destination_target, size_bytes,
          size_formatted, status, error_message, duration_ms, manifest_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        failedRecord.id,
        failedRecord.filename,
        failedRecord.destination_type,
        failedRecord.destination_target,
        failedRecord.size_bytes,
        failedRecord.size_formatted,
        failedRecord.status,
        failedRecord.error_message,
        failedRecord.duration_ms,
        failedRecord.manifest_json,
        failedRecord.created_at
      );
    } catch (_) {}

    throw new Error(`External disaster recovery backup failed: ${err.message}`);
  } finally {
    // Clean up temporary snapshot and zip files
    if (fs.existsSync(tempDbSnapshotPath)) {
      try { fs.unlinkSync(tempDbSnapshotPath); } catch (_) {}
    }
    if (fs.existsSync(tempZipPath)) {
      try { fs.unlinkSync(tempZipPath); } catch (_) {}
    }
  }
}

/**
 * Prunes older external disaster recovery archives past retention limit
 */
export function enforceExternalBackupRetention(maxRetained: number = 30) {
  if (!fs.existsSync(EXTERNAL_BACKUP_DIR)) return;

  const files = fs.readdirSync(EXTERNAL_BACKUP_DIR).filter((f) => f.startsWith('foc_disaster_recovery_') && f.endsWith('.zip'));
  if (files.length <= maxRetained) return;

  const fileStats = files.map((f) => {
    const fullPath = path.join(EXTERNAL_BACKUP_DIR, f);
    return { name: f, fullPath, mtime: fs.statSync(fullPath).mtime.getTime() };
  });

  // Sort descending (newest first)
  fileStats.sort((a, b) => b.mtime - a.mtime);
  const toDelete = fileStats.slice(maxRetained);

  for (const item of toDelete) {
    try {
      fs.unlinkSync(item.fullPath);
      db.prepare('DELETE FROM external_backup_records WHERE filename = ?').run(item.name);
    } catch (e) {
      console.error(`Failed to prune external archive ${item.name}:`, e);
    }
  }
}

/**
 * Validates write connectivity and directory permissions for the configured external destination
 */
export async function testExternalDestination(): Promise<{ success: boolean; destinationDisplay: string; message: string }> {
  const destInfo = getSanitizedDestinationDisplay();

  try {
    if (!fs.existsSync(EXTERNAL_BACKUP_DIR)) {
      fs.mkdirSync(EXTERNAL_BACKUP_DIR, { recursive: true });
    }

    const testFile = path.join(EXTERNAL_BACKUP_DIR, `.test_write_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'Test write permission for disaster recovery engine');
    fs.unlinkSync(testFile);

    return {
      success: true,
      destinationDisplay: destInfo.display,
      message: `Successfully verified write access to ${destInfo.type} (${destInfo.display}).`,
    };
  } catch (err: any) {
    return {
      success: false,
      destinationDisplay: destInfo.display,
      message: `Failed to access external destination: ${err.message}`,
    };
  }
}

/**
 * Returns comprehensive external disaster recovery health and overview status
 */
export function getExternalBackupStatus(): ExternalBackupStatusInfo {
  const destInfo = getSanitizedDestinationDisplay();
  const dbStats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : { size: 0 };

  let uploadsSize = 0;
  let totalUploadFiles = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    totalUploadFiles = uploadFiles.length;
    for (const f of uploadFiles) {
      try {
        uploadsSize += fs.statSync(path.join(UPLOADS_DIR, f)).size;
      } catch (_) {}
    }
  }

  // Retrieve last record from database
  let lastRecord: any = null;
  let totalRecords = 0;
  try {
    lastRecord = db.prepare('SELECT * FROM external_backup_records ORDER BY created_at DESC LIMIT 1').get();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM external_backup_records WHERE status = "success"').get() as any;
    totalRecords = countRow?.count || 0;
  } catch (_) {}

  // If no DB record exists yet, check files on disk
  if (!lastRecord && fs.existsSync(EXTERNAL_BACKUP_DIR)) {
    const files = fs.readdirSync(EXTERNAL_BACKUP_DIR).filter((f) => f.endsWith('.zip'));
    totalRecords = files.length;
    if (files.length > 0) {
      const newest = files.map((f) => ({ f, st: fs.statSync(path.join(EXTERNAL_BACKUP_DIR, f)) }))
        .sort((a, b) => b.st.mtime.getTime() - a.st.mtime.getTime())[0];
      lastRecord = {
        filename: newest.f,
        created_at: newest.st.mtime.toISOString(),
        size_bytes: newest.st.size,
        size_formatted: formatBytes(newest.st.size),
        status: 'success',
        error_message: null,
      };
    }
  }

  return {
    isConfigured: true,
    destinationType: destInfo.type,
    destinationDisplay: destInfo.display,
    scheduleFrequency: 'Every 24 Hours & On-Demand',
    lastBackupTime: lastRecord?.created_at || null,
    lastBackupFilename: lastRecord?.filename || null,
    lastBackupSizeBytes: lastRecord?.size_bytes || 0,
    lastBackupSizeFormatted: lastRecord?.size_formatted || (lastRecord?.size_bytes ? formatBytes(lastRecord.size_bytes) : '0 B'),
    lastBackupStatus: (lastRecord?.status as any) || 'idle',
    lastBackupError: lastRecord?.error_message || null,
    totalExternalBackups: totalRecords,
    retentionMaxCount: 30,
    dbSizeBytes: dbStats.size,
    dbSizeFormatted: formatBytes(dbStats.size),
    uploadsSizeBytes: uploadsSize,
    uploadsSizeFormatted: formatBytes(uploadsSize),
    totalUploadFiles,
  };
}

/**
 * List all external disaster recovery backup records
 */
export function listExternalBackups(): ExternalBackupRecord[] {
  try {
    const records = db.prepare(`
      SELECT * FROM external_backup_records ORDER BY created_at DESC LIMIT 50
    `).all() as ExternalBackupRecord[];
    return records;
  } catch {
    return [];
  }
}

/**
 * COMPLETE RESTORATION:
 * Restores BOTH the SQLite database records AND all uploaded files from a complete project archive (.ZIP).
 * 
 * Safety steps:
 * 1. Creates a pre-restore safety snapshot of the active database.
 * 2. Unpacks the ZIP archive with zip-slip security sanitation.
 * 3. Validates the extracted SQLite database integrity.
 * 4. Atomically replaces data/project.db.
 * 5. Extracts all files in the archive's uploads/ folder to server uploads/ directory.
 * 6. Returns detailed restoration statistics.
 */
export async function restoreCompleteProjectArchive(
  zipPathOrBuffer: string | Buffer,
  adminUserName: string = 'Administrator'
): Promise<ArchiveRestoreResult> {
  const tempExtractDir = path.join(BACKUPS_DIR, `temp_restore_${Date.now()}`);

  try {
    // 1. Create a pre-restore safety snapshot of current database
    await createDatabaseBackup('manual', 'Pre-archive-restore safety snapshot');

    // 2. Open ZIP archive using AdmZip
    const zip = typeof zipPathOrBuffer === 'string'
      ? new AdmZip(zipPathOrBuffer)
      : new AdmZip(zipPathOrBuffer);

    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) {
      throw new Error('The uploaded archive is empty or corrupted.');
    }

    // 3. Verify archive contains either database/project.db or project.db
    let dbEntry = zipEntries.find((e: any) => e.entryName === 'database/project.db' || e.entryName === 'project.db');
    if (!dbEntry) {
      throw new Error('Invalid project archive: missing "database/project.db" inside the ZIP bundle.');
    }

    fs.mkdirSync(tempExtractDir, { recursive: true });

    // 4. Safe extraction with Zip-Slip path sanitization
    const restoredFiles: string[] = [];
    let manifestData: any = null;
    const tempDbPath = path.join(tempExtractDir, 'project.db');

    // Extract manifest if present
    const manifestEntry = zipEntries.find((e: any) => e.entryName === 'manifest.json');
    if (manifestEntry) {
      try {
        manifestData = JSON.parse(manifestEntry.getData().toString('utf8'));
      } catch (_) {}
    }

    // Extract DB file to temporary location
    fs.writeFileSync(tempDbPath, dbEntry.getData());

    // Verify SQLite integrity of the extracted database file
    const tempDb = new (db.constructor as any)(tempDbPath);
    const integrityRow = tempDb.pragma('integrity_check') as any[];
    const isIntegrityOk = integrityRow && integrityRow[0]?.integrity_check === 'ok';

    if (!isIntegrityOk) {
      tempDb.close();
      throw new Error('Database integrity check failed on the archive SQLite database file.');
    }

    // 5. Restore active database: close source connection & perform atomic restore
    db.pragma('wal_checkpoint(TRUNCATE)');
    await tempDb.backup(DB_PATH);
    tempDb.close();

    // 6. Extract all files in uploads/
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName.replace(/\\/g, '/');

      // Check if file is inside uploads/
      if (entryName.startsWith('uploads/') && entryName !== 'uploads/') {
        const relativeFilename = entryName.replace(/^uploads\//, '');
        // Zip-slip security check: ensure no '..' traversal
        const safeBase = path.basename(relativeFilename);
        if (safeBase && !safeBase.startsWith('.')) {
          const targetFilePath = path.join(UPLOADS_DIR, safeBase);
          fs.writeFileSync(targetFilePath, entry.getData());
          restoredFiles.push(safeBase);
        }
      }
    }

    const restoredDbStats = fs.statSync(DB_PATH);
    const databaseSizeFormatted = formatBytes(restoredDbStats.size);

    logActivity(
      adminUserName,
      null,
      `restored complete project archive (Database: ${databaseSizeFormatted}, Uploaded Files: ${restoredFiles.length})`,
      'Disaster Recovery',
      'Complete Project Restore'
    );

    return {
      success: true,
      restoredDb: true,
      restoredUploadsCount: restoredFiles.length,
      restoredFiles,
      databaseSizeFormatted,
      manifest: manifestData,
      message: `Successfully restored database (${databaseSizeFormatted}) and ${restoredFiles.length} uploaded files.`,
    };
  } catch (err: any) {
    console.error('Error during complete archive restoration:', err);
    throw new Error(`Archive restoration failed: ${err.message}`);
  } finally {
    // Clean up temporary extraction folder
    if (fs.existsSync(tempExtractDir)) {
      try {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }
}

/**
 * Helper to optionally post archive to a remote webhook or cloud endpoint if configured
 */
async function postToRemoteBackupEndpoint(zipPath: string, manifest: any) {
  if (!EXTERNAL_BACKUP_ENDPOINT) return;

  const fetch = (globalThis as any).fetch;
  if (!fetch) return;

  const fileStats = fs.statSync(zipPath);
  const stream = fs.createReadStream(zipPath);

  await fetch(EXTERNAL_BACKUP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'X-Backup-Filename': path.basename(zipPath),
      'X-Backup-Size': String(fileStats.size),
      ...(EXTERNAL_BACKUP_API_KEY ? { Authorization: `Bearer ${EXTERNAL_BACKUP_API_KEY}` } : {}),
      'X-Backup-Manifest': Buffer.from(JSON.stringify(manifest)).toString('base64'),
    },
    body: stream,
    duplex: 'half',
  });
}

/**
 * Initializes external disaster recovery scheduler (runs daily alongside local snapshots)
 */
export function initExternalBackupsScheduler() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run initial external backup check after 30 seconds of server startup
  setTimeout(() => {
    const status = getExternalBackupStatus();
    if (status.totalExternalBackups === 0) {
      createExternalProjectBackup('Server Startup Baseline').catch((err) => {
        console.error('Initial external disaster recovery backup error:', err);
      });
    }
  }, 30000);

  // Scheduled daily external disaster recovery archive creation
  setInterval(() => {
    createExternalProjectBackup('Automated Daily Disaster Recovery Schedule').catch((err) => {
      console.error('Daily automated external disaster recovery backup error:', err);
    });
  }, TWENTY_FOUR_HOURS);
}
