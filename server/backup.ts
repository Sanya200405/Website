import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { db, logActivity } from './db';

const require = createRequire(import.meta.url);
const admZipPkg = require('adm-zip');
const AdmZip = typeof admZipPkg === 'function' ? admZipPkg : admZipPkg.default || admZipPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKUPS_DIR = process.env.BACKUPS_DIR ? path.resolve(process.env.BACKUPS_DIR) : path.resolve(__dirname, '../data/backups');
export const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve(__dirname, '../uploads');
export const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(__dirname, '../data/project.db');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface BackupMetadata {
  filename: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  type: 'automated' | 'manual';
  isLatest?: boolean;
}

export interface BackupStatusInfo {
  autoBackupEnabled: boolean;
  frequency: string;
  retentionMaxCount: number;
  totalBackups: number;
  lastBackupTime: string | null;
  lastBackupFilename: string | null;
  storageLocation: string;
  dbSizeBytes: number;
  dbSizeFormatted: string;
  uploadsSizeBytes: number;
  uploadsSizeFormatted: string;
  totalFiles: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates an atomic database snapshot using SQLite's native backup engine
 */
export async function createDatabaseBackup(type: 'automated' | 'manual' = 'manual', reason: string = ''): Promise<BackupMetadata> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `project_backup_${timestamp}_${type}.db`;
  const destPath = path.join(BACKUPS_DIR, filename);

  // Perform native atomic SQLite backup
  await db.backup(destPath);

  const stats = fs.statSync(destPath);
  const metadata: BackupMetadata = {
    filename,
    filePath: destPath,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    createdAt: new Date().toISOString(),
    type,
  };

  // Record in backup_records table
  try {
    const id = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO backup_records (id, filename, file_path, size_bytes, size_formatted, backup_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, filename, destPath, stats.size, metadata.sizeFormatted, type, 'completed', metadata.createdAt);
  } catch (err) {
    console.error('Failed to log backup to database table:', err);
  }

  logActivity('System Backup Engine', null, `created ${type} snapshot ${reason ? `(${reason})` : ''}`, 'Backup', filename);

  // Apply retention policy: keep latest 14 snapshots
  enforceBackupRetention(14);

  return metadata;
}

/**
 * List all available database snapshots sorted newest first
 */
export function listBackups(): BackupMetadata[] {
  if (!fs.existsSync(BACKUPS_DIR)) return [];

  const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.db') || f.endsWith('.sqlite'));
  const backups: BackupMetadata[] = [];

  for (const filename of files) {
    try {
      const fullPath = path.join(BACKUPS_DIR, filename);
      const stats = fs.statSync(fullPath);
      const isAuto = filename.includes('_automated');

      backups.push({
        filename,
        filePath: fullPath,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: stats.mtime.toISOString(),
        type: isAuto ? 'automated' : 'manual',
      });
    } catch {
      // ignore individual stat errors
    }
  }

  // Sort descending by creation time
  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (backups.length > 0) {
    backups[0].isLatest = true;
  }

  return backups;
}

/**
 * Get comprehensive backup health and storage overview
 */
export function getBackupStatus(): BackupStatusInfo {
  const backups = listBackups();
  const dbStats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : { size: 0 };

  let uploadsSize = 0;
  let totalFiles = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    totalFiles = uploadFiles.length;
    for (const f of uploadFiles) {
      try {
        uploadsSize += fs.statSync(path.join(UPLOADS_DIR, f)).size;
      } catch (_) {}
    }
  }

  return {
    autoBackupEnabled: true,
    frequency: 'Every 24 Hours & Pre-Restore Snapshot',
    retentionMaxCount: 14,
    totalBackups: backups.length,
    lastBackupTime: backups.length > 0 ? backups[0].createdAt : null,
    lastBackupFilename: backups.length > 0 ? backups[0].filename : null,
    storageLocation: 'data/backups/ (Persistent SQLite Native Snapshots)',
    dbSizeBytes: dbStats.size,
    dbSizeFormatted: formatBytes(dbStats.size),
    uploadsSizeBytes: uploadsSize,
    uploadsSizeFormatted: formatBytes(uploadsSize),
    totalFiles,
  };
}

/**
 * Enforce maximum number of backup snapshots to prevent unbounded disk growth
 */
export function enforceBackupRetention(maxRetained: number = 14) {
  const backups = listBackups();
  if (backups.length <= maxRetained) return;

  const toRemove = backups.slice(maxRetained);
  for (const bk of toRemove) {
    try {
      if (fs.existsSync(bk.filePath)) {
        fs.unlinkSync(bk.filePath);
      }
      db.prepare('DELETE FROM backup_records WHERE filename = ?').run(bk.filename);
    } catch (e) {
      console.error(`Failed to prune old backup ${bk.filename}:`, e);
    }
  }
}

/**
 * Restores the active database from a chosen snapshot.
 * Before restoration, creates a safety backup of current state.
 */
export async function restoreDatabaseFromSnapshot(filename: string): Promise<boolean> {
  const sanitized = path.basename(filename);
  const snapshotPath = path.join(BACKUPS_DIR, sanitized);

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Backup snapshot file ${sanitized} does not exist.`);
  }

  // 1. Create a safety backup of the current database before restoring
  await createDatabaseBackup('manual', 'Pre-restore safety snapshot');

  // 2. Perform restoration
  // SQLite cannot overwrite the open DB file directly in WAL mode easily without either
  // closing connections or copying tables.
  // Best approach: Close WAL checkpoints, and execute a schema/data sync or atomic file copy.
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    const sourceDb = new (db.constructor as any)(snapshotPath);
    await sourceDb.backup(DB_PATH);
    sourceDb.close();
    return true;
  } catch (err: any) {
    console.error('Error during database restoration:', err);
    throw new Error(`Failed to restore database from snapshot: ${err.message}`);
  }
}

/**
 * Generate full JSON export of all database tables and relations
 */
export function getFullProjectJsonDump(): Record<string, any> {
  return {
    export_version: '2.0.0',
    export_timestamp: new Date().toISOString(),
    project: db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_foc_main'),
    motor_parameters: db.prepare('SELECT * FROM motor_parameters WHERE id = ?').get('motor_main') || null,
    team_members: db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members').all(),
    milestones: db.prepare('SELECT * FROM milestones').all(),
    tasks: db.prepare('SELECT * FROM tasks').all(),
    tests: db.prepare('SELECT * FROM tests').all(),
    test_measurements: db.prepare('SELECT * FROM test_measurements').all(),
    issues: db.prepare('SELECT * FROM issues').all(),
    documents: db.prepare('SELECT * FROM documents').all(),
    research_papers: db.prepare('SELECT * FROM research_papers').all(),
    learning_resources: db.prepare('SELECT * FROM learning_resources').all(),
    engineering_notes: db.prepare('SELECT * FROM engineering_notes').all(),
    simulation_models: db.prepare('SELECT * FROM simulation_models').all(),
    simulation_experiment_links: db.prepare('SELECT * FROM simulation_experiment_links').all(),
    report_sections: db.prepare('SELECT * FROM report_sections').all(),
    report_links: db.prepare('SELECT * FROM report_links').all(),
    meetings: db.prepare('SELECT * FROM meetings').all(),
    activities: db.prepare('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 250').all(),
    backup_records: db.prepare('SELECT * FROM backup_records ORDER BY created_at DESC LIMIT 50').all(),
    stored_files: (() => {
      try {
        return db.prepare('SELECT file_name, mime_type, size_bytes, data_base64, created_at FROM stored_files').all();
      } catch (_) {
        return [];
      }
    })(),
  };
}

/**
 * Streams a complete ZIP archive bundle containing:
 * 1. project.db (raw SQLite file)
 * 2. project_data_dump.json (full relational JSON)
 * 3. uploads/ (all uploaded files, PDFs, CSVs, datasheets)
 */
export async function createProjectZipArchive(res: any): Promise<void> {
  const zip = new AdmZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempDbSnapshot = path.join(BACKUPS_DIR, `temp_zip_${timestamp}.db`);

  try {
    // 1. Add database snapshot
    await db.backup(tempDbSnapshot);
    zip.addLocalFile(tempDbSnapshot, 'database', 'project.db');

    // 2. Add JSON data dump
    const jsonDump = JSON.stringify(getFullProjectJsonDump(), null, 2);
    zip.addFile('database/project_data_dump.json', Buffer.from(jsonDump, 'utf8'));

    // 3. Add all uploaded files
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

    // 4. Add README metadata
    const readmeContent = `# FOC Drive Project Complete Archive Bundle
Exported at: ${new Date().toISOString()}

This archive contains all persistent engineering project data:
- /database/project.db: Full relational SQLite database file
- /database/project_data_dump.json: Platform-agnostic JSON dump of all tables, papers, notes, tests, and tasks
- /uploads/: All attached documents, datasheets, CSV test datasets, and research paper PDFs.

To restore this project on any system or server:
1. Place project.db in the server's data/ folder.
2. Place the uploads/ files into the server's uploads/ folder.
`;
    zip.addFile('README_PROJECT_ARCHIVE.txt', Buffer.from(readmeContent, 'utf8'));

    const buffer = zip.toBuffer();
    res.send(buffer);
  } finally {
    if (fs.existsSync(tempDbSnapshot)) {
      try { fs.unlinkSync(tempDbSnapshot); } catch (_) {}
    }
  }
}

/**
 * Initializes automated backup scheduler (runs on server startup and daily)
 */
export function initAutomatedBackups() {
  // Check if we need to create an initial snapshot on startup
  const backups = listBackups();
  if (backups.length === 0) {
    createDatabaseBackup('automated', 'Initial server startup baseline snapshot').catch((err) => {
      console.error('Failed to create initial startup snapshot:', err);
    });
  }

  // Schedule daily backup every 24 hours (86,400,000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    createDatabaseBackup('automated', 'Automated daily scheduled backup').catch((err) => {
      console.error('Failed to create daily automated backup snapshot:', err);
    });
  }, TWENTY_FOUR_HOURS);
}
