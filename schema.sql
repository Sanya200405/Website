-- =========================================================
-- FOC Drive Project Hub - Relational Database Schema
-- Compatible with SQLite & PostgreSQL / Supabase
-- =========================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Planning', -- 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold'
    start_date TEXT,
    target_date TEXT,
    created_at TEXT NOT NULL
);

-- 2. Team Members / Users Table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
    password_hash TEXT,
    avatar TEXT,
    bio TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 3. Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Not Started', -- 'Not Started' | 'In Progress' | 'Completed' | 'Delayed'
    assigned_member_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    start_date TEXT,
    due_date TEXT,
    completed_at TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Not Started', -- 'Not Started' | 'In Progress' | 'Blocked' | 'Completed'
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low' | 'Medium' | 'High' | 'Critical'
    category TEXT NOT NULL DEFAULT 'General', -- 'Hardware' | 'Firmware' | 'Mechanical' | 'Testing' | 'Documentation' | 'General'
    start_date TEXT,
    due_date TEXT,
    created_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- 5. Tests / Experiments Table
CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL DEFAULT 'General', -- 'Dyno Test' | 'Thermal Test' | 'Current Step' | 'Efficiency' | 'CAN-FD Bus' | 'Sensor Calibration' | 'General'
    date TEXT NOT NULL,
    performed_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Passed', -- 'Passed' | 'Failed' | 'Inconclusive' | 'In Progress'
    observations TEXT,
    result TEXT,
    hardware_setup TEXT,
    supply_voltage_v REAL,
    supply_current_a REAL,
    pwm_freq_khz REAL,
    created_at TEXT NOT NULL
);

-- 6. Test Measurements Table (Time-Series Data from CSV uploads)
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

-- 7. Issues / Blockers Table
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reported_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    assigned_to_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low' | 'Medium' | 'High' | 'Critical'
    status TEXT NOT NULL DEFAULT 'Open', -- 'Open' | 'Investigating' | 'Blocked' | 'Fixed' | 'Closed'
    subsystem TEXT NOT NULL DEFAULT 'General',
    possible_cause TEXT,
    solution TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

-- 8. Documents & Project Files Table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT,
    uploaded_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'Other', -- 'Datasheet' | 'Schematic' | 'PCB Layout' | 'Firmware' | 'CAD Model' | 'Test Report' | 'Meeting Notes' | 'Other'
    description TEXT,
    created_at TEXT NOT NULL
);

-- 9. Real Activity & Audit Log Table
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_title TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 10. Research Papers Database Table
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
    reading_status TEXT NOT NULL DEFAULT 'Unread', -- 'Unread' | 'Reading' | 'Completed'
    added_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 11. Learning & Lecture Resources Table
CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'Video', -- 'Video' | 'Lecture Notes' | 'Course' | 'Article' | 'Book' | 'Tutorial' | 'Other'
    topic TEXT,
    description TEXT,
    tags TEXT,
    notes TEXT,
    added_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
);

-- 12. Engineering Notes Table
CREATE TABLE IF NOT EXISTS engineering_notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT,
    author_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 13. Collaborative Report Sections Table
CREATE TABLE IF NOT EXISTS report_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft' | 'In Review' | 'Completed'
    last_edited_by_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    last_edited_by_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 14. Report Entity Links Table (Linking Research, Tests, Notes, Docs to Report Chapters)
CREATE TABLE IF NOT EXISTS report_links (
    id TEXT PRIMARY KEY,
    report_section_id TEXT NOT NULL REFERENCES report_sections(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'research_paper' | 'engineering_note' | 'test' | 'document' | 'issue' | 'task'
    entity_id TEXT NOT NULL,
    entity_title TEXT NOT NULL,
    created_at TEXT NOT NULL
);
