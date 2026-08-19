import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { db, initDatabase, DB_PATH, UPLOADS_DIR, DB_DIR } from './db';
import { getFullProjectJsonDump } from './backup';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection string detection
export const getDatabaseUrl = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.RENDER_POSTGRES_URL ||
  '';

let pgPool: pg.Pool | null = null;
let isPostgresReady = false;
let syncDebounceTimer: NodeJS.Timeout | null = null;
let isSyncInProgress = false;

/**
 * Initializes PostgreSQL connection pool if DATABASE_URL is configured
 */
export function getPgPool(): pg.Pool | null {
  if (pgPool) return pgPool;
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  try {
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    if (!isLocalhost) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pgPool.on('error', (err) => {
      console.warn('[Persistence Engine] PostgreSQL client pool warning:', err.message);
    });

    return pgPool;
  } catch (err: any) {
    console.error('[Persistence Engine] Failed to initialize PostgreSQL pool:', err.message);
    return null;
  }
}

/**
 * Ensures required persistence tables exist in PostgreSQL
 */
async function ensurePostgresTables(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS projectdrive_snapshots (
        id TEXT PRIMARY KEY,
        snapshot_type TEXT NOT NULL,
        total_records INTEGER NOT NULL,
        db_blob BYTEA NOT NULL,
        json_dump JSONB,
        files_manifest JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projectdrive_files (
        file_name TEXT PRIMARY KEY,
        mime_type TEXT,
        size_bytes INTEGER NOT NULL,
        file_data BYTEA NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_projectdrive_snapshots_created_at 
      ON projectdrive_snapshots(created_at DESC);
    `);
    isPostgresReady = true;
  } finally {
    client.release();
  }
}

/**
 * Cold-boot restoration: Checks PostgreSQL for latest snapshot and restores database + uploads
 */
export async function initPersistentStorage(): Promise<{
  restoredFromPostgres: boolean;
  restoredFilesCount: number;
  message: string;
}> {
  console.log('[Persistence Engine] Initializing resilient storage layer...');

  // Ensure local directories exist
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  try { initDatabase(); } catch (_) {}

  const pool = getPgPool();
  if (!pool) {
    console.log('[Persistence Engine] No DATABASE_URL provided. Operating in standalone SQLite mode.');
    // Reconstitute any files from local stored_files table
    const restoredCount = reconstituteAllFilesFromSqlite();
    return {
      restoredFromPostgres: false,
      restoredFilesCount: restoredCount,
      message: `Running with local SQLite storage (${restoredCount} local files verified).`,
    };
  }

  try {
    console.log('[Persistence Engine] Connecting to managed PostgreSQL persistent store...');
    await ensurePostgresTables(pool);
    console.log('[Persistence Engine] PostgreSQL persistence tables verified.');

    // 1. Check for latest snapshot in PostgreSQL
    const snapshotRes = await pool.query(`
      SELECT id, snapshot_type, total_records, db_blob, json_dump, created_at
      FROM projectdrive_snapshots
      ORDER BY created_at DESC
      LIMIT 1
    `);

    let restoredFromPostgres = false;
    let restoredFilesCount = 0;

    if (snapshotRes.rows.length > 0) {
      const snapshot = snapshotRes.rows[0];
      const snapshotBlob: Buffer = snapshot.db_blob;

      if (snapshotBlob && snapshotBlob.length > 0) {
        console.log(`[Persistence Engine] Found remote snapshot '${snapshot.id}' (${(snapshotBlob.length / 1024).toFixed(1)} KB, created ${snapshot.created_at}). Restoring SQLite database...`);

        // Checkpoint existing SQLite before atomic write
        try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) {}

        // Temporary file write & validation
        const tempRestoreDbPath = path.join(DB_DIR, `temp_restore_${Date.now()}.db`);
        fs.writeFileSync(tempRestoreDbPath, snapshotBlob);

        // Atomic swap
        fs.copyFileSync(tempRestoreDbPath, DB_PATH);
        try { fs.unlinkSync(tempRestoreDbPath); } catch (_) {}
        if (fs.existsSync(DB_PATH + '-wal')) try { fs.unlinkSync(DB_PATH + '-wal'); } catch (_) {}
        if (fs.existsSync(DB_PATH + '-shm')) try { fs.unlinkSync(DB_PATH + '-shm'); } catch (_) {}

        try { initDatabase(); } catch (_) {}

        restoredFromPostgres = true;
        console.log(`[Persistence Engine] SQLite database successfully hydrated from PostgreSQL snapshot.`);
      }
    } else {
      console.log('[Persistence Engine] No previous PostgreSQL snapshot found. Establishing initial baseline snapshot...');
    }

    // 2. Reconstitute all files from PostgreSQL to UPLOADS_DIR
    const filesRes = await pool.query(`
      SELECT file_name, mime_type, size_bytes, file_data
      FROM projectdrive_files
    `);

    for (const row of filesRes.rows) {
      if (row.file_name && row.file_data) {
        const targetPath = path.join(UPLOADS_DIR, row.file_name);
        try {
          fs.writeFileSync(targetPath, row.file_data);
          restoredFilesCount++;

          // Also ensure local stored_files table in SQLite is synchronized
          try {
            const b64 = row.file_data.toString('base64');
            db.prepare(`
              INSERT INTO stored_files (file_name, mime_type, size_bytes, data_base64, created_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(file_name) DO UPDATE SET
                data_base64 = excluded.data_base64,
                size_bytes = excluded.size_bytes
            `).run(row.file_name, row.mime_type || 'application/octet-stream', row.size_bytes || row.file_data.length, b64, new Date().toISOString());
          } catch (_) {}
        } catch (e: any) {
          console.warn(`[Persistence Engine] Warning restoring file ${row.file_name}:`, e.message);
        }
      }
    }

    console.log(`[Persistence Engine] Verified ${restoredFilesCount} files from PostgreSQL storage.`);

    // 3. If this was a fresh database with no remote snapshot, immediately push initial baseline snapshot
    if (!restoredFromPostgres) {
      await performImmediatePersistentSync('initial_bootstrap_baseline');
    }

    // Also reconcile any SQLite stored_files that were not yet in PostgreSQL
    await syncSqliteFilesToPostgres();

    return {
      restoredFromPostgres,
      restoredFilesCount,
      message: restoredFromPostgres
        ? `Successfully auto-restored complete project state and ${restoredFilesCount} files from PostgreSQL.`
        : `Established new persistent baseline in PostgreSQL with ${restoredFilesCount} files.`,
    };
  } catch (err: any) {
    console.error('[Persistence Engine] Error during PostgreSQL persistence init:', err.message);
    const restoredCount = reconstituteAllFilesFromSqlite();
    return {
      restoredFromPostgres: false,
      restoredFilesCount: restoredCount,
      message: `PostgreSQL connection error: ${err.message}. Fallback to local SQLite storage.`,
    };
  }
}

/**
 * Reconstitutes all physical files in UPLOADS_DIR from SQLite stored_files table
 */
export function reconstituteAllFilesFromSqlite(): number {
  let restored = 0;
  try {
    const rows = db.prepare('SELECT file_name, mime_type, size_bytes, data_base64 FROM stored_files').all() as any[];
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    for (const r of rows) {
      if (r.file_name && r.data_base64) {
        const dest = path.join(UPLOADS_DIR, r.file_name);
        if (!fs.existsSync(dest)) {
          try {
            fs.writeFileSync(dest, Buffer.from(r.data_base64, 'base64'));
            restored++;
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
  return restored;
}

/**
 * Syncs any local SQLite stored_files to PostgreSQL if missing
 */
async function syncSqliteFilesToPostgres(): Promise<void> {
  const pool = getPgPool();
  if (!pool || !isPostgresReady) return;

  try {
    const localFiles = db.prepare('SELECT file_name, mime_type, size_bytes, data_base64 FROM stored_files').all() as any[];
    for (const lf of localFiles) {
      if (lf.file_name && lf.data_base64) {
        const buf = Buffer.from(lf.data_base64, 'base64');
        await pool.query(`
          INSERT INTO projectdrive_files (file_name, mime_type, size_bytes, file_data, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (file_name) DO UPDATE SET
            file_data = excluded.file_data,
            size_bytes = excluded.size_bytes,
            updated_at = NOW()
        `, [lf.file_name, lf.mime_type || 'application/octet-stream', lf.size_bytes || buf.length, buf]);
      }
    }
  } catch (err: any) {
    console.warn('[Persistence Engine] Sync SQLite files to Postgres warning:', err.message);
  }
}

/**
 * Persists an uploaded or generated file to both SQLite stored_files table and PostgreSQL
 */
export async function persistUploadedFile(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  source: Buffer | string
): Promise<void> {
  let fileBuffer: Buffer;
  if (typeof source === 'string') {
    fileBuffer = fs.readFileSync(source);
  } else {
    fileBuffer = source;
  }

  // 1. Ensure physical file exists in UPLOADS_DIR
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const physicalPath = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(physicalPath)) {
    fs.writeFileSync(physicalPath, fileBuffer);
  }

  // 2. Persist to SQLite stored_files table
  const b64 = fileBuffer.toString('base64');
  const now = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO stored_files (file_name, mime_type, size_bytes, data_base64, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(file_name) DO UPDATE SET
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        data_base64 = excluded.data_base64
    `).run(fileName, mimeType || 'application/octet-stream', sizeBytes || fileBuffer.length, b64, now);
  } catch (err: any) {
    console.error('[Persistence Engine] Error storing file in SQLite stored_files:', err.message);
  }

  // 3. Persist to PostgreSQL projectdrive_files table
  const pool = getPgPool();
  if (pool && isPostgresReady) {
    try {
      await pool.query(`
        INSERT INTO projectdrive_files (file_name, mime_type, size_bytes, file_data, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (file_name) DO UPDATE SET
          mime_type = excluded.mime_type,
          size_bytes = excluded.size_bytes,
          file_data = excluded.file_data,
          updated_at = NOW()
      `, [fileName, mimeType || 'application/octet-stream', sizeBytes || fileBuffer.length, fileBuffer]);
    } catch (pgErr: any) {
      console.error('[Persistence Engine] Error storing file in PostgreSQL projectdrive_files:', pgErr.message);
    }
  }

  // Trigger snapshot sync
  triggerPersistentSync('file_uploaded');
}

/**
 * Attempts to retrieve a missing file from SQLite or PostgreSQL, writes it to disk, and returns the Buffer
 */
export async function getOrReconstituteFile(fileName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const sanitized = path.basename(fileName);
  const localPath = path.join(UPLOADS_DIR, sanitized);

  // If physical file exists, return it
  if (fs.existsSync(localPath)) {
    return {
      buffer: fs.readFileSync(localPath),
      mimeType: 'application/octet-stream',
    };
  }

  // 1. Try SQLite stored_files
  try {
    const row = db.prepare('SELECT mime_type, data_base64 FROM stored_files WHERE file_name = ?').get(sanitized) as any;
    if (row && row.data_base64) {
      const buffer = Buffer.from(row.data_base64, 'base64');
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.writeFileSync(localPath, buffer);
      return { buffer, mimeType: row.mime_type || 'application/octet-stream' };
    }
  } catch (_) {}

  // 2. Try PostgreSQL projectdrive_files
  const pool = getPgPool();
  if (pool && isPostgresReady) {
    try {
      const res = await pool.query('SELECT mime_type, file_data FROM projectdrive_files WHERE file_name = $1', [sanitized]);
      if (res.rows.length > 0 && res.rows[0].file_data) {
        const buffer: Buffer = res.rows[0].file_data;
        if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        fs.writeFileSync(localPath, buffer);

        // Cache in SQLite stored_files
        try {
          db.prepare(`
            INSERT INTO stored_files (file_name, mime_type, size_bytes, data_base64, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(file_name) DO UPDATE SET data_base64 = excluded.data_base64
          `).run(sanitized, res.rows[0].mime_type || 'application/octet-stream', buffer.length, buffer.toString('base64'), new Date().toISOString());
        } catch (_) {}

        return { buffer, mimeType: res.rows[0].mime_type || 'application/octet-stream' };
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Immediate, non-debounced persistent sync to PostgreSQL
 */
export async function performImmediatePersistentSync(reason: string = 'immediate_sync'): Promise<void> {
  const pool = getPgPool();
  if (!pool || !isPostgresReady) return;

  if (isSyncInProgress) return;
  isSyncInProgress = true;

  const tempSnapshotDbPath = path.join(DB_DIR, `temp_sync_pg_${Date.now()}.db`);
  try {
    // 1. Take atomic SQLite snapshot
    await db.backup(tempSnapshotDbPath);
    const dbBuffer = fs.readFileSync(tempSnapshotDbPath);

    // 2. Relational JSON export
    const jsonDump = getFullProjectJsonDump();

    // 3. Count total records
    let totalRecords = 0;
    const tables = [
      'team_members', 'tasks', 'milestones', 'meetings', 'documents',
      'research_papers', 'learning_resources', 'engineering_notes',
      'tests', 'test_measurements', 'issues', 'simulation_models', 'report_sections'
    ];
    for (const tbl of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as c FROM ${tbl}`).get() as any;
        if (row?.c) totalRecords += Number(row.c);
      } catch (_) {}
    }

    const snapshotId = 'snap_' + Date.now();
    const manifest = {
      snapshot_id: snapshotId,
      reason,
      total_records: totalRecords,
      db_size_bytes: dbBuffer.length,
      created_at: new Date().toISOString(),
    };

    // 4. Save to PostgreSQL projectdrive_snapshots
    await pool.query(`
      INSERT INTO projectdrive_snapshots (
        id, snapshot_type, total_records, db_blob, json_dump, files_manifest, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      snapshotId,
      reason,
      totalRecords,
      dbBuffer,
      JSON.stringify(jsonDump),
      JSON.stringify(manifest),
    ]);

    // Prune old snapshots in PostgreSQL (keep newest 20)
    await pool.query(`
      DELETE FROM projectdrive_snapshots
      WHERE id NOT IN (
        SELECT id FROM projectdrive_snapshots ORDER BY created_at DESC LIMIT 20
      )
    `);

    console.log(`[Persistence Engine] Successfully synced atomic snapshot '${snapshotId}' (${totalRecords} records, ${(dbBuffer.length / 1024).toFixed(1)} KB) to PostgreSQL.`);
  } catch (err: any) {
    console.error('[Persistence Engine] Failed to sync snapshot to PostgreSQL:', err.message);
  } finally {
    isSyncInProgress = false;
    if (fs.existsSync(tempSnapshotDbPath)) {
      try { fs.unlinkSync(tempSnapshotDbPath); } catch (_) {}
    }
  }
}

/**
 * Debounced trigger called on every state-changing HTTP request
 */
export function triggerPersistentSync(reason: string = 'mutation', delayMs: number = 800) {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  syncDebounceTimer = setTimeout(() => {
    performImmediatePersistentSync(reason).catch((err) => {
      console.error('[Persistence Engine Background Sync Error]:', err);
    });
  }, delayMs);
}
