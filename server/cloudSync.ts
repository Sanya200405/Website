import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { db, logActivity } from './db';
import { DB_PATH, UPLOADS_DIR, BACKUPS_DIR, getFullProjectJsonDump } from './backup';

const require = createRequire(import.meta.url);
const admZipPkg = require('adm-zip');
const AdmZip = typeof admZipPkg === 'function' ? admZipPkg : admZipPkg.default || admZipPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CLOUD_VAULT_DIR = process.env.CLOUD_VAULT_DIR
  ? path.resolve(process.env.CLOUD_VAULT_DIR)
  : path.resolve(__dirname, '../data/cloud_vault');

const SEED_DB_PATH = path.resolve(__dirname, 'project_seed.db');

if (!fs.existsSync(CLOUD_VAULT_DIR)) {
  try {
    fs.mkdirSync(CLOUD_VAULT_DIR, { recursive: true });
  } catch (_) {}
}

export interface CloudSyncStatus {
  enabled: boolean;
  provider: string;
  providerDisplay: string;
  lastSyncTime: string | null;
  lastSyncStatus: 'synced' | 'syncing' | 'failed' | 'idle';
  lastSyncError: string | null;
  lastSnapshotSizeFormatted: string;
  totalRecordsSynced: number;
  totalUploadsSynced: number;
  autoSyncOnWrite: boolean;
  isColdBootRestored: boolean;
  history: CloudSyncRecord[];
}

export interface CloudSyncRecord {
  id: string;
  provider: string;
  snapshot_version: string;
  total_records: number;
  uploads_count: number;
  size_bytes: number;
  size_formatted: string;
  status: string;
  error_message: string | null;
  sync_type: string;
  created_at: string;
}

// In-memory sync state
let isSyncing = false;
let isHydrating = false;
let isColdBootRestored = false;
let debounceTimer: NodeJS.Timeout | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncError: string | null = null;
let lastSyncStatus: 'synced' | 'syncing' | 'failed' | 'idle' = 'idle';
let lastSnapshotSizeFormatted = '0 B';
let lastTotalRecords = 0;
let lastTotalUploads = 0;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Reads config key from database or environment
 */
export function getVaultConfig(key: string, envFallback: string = ''): string {
  try {
    const row = db.prepare('SELECT value FROM cloud_sync_config WHERE key = ?').get(key) as { value: string } | undefined;
    if (row && row.value) return row.value;
  } catch (_) {}
  return process.env[key] || envFallback;
}

/**
 * Saves config key to database
 */
export function setVaultConfig(key: string, value: string) {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO cloud_sync_config (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, now);
  } catch (err: any) {
    console.error(`Failed to persist vault config ${key}:`, err.message);
  }
}

/**
 * Get active cloud provider description
 */
function getActiveProviderInfo(): { id: string; display: string } {
  const customEndpoint = getVaultConfig('CLOUD_VAULT_ENDPOINT');
  const githubToken = getVaultConfig('GITHUB_TOKEN');
  const gistId = getVaultConfig('CLOUD_VAULT_GIST_ID');

  if (customEndpoint) {
    return { id: 'webhook', display: 'Custom Remote Cloud Vault API' };
  }
  if (githubToken && gistId) {
    return { id: 'github_gist', display: `GitHub Cloud Vault Gist (${gistId.substring(0, 8)}...)` };
  }
  if (githubToken) {
    return { id: 'github_api', display: 'GitHub Cloud Vault Storage' };
  }
  return { id: 'vault_local', display: 'Self-Hydrating Resilient Cloud Seed Vault' };
}

/**
 * Counts all primary relational records in SQLite
 */
export function countTotalRelationalRecords(): number {
  let count = 0;
  const tables = [
    'team_members', 'tasks', 'task_assignments', 'milestones', 'meetings',
    'documents', 'reading_assignments', 'research_papers', 'learning_resources',
    'engineering_notes', 'tests', 'test_measurements', 'issues',
    'simulation_models', 'report_sections'
  ];
  for (const tbl of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as c FROM ${tbl} WHERE deleted_at IS NULL`).get() as any;
      if (row?.c) count += Number(row.c);
    } catch (_) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as c FROM ${tbl}`).get() as any;
        if (row?.c) count += Number(row.c);
      } catch (_) {}
    }
  }
  return count;
}

/**
 * Builds full state snapshot package
 */
export async function buildCloudSnapshotPackage(): Promise<{
  manifest: any;
  jsonDump: any;
  zipBuffer: Buffer;
  dbBuffer: Buffer;
  uploadsCount: number;
  totalRecords: number;
}> {
  const timestamp = new Date().toISOString();
  const tempDbPath = path.join(CLOUD_VAULT_DIR, `temp_sync_${Date.now()}.db`);

  try {
    // 1. Snapshot active database
    await db.backup(tempDbPath);
    const dbBuffer = fs.readFileSync(tempDbPath);
    const dbHash = crypto.createHash('sha256').update(dbBuffer).digest('hex');

    // 2. Relational JSON dump
    const jsonDump = getFullProjectJsonDump();
    const totalRecords = countTotalRelationalRecords();

    // 3. Collect uploads
    let totalUploadsCount = 0;
    const zip = new AdmZip();
    zip.addLocalFile(tempDbPath, 'database', 'project.db');
    zip.addFile('database/project_data_dump.json', Buffer.from(JSON.stringify(jsonDump, null, 2), 'utf8'));

    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const f of files) {
        const fullPath = path.join(UPLOADS_DIR, f);
        try {
          if (fs.statSync(fullPath).isFile()) {
            zip.addLocalFile(fullPath, 'uploads');
            totalUploadsCount++;
          }
        } catch (_) {}
      }
    }

    const manifest = {
      version: '3.0.0',
      type: 'foc_cloud_vault_snapshot',
      created_at: timestamp,
      total_records: totalRecords,
      total_uploads: totalUploadsCount,
      db_sha256: dbHash,
      db_size_bytes: dbBuffer.length,
    };

    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
    const zipBuffer = zip.toBuffer();

    return {
      manifest,
      jsonDump,
      zipBuffer,
      dbBuffer,
      uploadsCount: totalUploadsCount,
      totalRecords,
    };
  } finally {
    if (fs.existsSync(tempDbPath)) {
      try { fs.unlinkSync(tempDbPath); } catch (_) {}
    }
  }
}

/**
 * Pushes full snapshot to Cloud Vault
 */
export async function pushToCloudVault(
  initiatedBy: string = 'Automated Cloud Sync',
  syncType: string = 'auto_write'
): Promise<CloudSyncRecord> {
  if (isSyncing) {
    console.log('[Cloud Sync] Sync already in progress, skipping overlapping trigger.');
    return {
      id: 'skipped',
      provider: getActiveProviderInfo().id,
      snapshot_version: '3.0.0',
      total_records: lastTotalRecords,
      uploads_count: lastTotalUploads,
      size_bytes: 0,
      size_formatted: lastSnapshotSizeFormatted,
      status: 'synced',
      error_message: null,
      sync_type: syncType,
      created_at: new Date().toISOString(),
    };
  }

  isSyncing = true;
  lastSyncStatus = 'syncing';
  const startTime = Date.now();
  const recordId = 'cs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();
  const provider = getActiveProviderInfo();

  try {
    const pkg = await buildCloudSnapshotPackage();
    const sizeFormatted = formatBytes(pkg.zipBuffer.length);
    lastTotalRecords = pkg.totalRecords;
    lastTotalUploads = pkg.uploadsCount;
    lastSnapshotSizeFormatted = sizeFormatted;

    // 1. Update local seed DB copy so static Docker images have newest baseline
    try {
      if (fs.existsSync(path.dirname(SEED_DB_PATH))) {
        fs.writeFileSync(SEED_DB_PATH, pkg.dbBuffer);
      }
    } catch (_) {}

    // 2. Write local persistent vault snapshot
    const localVaultZip = path.join(CLOUD_VAULT_DIR, 'latest_cloud_vault_bundle.zip');
    const localVaultJson = path.join(CLOUD_VAULT_DIR, 'latest_cloud_snapshot.json');
    fs.writeFileSync(localVaultZip, pkg.zipBuffer);
    fs.writeFileSync(localVaultJson, JSON.stringify({
      manifest: pkg.manifest,
      jsonDump: pkg.jsonDump,
    }, null, 2));

    // 3. Push to Remote Webhook if configured
    const endpoint = getVaultConfig('CLOUD_VAULT_ENDPOINT');
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vault-Auth': getVaultConfig('CLOUD_VAULT_API_KEY', ''),
          },
          body: JSON.stringify({
            manifest: pkg.manifest,
            jsonDump: pkg.jsonDump,
            zipBase64: pkg.zipBuffer.toString('base64'),
          }),
        });
      } catch (remErr: any) {
        console.warn('[Cloud Sync] Remote webhook push warning:', remErr.message);
      }
    }

    // 4. Push to GitHub Gist if GitHub Token exists
    const ghToken = getVaultConfig('GITHUB_TOKEN');
    if (ghToken) {
      try {
        await syncToGitHubGist(ghToken, pkg);
      } catch (ghErr: any) {
        console.warn('[Cloud Sync] GitHub Gist cloud vault warning:', ghErr.message);
      }
    }

    lastSyncTimestamp = now;
    lastSyncStatus = 'synced';
    lastSyncError = null;

    const record: CloudSyncRecord = {
      id: recordId,
      provider: provider.id,
      snapshot_version: pkg.manifest.version,
      total_records: pkg.totalRecords,
      uploads_count: pkg.uploadsCount,
      size_bytes: pkg.zipBuffer.length,
      size_formatted: sizeFormatted,
      status: 'success',
      error_message: null,
      sync_type: syncType,
      created_at: now,
    };

    // Save record to DB
    try {
      db.prepare(`
        INSERT INTO cloud_sync_records (
          id, provider, snapshot_version, total_records, uploads_count,
          size_bytes, size_formatted, status, error_message, sync_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.id, record.provider, record.snapshot_version, record.total_records,
        record.uploads_count, record.size_bytes, record.size_formatted,
        record.status, record.error_message, record.sync_type, record.created_at
      );
    } catch (_) {}

    logActivity(
      initiatedBy,
      null,
      `synced full project state (${pkg.totalRecords} records, ${sizeFormatted}) to ${provider.display}`,
      'Cloud Sync Vault',
      'Auto-Sync Snapshot'
    );

    return record;
  } catch (err: any) {
    lastSyncStatus = 'failed';
    lastSyncError = err.message;
    console.error('[Cloud Sync Error]:', err);

    const failRecord: CloudSyncRecord = {
      id: recordId,
      provider: provider.id,
      snapshot_version: '3.0.0',
      total_records: 0,
      uploads_count: 0,
      size_bytes: 0,
      size_formatted: '0 B',
      status: 'failed',
      error_message: err.message,
      sync_type: syncType,
      created_at: now,
    };

    try {
      db.prepare(`
        INSERT INTO cloud_sync_records (
          id, provider, snapshot_version, total_records, uploads_count,
          size_bytes, size_formatted, status, error_message, sync_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        failRecord.id, failRecord.provider, failRecord.snapshot_version,
        failRecord.total_records, failRecord.uploads_count, failRecord.size_bytes,
        failRecord.size_formatted, failRecord.status, failRecord.error_message,
        failRecord.sync_type, failRecord.created_at
      );
    } catch (_) {}

    throw err;
  } finally {
    isSyncing = false;
  }
}

/**
 * GitHub Gist Cloud Vault Integration
 */
async function syncToGitHubGist(token: string, pkg: any) {
  let gistId = getVaultConfig('CLOUD_VAULT_GIST_ID');
  const gistPayload = {
    description: 'ProjectDrive 24/7 Automated Cloud Vault Snapshot',
    public: false,
    files: {
      'project_vault_manifest.json': {
        content: JSON.stringify(pkg.manifest, null, 2),
      },
      'project_data_dump.json': {
        content: JSON.stringify(pkg.jsonDump, null, 2),
      },
    },
  };

  if (!gistId) {
    // Create new private Gist
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ProjectDrive-CloudSync/3.0',
      },
      body: JSON.stringify(gistPayload),
    });
    if (res.ok) {
      const data = await res.json();
      gistId = data.id;
      setVaultConfig('CLOUD_VAULT_GIST_ID', gistId);
      console.log(`[Cloud Sync] Created dedicated Cloud Vault Gist ID: ${gistId}`);
    }
  } else {
    // Update existing Gist
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ProjectDrive-CloudSync/3.0',
      },
      body: JSON.stringify(gistPayload),
    });
  }
}

/**
 * Restores complete state from a Cloud Vault ZIP buffer or dump
 */
export async function restoreFromCloudVaultBundle(zipBuffer: Buffer, initiatedBy: string = 'Cold Boot Auto-Hydration'): Promise<boolean> {
  const tempExtractDir = path.join(CLOUD_VAULT_DIR, `temp_restore_${Date.now()}`);

  try {
    isHydrating = true;
    const zip = new AdmZip(zipBuffer);
    const dbEntry = zip.getEntry('database/project.db') || zip.getEntry('project.db');

    if (!dbEntry) {
      throw new Error('Cloud Vault bundle missing database/project.db');
    }

    fs.mkdirSync(tempExtractDir, { recursive: true });
    const tempDbPath = path.join(tempExtractDir, 'project.db');
    fs.writeFileSync(tempDbPath, dbEntry.getData());

    // Validate SQLite integrity
    const tempDb = new (db.constructor as any)(tempDbPath);
    const integrityRow = tempDb.pragma('integrity_check') as any[];
    const isIntegrityOk = integrityRow && integrityRow[0]?.integrity_check === 'ok';

    if (!isIntegrityOk) {
      tempDb.close();
      throw new Error('Cloud Vault SQLite integrity check failed');
    }

    // Atomic DB Restore
    db.pragma('wal_checkpoint(TRUNCATE)');
    await tempDb.backup(DB_PATH);
    tempDb.close();

    // Extract uploads
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    let restoredUploads = 0;
    const entries = zip.getEntries();
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const name = entry.entryName.replace(/\\/g, '/');
      if (name.startsWith('uploads/') && name !== 'uploads/') {
        const base = path.basename(name);
        if (base && !base.startsWith('.')) {
          fs.writeFileSync(path.join(UPLOADS_DIR, base), entry.getData());
          restoredUploads++;
        }
      }
    }

    isColdBootRestored = true;
    logActivity(
      initiatedBy,
      null,
      `successfully restored full state (${countTotalRelationalRecords()} records, ${restoredUploads} files) from Cloud Vault`,
      'Disaster Recovery',
      'Cloud Auto-Hydration'
    );

    console.log(`[Cloud Sync] Successfully auto-hydrated ${countTotalRelationalRecords()} records and ${restoredUploads} uploads from Cloud Vault.`);
    return true;
  } finally {
    isHydrating = false;
    if (fs.existsSync(tempExtractDir)) {
      try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

/**
 * Hydrates state from JSON dump when raw ZIP is not available
 */
export async function restoreFromJsonDump(jsonDump: any, initiatedBy: string = 'JSON Cloud Hydration'): Promise<boolean> {
  try {
    isHydrating = true;
    db.transaction(() => {
      // 1. Projects
      if (jsonDump.project) {
        const p = jsonDump.project;
        db.prepare(`
          INSERT INTO projects (id, name, description, status, start_date, target_date, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name, description = excluded.description,
            status = excluded.status, start_date = excluded.start_date,
            target_date = excluded.target_date
        `).run(p.id, p.name, p.description, p.status, p.start_date, p.target_date, p.created_at);
      }

      // 2. Motor Parameters
      if (jsonDump.motor_parameters) {
        const m = jsonDump.motor_parameters;
        db.prepare(`
          INSERT INTO motor_parameters (
            id, project_id, motor_model, rated_voltage_v, rated_current_a, peak_current_a,
            pole_pairs, kv_rating, phase_resistance_ohm, phase_inductance_uh, max_rpm,
            rated_speed_rpm, continuous_torque_nm, peak_torque_nm, gear_ratio, gearbox_type,
            gearbox_efficiency, inverter_topology, pwm_frequency_khz, current_sensing_type,
            encoder_type, encoder_cpr, thermal_limit_c, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            motor_model = excluded.motor_model, rated_voltage_v = excluded.rated_voltage_v,
            rated_current_a = excluded.rated_current_a, peak_current_a = excluded.peak_current_a,
            pole_pairs = excluded.pole_pairs, kv_rating = excluded.kv_rating,
            phase_resistance_ohm = excluded.phase_resistance_ohm, phase_inductance_uh = excluded.phase_inductance_uh,
            max_rpm = excluded.max_rpm, rated_speed_rpm = excluded.rated_speed_rpm,
            continuous_torque_nm = excluded.continuous_torque_nm, peak_torque_nm = excluded.peak_torque_nm,
            gear_ratio = excluded.gear_ratio, gearbox_type = excluded.gearbox_type,
            gearbox_efficiency = excluded.gearbox_efficiency, inverter_topology = excluded.inverter_topology,
            pwm_frequency_khz = excluded.pwm_frequency_khz, current_sensing_type = excluded.current_sensing_type,
            encoder_type = excluded.encoder_type, encoder_cpr = excluded.encoder_cpr,
            thermal_limit_c = excluded.thermal_limit_c, notes = excluded.notes, updated_at = excluded.updated_at
        `).run(
          m.id, m.project_id, m.motor_model, m.rated_voltage_v, m.rated_current_a, m.peak_current_a,
          m.pole_pairs, m.kv_rating, m.phase_resistance_ohm, m.phase_inductance_uh, m.max_rpm,
          m.rated_speed_rpm, m.continuous_torque_nm, m.peak_torque_nm, m.gear_ratio, m.gearbox_type,
          m.gearbox_efficiency, m.inverter_topology, m.pwm_frequency_khz, m.current_sensing_type,
          m.encoder_type, m.encoder_cpr, m.thermal_limit_c, m.notes, m.created_at, m.updated_at || m.created_at
        );
      }

      // 3. Team Members
      if (Array.isArray(jsonDump.team_members)) {
        const stmt = db.prepare(`
          INSERT INTO team_members (id, name, email, role, avatar, bio, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name, email = excluded.email, role = excluded.role,
            avatar = excluded.avatar, bio = excluded.bio, is_active = excluded.is_active
        `);
        for (const u of jsonDump.team_members) {
          stmt.run(u.id, u.name, u.email, u.role || 'member', u.avatar || null, u.bio || null, u.is_active ?? 1, u.created_at);
        }
      }

      // 4. Milestones
      if (Array.isArray(jsonDump.milestones)) {
        const stmt = db.prepare(`
          INSERT INTO milestones (id, project_id, title, description, status, assigned_member_id, start_date, due_date, completed_at, order_index, deleted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, description = excluded.description, status = excluded.status,
            assigned_member_id = excluded.assigned_member_id, start_date = excluded.start_date,
            due_date = excluded.due_date, completed_at = excluded.completed_at, order_index = excluded.order_index,
            deleted_at = excluded.deleted_at
        `);
        for (const m of jsonDump.milestones) {
          stmt.run(m.id, m.project_id, m.title, m.description, m.status, m.assigned_member_id, m.start_date, m.due_date, m.completed_at, m.order_index, m.deleted_at, m.created_at);
        }
      }

      // 5. Tasks & Assignments
      if (Array.isArray(jsonDump.tasks)) {
        const stmt = db.prepare(`
          INSERT INTO tasks (id, milestone_id, title, description, assigned_to_id, status, priority, category, start_date, due_date, created_by_id, deleted_at, created_at, completed_at, is_all_members, assigned_member_ids)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            milestone_id = excluded.milestone_id, title = excluded.title, description = excluded.description,
            assigned_to_id = excluded.assigned_to_id, status = excluded.status, priority = excluded.priority,
            category = excluded.category, start_date = excluded.start_date, due_date = excluded.due_date,
            created_by_id = excluded.created_by_id, deleted_at = excluded.deleted_at, completed_at = excluded.completed_at,
            is_all_members = excluded.is_all_members, assigned_member_ids = excluded.assigned_member_ids
        `);
        for (const t of jsonDump.tasks) {
          stmt.run(
            t.id, t.milestone_id, t.title, t.description, t.assigned_to_id, t.status,
            t.priority, t.category, t.start_date, t.due_date, t.created_by_id,
            t.deleted_at, t.created_at, t.completed_at, t.is_all_members ?? 0, t.assigned_member_ids || null
          );
        }
      }

      // 6. Meetings
      if (Array.isArray(jsonDump.meetings)) {
        const stmt = db.prepare(`
          INSERT INTO meetings (id, title, date, start_time, end_time, meeting_link, location, description, notes, reminder, created_by_id, deleted_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, date = excluded.date, start_time = excluded.start_time,
            end_time = excluded.end_time, meeting_link = excluded.meeting_link, location = excluded.location,
            description = excluded.description, notes = excluded.notes, reminder = excluded.reminder,
            deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
        `);
        for (const m of jsonDump.meetings) {
          stmt.run(
            m.id, m.title, m.date, m.start_time, m.end_time, m.meeting_link,
            m.location, m.description, m.notes, m.reminder || 'none', m.created_by_id,
            m.deleted_at, m.created_at, m.updated_at || m.created_at
          );
        }
      }

      // 7. Documents
      if (Array.isArray(jsonDump.documents)) {
        const stmt = db.prepare(`
          INSERT INTO documents (id, file_name, file_url, file_size, uploaded_by_id, type, description, deleted_at, created_at, is_all_members, assigned_member_ids, due_date, instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            file_name = excluded.file_name, file_url = excluded.file_url, file_size = excluded.file_size,
            uploaded_by_id = excluded.uploaded_by_id, type = excluded.type, description = excluded.description,
            deleted_at = excluded.deleted_at, is_all_members = excluded.is_all_members,
            assigned_member_ids = excluded.assigned_member_ids, due_date = excluded.due_date, instructions = excluded.instructions
        `);
        for (const d of jsonDump.documents) {
          stmt.run(
            d.id, d.file_name, d.file_url, d.file_size, d.uploaded_by_id, d.type,
            d.description, d.deleted_at, d.created_at, d.is_all_members ?? 0,
            d.assigned_member_ids || null, d.due_date || null, d.instructions || null
          );
        }
      }

      // 8. Research Papers
      if (Array.isArray(jsonDump.research_papers)) {
        const stmt = db.prepare(`
          INSERT INTO research_papers (id, title, authors, year, journal_conference, doi, url, pdf_url, pdf_name, topic, tags, summary, notes, reading_status, added_by_id, deleted_at, created_at, updated_at, is_all_members, assigned_member_ids, due_date, instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, authors = excluded.authors, year = excluded.year,
            journal_conference = excluded.journal_conference, doi = excluded.doi, url = excluded.url,
            pdf_url = excluded.pdf_url, pdf_name = excluded.pdf_name, topic = excluded.topic,
            tags = excluded.tags, summary = excluded.summary, notes = excluded.notes,
            reading_status = excluded.reading_status, deleted_at = excluded.deleted_at,
            updated_at = excluded.updated_at, is_all_members = excluded.is_all_members,
            assigned_member_ids = excluded.assigned_member_ids, due_date = excluded.due_date,
            instructions = excluded.instructions
        `);
        for (const p of jsonDump.research_papers) {
          stmt.run(
            p.id, p.title, p.authors, p.year, p.journal_conference, p.doi, p.url,
            p.pdf_url, p.pdf_name, p.topic, p.tags, p.summary, p.notes,
            p.reading_status, p.added_by_id, p.deleted_at, p.created_at,
            p.updated_at || p.created_at, p.is_all_members ?? 0, p.assigned_member_ids || null,
            p.due_date || null, p.instructions || null
          );
        }
      }

      // 9. Engineering Notes
      if (Array.isArray(jsonDump.engineering_notes)) {
        const stmt = db.prepare(`
          INSERT INTO engineering_notes (id, title, content, tags, author_id, deleted_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, content = excluded.content, tags = excluded.tags,
            author_id = excluded.author_id, deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
        `);
        for (const n of jsonDump.engineering_notes) {
          stmt.run(n.id, n.title, n.content, n.tags, n.author_id, n.deleted_at, n.created_at, n.updated_at || n.created_at);
        }
      }

      // 10. Learning Resources
      if (Array.isArray(jsonDump.learning_resources)) {
        const stmt = db.prepare(`
          INSERT INTO learning_resources (id, title, url, resource_type, topic, description, tags, notes, added_by_id, deleted_at, created_at, is_all_members, assigned_member_ids, due_date, instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, url = excluded.url, resource_type = excluded.resource_type,
            topic = excluded.topic, description = excluded.description, tags = excluded.tags,
            notes = excluded.notes, deleted_at = excluded.deleted_at, is_all_members = excluded.is_all_members,
            assigned_member_ids = excluded.assigned_member_ids, due_date = excluded.due_date, instructions = excluded.instructions
        `);
        for (const lr of jsonDump.learning_resources) {
          stmt.run(
            lr.id, lr.title, lr.url, lr.resource_type, lr.topic, lr.description,
            lr.tags, lr.notes, lr.added_by_id, lr.deleted_at, lr.created_at,
            lr.is_all_members ?? 0, lr.assigned_member_ids || null, lr.due_date || null, lr.instructions || null
          );
        }
      }

      // 11. Tests & Measurements
      if (Array.isArray(jsonDump.tests)) {
        const stmt = db.prepare(`
          INSERT INTO tests (id, test_name, test_type, date, performed_by_id, status, observations, result, hardware_setup, supply_voltage_v, supply_current_a, pwm_freq_khz, deleted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            test_name = excluded.test_name, test_type = excluded.test_type, date = excluded.date,
            performed_by_id = excluded.performed_by_id, status = excluded.status, observations = excluded.observations,
            result = excluded.result, hardware_setup = excluded.hardware_setup, supply_voltage_v = excluded.supply_voltage_v,
            supply_current_a = excluded.supply_current_a, pwm_freq_khz = excluded.pwm_freq_khz, deleted_at = excluded.deleted_at
        `);
        for (const t of jsonDump.tests) {
          stmt.run(
            t.id, t.test_name, t.test_type, t.date, t.performed_by_id, t.status,
            t.observations, t.result, t.hardware_setup, t.supply_voltage_v,
            t.supply_current_a, t.pwm_freq_khz, t.deleted_at, t.created_at
          );
        }
      }

      // 12. Simulation Models
      if (Array.isArray(jsonDump.simulation_models)) {
        const stmt = db.prepare(`
          INSERT INTO simulation_models (id, name, description, purpose, github_path, status, milestone_id, objective, parameters, inputs, expected_output, results, conclusion, notes, created_by_id, deleted_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name, description = excluded.description, purpose = excluded.purpose,
            github_path = excluded.github_path, status = excluded.status, milestone_id = excluded.milestone_id,
            objective = excluded.objective, parameters = excluded.parameters, inputs = excluded.inputs,
            expected_output = excluded.expected_output, results = excluded.results, conclusion = excluded.conclusion,
            notes = excluded.notes, deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
        `);
        for (const s of jsonDump.simulation_models) {
          stmt.run(
            s.id, s.name, s.description, s.purpose, s.github_path, s.status,
            s.milestone_id, s.objective, s.parameters, s.inputs, s.expected_output,
            s.results, s.conclusion, s.notes, s.created_by_id, s.deleted_at, s.created_at,
            s.updated_at || s.created_at
          );
        }
      }

      // 13. Issues
      if (Array.isArray(jsonDump.issues)) {
        const stmt = db.prepare(`
          INSERT INTO issues (id, title, description, reported_by_id, assigned_to_id, priority, status, subsystem, possible_cause, solution, deleted_at, created_at, resolved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, description = excluded.description, reported_by_id = excluded.reported_by_id,
            assigned_to_id = excluded.assigned_to_id, priority = excluded.priority, status = excluded.status,
            subsystem = excluded.subsystem, possible_cause = excluded.possible_cause, solution = excluded.solution,
            deleted_at = excluded.deleted_at, resolved_at = excluded.resolved_at
        `);
        for (const i of jsonDump.issues) {
          stmt.run(
            i.id, i.title, i.description, i.reported_by_id, i.assigned_to_id,
            i.priority, i.status, i.subsystem, i.possible_cause, i.solution,
            i.deleted_at, i.created_at, i.resolved_at
          );
        }
      }

      // 14. Report Sections
      if (Array.isArray(jsonDump.report_sections)) {
        const stmt = db.prepare(`
          INSERT INTO report_sections (id, title, order_index, content, status, last_edited_by_id, last_edited_by_name, deleted_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title, order_index = excluded.order_index, content = excluded.content,
            status = excluded.status, last_edited_by_id = excluded.last_edited_by_id,
            last_edited_by_name = excluded.last_edited_by_name, deleted_at = excluded.deleted_at,
            updated_at = excluded.updated_at
        `);
        for (const r of jsonDump.report_sections) {
          stmt.run(
            r.id, r.title, r.order_index, r.content, r.status, r.last_edited_by_id,
            r.last_edited_by_name, r.deleted_at, r.created_at, r.updated_at || r.created_at
          );
        }
      }
    })();

    isColdBootRestored = true;
    logActivity(
      initiatedBy,
      null,
      `hydrated relational state (${countTotalRelationalRecords()} records) from Cloud Vault JSON dump`,
      'Disaster Recovery',
      'JSON Auto-Hydration'
    );
    return true;
  } finally {
    isHydrating = false;
  }
}

/**
 * Checks Cloud Vault on startup and auto-restores if container was cold-booted with missing data
 */
export async function performColdBootAutoHydration(): Promise<boolean> {
  const currentRecordCount = countTotalRelationalRecords();
  console.log(`[Cloud Sync] Cold boot check: Current active database has ${currentRecordCount} records.`);

  // 1. Check local persistent vault first
  const localVaultZip = path.join(CLOUD_VAULT_DIR, 'latest_cloud_vault_bundle.zip');
  const localVaultJson = path.join(CLOUD_VAULT_DIR, 'latest_cloud_snapshot.json');

  if (fs.existsSync(localVaultZip)) {
    try {
      const zipBuffer = fs.readFileSync(localVaultZip);
      const zip = new AdmZip(zipBuffer);
      const manifestEntry = zip.getEntry('manifest.json');
      if (manifestEntry) {
        const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
        if (manifest.total_records > currentRecordCount || currentRecordCount <= 6) {
          console.log(`[Cloud Sync] Local vault has ${manifest.total_records} records vs current ${currentRecordCount}. Auto-hydrating...`);
          await restoreFromCloudVaultBundle(zipBuffer, 'Local Vault Cold Boot Hydration');
          return true;
        }
      }
    } catch (e: any) {
      console.warn('[Cloud Sync] Local vault zip hydration failed:', e.message);
    }
  }

  // 2. Check GitHub Gist Cloud Vault if configured
  const ghToken = getVaultConfig('GITHUB_TOKEN');
  const gistId = getVaultConfig('CLOUD_VAULT_GIST_ID');
  if (ghToken && gistId) {
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `Bearer ${ghToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ProjectDrive-CloudSync/3.0',
        },
      });
      if (res.ok) {
        const gist = await res.json();
        const dumpFile = gist.files?.['project_data_dump.json'];
        if (dumpFile?.content) {
          const jsonDump = JSON.parse(dumpFile.content);
          console.log('[Cloud Sync] Remote GitHub Gist vault found. Auto-hydrating relational data...');
          await restoreFromJsonDump(jsonDump, 'GitHub Gist Cloud Vault Hydration');
          return true;
        }
      }
    } catch (ghErr: any) {
      console.warn('[Cloud Sync] Remote GitHub Gist check failed:', ghErr.message);
    }
  }

  return false;
}

/**
 * Debounced trigger called on every mutation (tasks, meetings, docs, etc.)
 */
export function triggerCloudSync(delayMs: number = 2000) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    pushToCloudVault('Automated Change Trigger', 'auto_write').catch((err) => {
      console.error('[Cloud Sync Background Worker Error]:', err);
    });
  }, delayMs);
}

/**
 * Returns full status information for Admin UI and Navigation Badge
 */
export function getCloudSyncStatus(): CloudSyncStatus {
  const provider = getActiveProviderInfo();
  let history: CloudSyncRecord[] = [];

  try {
    history = db.prepare(`
      SELECT * FROM cloud_sync_records ORDER BY created_at DESC LIMIT 10
    `).all() as CloudSyncRecord[];
  } catch (_) {}

  // If no DB record exists yet, check last sync timestamp
  if (!lastSyncTimestamp && history.length > 0) {
    lastSyncTimestamp = history[0].created_at;
    lastSyncStatus = history[0].status === 'success' ? 'synced' : 'failed';
    lastSnapshotSizeFormatted = history[0].size_formatted;
  }

  return {
    enabled: true,
    provider: provider.id,
    providerDisplay: provider.display,
    lastSyncTime: lastSyncTimestamp,
    lastSyncStatus: isSyncing ? 'syncing' : (lastSyncStatus || 'idle'),
    lastSyncError,
    lastSnapshotSizeFormatted,
    totalRecordsSynced: countTotalRelationalRecords(),
    totalUploadsSynced: fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0,
    autoSyncOnWrite: true,
    isColdBootRestored,
    history,
  };
}

/**
 * Initializes Cloud Sync on server boot:
 * 1. Checks and performs cold boot auto-hydration.
 * 2. Takes initial baseline snapshot if no cloud snapshot exists.
 * 3. Starts background periodic health sync check (every 15 minutes).
 */
export async function initCloudSync() {
  console.log('[Cloud Sync] Initializing 24/7 Automated Cloud Sync Engine...');

  try {
    await performColdBootAutoHydration();
  } catch (err: any) {
    console.error('[Cloud Sync] Cold boot auto-hydration error:', err.message);
  }

  // After 10s of server boot, perform baseline cloud snapshot
  setTimeout(() => {
    pushToCloudVault('Server Startup Baseline', 'startup_baseline').catch((err) => {
      console.error('[Cloud Sync] Initial baseline sync error:', err.message);
    });
  }, 10000);

  // Background recurring sync every 15 minutes to guarantee state alignment
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  setInterval(() => {
    pushToCloudVault('Periodic Sync Heartbeat', 'periodic_heartbeat').catch((err) => {
      console.warn('[Cloud Sync] Periodic heartbeat sync warning:', err.message);
    });
  }, FIFTEEN_MINUTES);
}
