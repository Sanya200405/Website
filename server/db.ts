import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(DB_DIR, 'project.db');

// If DB doesn't exist in target path (e.g. fresh cloud volume), seed from project_seed.db
const seedCandidates = [
  process.env.SEED_DB_PATH,
  path.resolve(__dirname, 'project_seed.db'),
  path.resolve(__dirname, '../server/project_seed.db'),
  path.resolve(process.cwd(), 'server/project_seed.db'),
  '/app/server/project_seed.db',
].filter(Boolean) as string[];

const SEED_DB_PATH = seedCandidates.find((p) => fs.existsSync(p)) || '';

if (!fs.existsSync(DB_PATH) && SEED_DB_PATH && fs.existsSync(SEED_DB_PATH)) {
  try {
    fs.copyFileSync(SEED_DB_PATH, DB_PATH);
    if (fs.existsSync(DB_PATH + '-wal')) try { fs.unlinkSync(DB_PATH + '-wal'); } catch (_) {}
    if (fs.existsSync(DB_PATH + '-shm')) try { fs.unlinkSync(DB_PATH + '-shm'); } catch (_) {}
    console.log(`Initialized database from seed database (${SEED_DB_PATH}) to: ${DB_PATH}`);
  } catch (err: any) {
    console.error('Failed to copy seed database:', err.message);
  }
}

export const db = new Database(DB_PATH);

// Enable foreign keys and container-safe journal mode
try {
  db.pragma('journal_mode = DELETE');
} catch (e: any) {
  console.warn('Journal mode setting warning:', e?.message);
}
try {
  db.pragma('foreign_keys = ON');
} catch (e: any) {
  console.warn('Foreign keys setting warning:', e?.message);
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Planning',
      start_date TEXT,
      target_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS motor_parameters (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      motor_model TEXT NOT NULL,
      rated_voltage_v REAL,
      rated_current_a REAL,
      peak_current_a REAL,
      pole_pairs INTEGER,
      kv_rating REAL,
      phase_resistance_ohm REAL,
      phase_inductance_uh REAL,
      max_rpm REAL,
      rated_speed_rpm REAL,
      continuous_torque_nm REAL,
      peak_torque_nm REAL,
      gear_ratio REAL,
      gearbox_type TEXT,
      gearbox_efficiency REAL,
      inverter_topology TEXT,
      pwm_frequency_khz REAL,
      current_sensing_type TEXT,
      encoder_type TEXT,
      encoder_cpr INTEGER,
      thermal_limit_c REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      password_hash TEXT,
      avatar TEXT,
      bio TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Not Started',
      assigned_member_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      start_date TEXT,
      due_date TEXT,
      completed_at TEXT,
      order_index INTEGER DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Not Started',
      priority TEXT NOT NULL DEFAULT 'Medium',
      category TEXT NOT NULL DEFAULT 'General',
      start_date TEXT,
      due_date TEXT,
      created_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      test_name TEXT NOT NULL,
      test_type TEXT NOT NULL DEFAULT 'General',
      date TEXT NOT NULL,
      performed_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Passed',
      observations TEXT,
      result TEXT,
      hardware_setup TEXT,
      supply_voltage_v REAL,
      supply_current_a REAL,
      pwm_freq_khz REAL,
      deleted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_measurements (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      time_ms REAL NOT NULL,
      speed_rpm REAL,
      current_a REAL,
      torque_nm REAL,
      temp_c REAL,
      voltage_v REAL
    );

    CREATE TABLE IF NOT EXISTS simulation_models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      purpose TEXT,
      github_path TEXT,
      status TEXT NOT NULL DEFAULT 'In Development',
      milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
      objective TEXT,
      parameters TEXT,
      inputs TEXT,
      expected_output TEXT,
      results TEXT,
      conclusion TEXT,
      notes TEXT,
      created_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS simulation_experiment_links (
      id TEXT PRIMARY KEY,
      simulation_id TEXT NOT NULL REFERENCES simulation_models(id) ON DELETE CASCADE,
      test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reported_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      assigned_to_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      subsystem TEXT NOT NULL DEFAULT 'General',
      possible_cause TEXT,
      solution TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size TEXT,
      uploaded_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      type TEXT NOT NULL DEFAULT 'Other',
      description TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_title TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_papers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT,
      year INTEGER,
      journal_conference TEXT,
      doi TEXT,
      url TEXT,
      pdf_url TEXT,
      pdf_name TEXT,
      topic TEXT,
      tags TEXT,
      summary TEXT,
      notes TEXT,
      reading_status TEXT NOT NULL DEFAULT 'Unread',
      added_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'Video',
      topic TEXT,
      description TEXT,
      tags TEXT,
      notes TEXT,
      added_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS engineering_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT,
      author_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Draft',
      last_edited_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      last_edited_by_name TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_links (
      id TEXT PRIMARY KEY,
      report_section_id TEXT NOT NULL REFERENCES report_sections(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_title TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      size_formatted TEXT NOT NULL,
      backup_type TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS external_backup_records (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      destination_type TEXT NOT NULL,
      destination_target TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      size_formatted TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      duration_ms INTEGER DEFAULT 0,
      manifest_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      meeting_link TEXT,
      location TEXT,
      description TEXT,
      notes TEXT,
      reminder TEXT DEFAULT 'none',
      created_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Not Started',
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(task_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS reading_assignments (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL, -- 'research_paper' | 'learning_resource' | 'document'
      item_id TEXT NOT NULL,
      member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Unread', -- 'Unread' | 'Reading' | 'Completed'
      instructions TEXT,
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(item_type, item_id, member_id)
    );
  `);

  // Column migrations for existing tables
  try { db.exec("ALTER TABLE team_members ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"); } catch (_) {}
  try { db.exec("ALTER TABLE team_members ADD COLUMN password_hash TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE team_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member'"); } catch (_) {}

  // Soft-deletion migrations for existing tables
  try { db.exec("ALTER TABLE research_papers ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN pdf_url TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN pdf_name TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE engineering_notes ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE learning_resources ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE tests ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE report_sections ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE tasks ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE issues ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE milestones ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE simulation_models ADD COLUMN deleted_at TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE meetings ADD COLUMN reminder TEXT DEFAULT 'none'"); } catch (_) {}
  try { db.exec("ALTER TABLE meetings ADD COLUMN deleted_at TEXT"); } catch (_) {}

  // Assignment feature column migrations
  try { db.exec("ALTER TABLE tasks ADD COLUMN is_all_members INTEGER DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE tasks ADD COLUMN assigned_member_ids TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN is_all_members INTEGER DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN assigned_member_ids TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN due_date TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE research_papers ADD COLUMN instructions TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE learning_resources ADD COLUMN is_all_members INTEGER DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE learning_resources ADD COLUMN assigned_member_ids TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE learning_resources ADD COLUMN due_date TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE learning_resources ADD COLUMN instructions TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN is_all_members INTEGER DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN assigned_member_ids TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN due_date TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE documents ADD COLUMN instructions TEXT"); } catch (_) {}

  // Backfill existing task assignments into task_assignments table
  try {
    const existingTasks = db.prepare('SELECT id, assigned_to_id, status, completed_at, created_at FROM tasks WHERE assigned_to_id IS NOT NULL AND deleted_at IS NULL').all() as any[];
    const insertAssignment = db.prepare(`
      INSERT OR IGNORE INTO task_assignments (id, task_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of existingTasks) {
      if (t.assigned_to_id) {
        const assignId = 'ta_' + t.id + '_' + t.assigned_to_id;
        const now = new Date().toISOString();
        insertAssignment.run(assignId, t.id, t.assigned_to_id, t.status || 'Not Started', t.completed_at || null, t.created_at || now, now);
      }
    }
  } catch (_) {}

  // Ensure default project configuration exists
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_foc_main');
  if (!project) {
    db.prepare(`
      INSERT INTO projects (id, name, description, status, start_date, target_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'proj_foc_main',
      'FOC Drive Project',
      'Development of an FOC Drive for BLDC Motor with Planetary Gear Reduction',
      'Planning',
      new Date().toISOString().split('T')[0],
      '',
      new Date().toISOString()
    );
  }

  // Ensure default motor parameters profile exists
  const motor = db.prepare('SELECT * FROM motor_parameters WHERE id = ?').get('motor_main');
  if (!motor) {
    db.prepare(`
      INSERT INTO motor_parameters (
        id, project_id, motor_model, rated_voltage_v, rated_current_a, peak_current_a,
        pole_pairs, kv_rating, phase_resistance_ohm, phase_inductance_uh, max_rpm,
        rated_speed_rpm, continuous_torque_nm, peak_torque_nm, gear_ratio, gearbox_type,
        gearbox_efficiency, inverter_topology, pwm_frequency_khz, current_sensing_type,
        encoder_type, encoder_cpr, thermal_limit_c, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      'motor_main',
      'proj_foc_main',
      'BLDC Motor with Planetary Gearhead',
      24.0,
      10.0,
      25.0,
      4,
      400.0,
      0.18,
      120.0,
      6000.0,
      4500.0,
      0.35,
      1.20,
      10.0,
      'Planetary 10:1',
      0.85,
      '3-Phase Half-Bridge (6x MOSFETs)',
      20.0,
      'Low-Side Shunt (In-line)',
      'Magnetic Rotary (AS5600 / AS5048)',
      4096,
      85.0,
      'Primary engineering specifications for low-backlash robotic actuator drive.',
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}

// Activity logging helper
export function logActivity(userName: string, userId: string | null, action: string, entityType: string, entityTitle: string) {
  const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const timestamp = new Date().toISOString();
  db.prepare(`
    INSERT INTO activities (id, user_id, user_name, action, entity_type, entity_title, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || 'system', userName || 'Team Member', action, entityType, entityTitle, timestamp);
}
