import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Document, Paragraph, HeadingLevel, TextRun, Packer, AlignmentType } from 'docx';
import { fileURLToPath } from 'url';
import { db, initDatabase, logActivity } from './db';
import {
  initAutomatedBackups,
  createDatabaseBackup,
  listBackups,
  getBackupStatus,
  restoreDatabaseFromSnapshot,
  getFullProjectJsonDump,
  createProjectZipArchive,
  BACKUPS_DIR,
  UPLOADS_DIR,
} from './backup';
import {
  initExternalBackupsScheduler,
  createExternalProjectBackup,
  getExternalBackupStatus,
  listExternalBackups,
  testExternalDestination,
  restoreCompleteProjectArchive,
  EXTERNAL_BACKUP_DIR,
} from './externalBackup';
import {
  initCloudSync,
  triggerCloudSync,
  getCloudSyncStatus,
  pushToCloudVault,
  performColdBootAutoHydration,
  setVaultConfig,
  getVaultConfig,
} from './cloudSync';
import {
  fetchGitHubRepo,
  fetchGitHubCommits,
  fetchGitHubBranches,
  fetchGitHubTree,
} from './github';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema synchronously
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'foc_drive_jwt_secret_key_2026';

// Multer storage for documents, CSVs, PDFs, images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitized);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
const archiveUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB archive limit
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------------------------------------------------
// Auth & Security Middleware
// -------------------------------------------------------------
interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
  };
}

function authenticateToken(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
    } catch {
      // Invalid/expired token - continue as guest
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  next();
}

app.use(authenticateToken);

// -------------------------------------------------------------
// Cloud Sync Real-Time Mutation Hook
// -------------------------------------------------------------
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && req.path.startsWith('/api')) {
    if (!req.path.startsWith('/api/cloud-sync') && !req.path.startsWith('/api/auth/login') && !req.path.startsWith('/api/auth/status')) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          triggerCloudSync(2500);
        }
      });
    }
  }
  next();
});

// -------------------------------------------------------------
// 1. Authentication Endpoints
// -------------------------------------------------------------

// Check system setup status (whether any user exists)
app.get('/api/auth/status', (_req: Request, res: Response) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM team_members').get() as { count: number }).count;
    res.json({
      hasAdmin: userCount > 0,
      userCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register / Create Account
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, bio } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalName = (name && name.trim().length > 0) ? name.trim() : cleanEmail.split('@')[0];

    const existing = db.prepare('SELECT * FROM team_members WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userCount = (db.prepare('SELECT COUNT(*) as count FROM team_members').get() as { count: number }).count;
    // First user is automatically assigned as admin
    const assignedRole = userCount === 0 ? 'admin' : role === 'admin' ? 'admin' : 'member';

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO team_members (id, name, email, password_hash, role, bio, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, finalName, cleanEmail, password_hash, assignedRole, bio || '', created_at);

    logActivity(finalName, id, `registered new account (${assignedRole})`, 'User', finalName);

    const user = { id, name: finalName, email: cleanEmail, role: assignedRole };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const member = db.prepare('SELECT * FROM team_members WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!member) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (member.is_active === 0) {
      return res.status(403).json({ error: 'This account has been disabled by the administrator.' });
    }

    // Verify password hash
    if (member.password_hash) {
      const isMatch = await bcrypt.compare(password, member.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const user = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || 'member',
      avatar: member.avatar,
      bio: member.bio,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    logActivity(member.name, member.id, 'logged in', 'Auth', member.name);
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Authenticated Profile
app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const member = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members WHERE id = ?').get(req.user.id) as any;
  if (!member) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(member);
});

// -------------------------------------------------------------
// 2. Project Details & Motor Parameters
// -------------------------------------------------------------
app.get('/api/project', (_req: Request, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_foc_main');
    res.json(project || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/project', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status, target_date, user_name } = req.body;
    db.prepare(`
      UPDATE projects
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          target_date = COALESCE(?, target_date)
      WHERE id = 'proj_foc_main'
    `).run(name, description, status, target_date);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated project settings', 'Project', name || 'FOC Drive Project');
    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_foc_main');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Motor Parameters Profile Endpoints
app.get('/api/motor-parameters', (_req: Request, res: Response) => {
  try {
    const motor = db.prepare('SELECT * FROM motor_parameters WHERE id = ?').get('motor_main');
    res.json(motor || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/motor-parameters', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      motor_model,
      rated_voltage_v,
      rated_current_a,
      peak_current_a,
      pole_pairs,
      kv_rating,
      phase_resistance_ohm,
      phase_inductance_uh,
      max_rpm,
      rated_speed_rpm,
      continuous_torque_nm,
      peak_torque_nm,
      gear_ratio,
      gearbox_type,
      gearbox_efficiency,
      inverter_topology,
      pwm_frequency_khz,
      current_sensing_type,
      encoder_type,
      encoder_cpr,
      thermal_limit_c,
      notes,
    } = req.body;

    const updated_at = new Date().toISOString();

    db.prepare(`
      UPDATE motor_parameters
      SET motor_model = COALESCE(?, motor_model),
          rated_voltage_v = COALESCE(?, rated_voltage_v),
          rated_current_a = COALESCE(?, rated_current_a),
          peak_current_a = COALESCE(?, peak_current_a),
          pole_pairs = COALESCE(?, pole_pairs),
          kv_rating = COALESCE(?, kv_rating),
          phase_resistance_ohm = COALESCE(?, phase_resistance_ohm),
          phase_inductance_uh = COALESCE(?, phase_inductance_uh),
          max_rpm = COALESCE(?, max_rpm),
          rated_speed_rpm = COALESCE(?, rated_speed_rpm),
          continuous_torque_nm = COALESCE(?, continuous_torque_nm),
          peak_torque_nm = COALESCE(?, peak_torque_nm),
          gear_ratio = COALESCE(?, gear_ratio),
          gearbox_type = COALESCE(?, gearbox_type),
          gearbox_efficiency = COALESCE(?, gearbox_efficiency),
          inverter_topology = COALESCE(?, inverter_topology),
          pwm_frequency_khz = COALESCE(?, pwm_frequency_khz),
          current_sensing_type = COALESCE(?, current_sensing_type),
          encoder_type = COALESCE(?, encoder_type),
          encoder_cpr = COALESCE(?, encoder_cpr),
          thermal_limit_c = COALESCE(?, thermal_limit_c),
          notes = COALESCE(?, notes),
          updated_at = ?
      WHERE id = 'motor_main'
    `).run(
      motor_model,
      rated_voltage_v,
      rated_current_a,
      peak_current_a,
      pole_pairs,
      kv_rating,
      phase_resistance_ohm,
      phase_inductance_uh,
      max_rpm,
      rated_speed_rpm,
      continuous_torque_nm,
      peak_torque_nm,
      gear_ratio,
      gearbox_type,
      gearbox_efficiency,
      inverter_topology,
      pwm_frequency_khz,
      current_sensing_type,
      encoder_type,
      encoder_cpr,
      thermal_limit_c,
      notes,
      updated_at
    );

    logActivity(req.user?.name || 'User', req.user?.id || null, 'updated motor & gearing parameters', 'Motor Parameters', motor_model || 'BLDC Motor');
    const updated = db.prepare('SELECT * FROM motor_parameters WHERE id = ?').get('motor_main');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. Real Calculated Project Stats
// -------------------------------------------------------------
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE deleted_at IS NULL').get() as any).count;
    const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed' AND deleted_at IS NULL").get() as any).count;
    const activeTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'In Progress' AND deleted_at IS NULL").get() as any).count;
    const pendingTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Not Started' AND deleted_at IS NULL").get() as any).count;
    const blockedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Blocked' AND deleted_at IS NULL").get() as any).count;

    const totalMilestones = (db.prepare('SELECT COUNT(*) as count FROM milestones WHERE deleted_at IS NULL').get() as any).count;
    const completedMilestones = (db.prepare("SELECT COUNT(*) as count FROM milestones WHERE status = 'Completed' AND deleted_at IS NULL").get() as any).count;

    const openIssues = (db.prepare("SELECT COUNT(*) as count FROM issues WHERE status != 'Closed' AND status != 'Fixed' AND deleted_at IS NULL").get() as any).count;
    const totalTests = (db.prepare('SELECT COUNT(*) as count FROM tests WHERE deleted_at IS NULL').get() as any).count;
    const completedTests = (db.prepare("SELECT COUNT(*) as count FROM tests WHERE status = 'Passed' AND deleted_at IS NULL").get() as any).count;

    const overallProgress = totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const totalTeamMembers = (db.prepare('SELECT COUNT(*) as count FROM team_members WHERE is_active = 1').get() as any).count;
    const totalDocuments = (db.prepare('SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL').get() as any).count;
    const totalResearchPapers = (db.prepare('SELECT COUNT(*) as count FROM research_papers WHERE deleted_at IS NULL').get() as any).count;
    const totalLearningResources = (db.prepare('SELECT COUNT(*) as count FROM learning_resources WHERE deleted_at IS NULL').get() as any).count;
    const totalEngineeringNotes = (db.prepare('SELECT COUNT(*) as count FROM engineering_notes WHERE deleted_at IS NULL').get() as any).count;
    const totalReportSections = (db.prepare('SELECT COUNT(*) as count FROM report_sections WHERE deleted_at IS NULL').get() as any).count;

    res.json({
      overallProgress,
      totalTasks,
      completedTasks,
      activeTasks,
      pendingTasks,
      blockedTasks,
      totalMilestones,
      completedMilestones,
      openIssues,
      completedTests,
      totalTests,
      totalTeamMembers,
      totalDocuments,
      totalResearchPapers,
      totalLearningResources,
      totalEngineeringNotes,
      totalReportSections,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. Team Members
// -------------------------------------------------------------
app.get('/api/team', (_req: Request, res: Response) => {
  try {
    const members = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members WHERE is_active = 1').all();
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, email, bio, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT * FROM team_members WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || 'project123', salt);

    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO team_members (id, name, email, password_hash, role, bio, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, name.trim(), cleanEmail, password_hash, role || 'member', bio || '', created_at);

    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'added team member', 'Team', name);

    const newMember = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members WHERE id = ?').get(id);
    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/team/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, email, bio } = req.body;

    db.prepare(`
      UPDATE team_members
      SET name = COALESCE(?, name),
          role = COALESCE(?, role),
          email = COALESCE(?, email),
          bio = COALESCE(?, bio)
      WHERE id = ?
    `).run(name, role, email, bio, id);

    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'updated member details', 'Team', name || id);

    const updated = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/team/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot remove your own active administrator account.' });
    }
    const member = db.prepare('SELECT name FROM team_members WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'removed team member', 'Team', member?.name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Milestones
// -------------------------------------------------------------
app.get('/api/milestones', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT m.*, tm.name as assigned_member_name
      FROM milestones m
      LEFT JOIN team_members tm ON m.assigned_member_id = tm.id
      WHERE m.deleted_at IS NULL
      ORDER BY m.order_index ASC, m.created_at ASC
    `).all() as any[];

    const milestonesWithTasks = rows.map((m) => {
      const tasks = db.prepare(`
        SELECT t.*, tm.name as assigned_to_name
        FROM tasks t
        LEFT JOIN team_members tm ON t.assigned_to_id = tm.id
        WHERE t.milestone_id = ? AND t.deleted_at IS NULL
        ORDER BY t.created_at ASC
      `).all(m.id);

      const completedCount = tasks.filter((t: any) => t.status === 'Completed').length;
      const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : (m.status === 'Completed' ? 100 : 0);

      return {
        ...m,
        tasks,
        totalTasks: tasks.length,
        completedTasks: completedCount,
        progress,
      };
    });

    res.json(milestonesWithTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/milestones', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assigned_member_id, start_date, due_date, order_index, user_name } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const id = 'ms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO milestones (id, project_id, title, description, status, assigned_member_id, start_date, due_date, order_index, created_at)
      VALUES (?, 'proj_foc_main', ?, ?, 'Not Started', ?, ?, ?, ?, ?)
    `).run(id, title, description || '', assigned_member_id || null, start_date || '', due_date || '', order_index || 0, created_at);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'created milestone', 'Roadmap', title);

    const newMs = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
    res.status(201).json(newMs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/milestones/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, assigned_member_id, start_date, due_date, order_index, user_name } = req.body;

    const completed_at = status === 'Completed' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE milestones
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          assigned_member_id = COALESCE(?, assigned_member_id),
          start_date = COALESCE(?, start_date),
          due_date = COALESCE(?, due_date),
          order_index = COALESCE(?, order_index),
          completed_at = CASE WHEN ? = 'Completed' THEN ? ELSE completed_at END
      WHERE id = ?
    `).run(title, description, status, assigned_member_id, start_date, due_date, order_index, status, completed_at, id);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated milestone', 'Roadmap', title || id);

    const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Milestone
app.delete('/api/milestones/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ms = db.prepare('SELECT title FROM milestones WHERE id = ?').get(id) as any;
    db.prepare('UPDATE milestones SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved milestone to trash', 'Roadmap', ms?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Helper Functions for Member Assignments & Tracking
// -------------------------------------------------------------
function getActiveTeamMembers() {
  return db.prepare('SELECT id, name, email, role, avatar FROM team_members WHERE is_active = 1').all() as any[];
}

function attachTaskAssignments(tasks: any[]) {
  if (!tasks || !tasks.length) return tasks || [];
  const taskIds = tasks.map((t) => t.id);
  const placeholders = taskIds.map(() => '?').join(',');
  const allAssignments = db.prepare(`
    SELECT ta.*, tm.name as member_name, tm.email as member_email, tm.role as member_role, tm.avatar as member_avatar
    FROM task_assignments ta
    JOIN team_members tm ON ta.member_id = tm.id
    WHERE ta.task_id IN (${placeholders})
    ORDER BY tm.name ASC
  `).all(...taskIds) as any[];

  const assignmentMap: Record<string, any[]> = {};
  for (const a of allAssignments) {
    if (!assignmentMap[a.task_id]) assignmentMap[a.task_id] = [];
    assignmentMap[a.task_id].push(a);
  }

  return tasks.map((t) => {
    const assignments = assignmentMap[t.id] || [];
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => a.status === 'Completed').length;
    const assignedMemberIds = assignments.map((a) => a.member_id);

    return {
      ...t,
      is_all_members: Boolean(t.is_all_members),
      assignments,
      assigned_member_ids: assignedMemberIds,
      total_assignments_count: totalAssignments,
      completed_assignments_count: completedAssignments,
      progress_summary: totalAssignments > 0 ? `${completedAssignments}/${totalAssignments}` : undefined,
    };
  });
}

function attachReadingAssignments(items: any[], itemType: string) {
  if (!items || !items.length) return items || [];
  const itemIds = items.map((i) => i.id);
  const placeholders = itemIds.map(() => '?').join(',');
  const allAssignments = db.prepare(`
    SELECT ra.*, tm.name as member_name, tm.email as member_email, tm.role as member_role, tm.avatar as member_avatar
    FROM reading_assignments ra
    JOIN team_members tm ON ra.member_id = tm.id
    WHERE ra.item_type = ? AND ra.item_id IN (${placeholders})
    ORDER BY tm.name ASC
  `).all(itemType, ...itemIds) as any[];

  const assignmentMap: Record<string, any[]> = {};
  for (const a of allAssignments) {
    if (!assignmentMap[a.item_id]) assignmentMap[a.item_id] = [];
    assignmentMap[a.item_id].push(a);
  }

  return items.map((item) => {
    const assignments = assignmentMap[item.id] || [];
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => a.status === 'Completed').length;
    const assignedMemberIds = assignments.map((a) => a.member_id);

    return {
      ...item,
      is_all_members: Boolean(item.is_all_members),
      assignments,
      assigned_member_ids: assignedMemberIds,
      total_assignments_count: totalAssignments,
      completed_assignments_count: completedAssignments,
      progress_summary: totalAssignments > 0 ? `${completedAssignments}/${totalAssignments}` : undefined,
    };
  });
}

function syncTaskAssignments(taskId: string, isAllMembers?: boolean | number, assignedMemberIds?: string[], singleAssignedToId?: string, taskStatus: string = 'Not Started') {
  const now = new Date().toISOString();
  const completed_at = taskStatus === 'Completed' ? now : null;

  if (Boolean(isAllMembers)) {
    const activeMembers = getActiveTeamMembers();
    const insertStmt = db.prepare(`
      INSERT INTO task_assignments (id, task_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id, member_id) DO NOTHING
    `);
    for (const m of activeMembers) {
      const assignId = 'ta_' + taskId + '_' + m.id;
      insertStmt.run(assignId, taskId, m.id, 'Not Started', null, now, now);
    }
  } else if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
    const placeholders = assignedMemberIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM task_assignments WHERE task_id = ? AND member_id NOT IN (${placeholders})`).run(taskId, ...assignedMemberIds);

    const insertStmt = db.prepare(`
      INSERT INTO task_assignments (id, task_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id, member_id) DO NOTHING
    `);
    for (const memberId of assignedMemberIds) {
      const assignId = 'ta_' + taskId + '_' + memberId;
      insertStmt.run(assignId, taskId, memberId, 'Not Started', null, now, now);
    }
  } else if (singleAssignedToId) {
    db.prepare('DELETE FROM task_assignments WHERE task_id = ? AND member_id != ?').run(taskId, singleAssignedToId);
    const assignId = 'ta_' + taskId + '_' + singleAssignedToId;
    db.prepare(`
      INSERT INTO task_assignments (id, task_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id, member_id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `).run(assignId, taskId, singleAssignedToId, taskStatus, completed_at, now, now);
  } else {
    db.prepare('DELETE FROM task_assignments WHERE task_id = ?').run(taskId);
  }
}

function syncReadingAssignments(itemType: string, itemId: string, isAllMembers?: boolean | number, assignedMemberIds?: string[], instructions?: string, dueDate?: string) {
  const now = new Date().toISOString();

  if (Boolean(isAllMembers)) {
    const activeMembers = getActiveTeamMembers();
    const insertStmt = db.prepare(`
      INSERT INTO reading_assignments (id, item_type, item_id, member_id, status, instructions, due_date, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_type, item_id, member_id) DO UPDATE SET
        instructions = COALESCE(excluded.instructions, instructions),
        due_date = COALESCE(excluded.due_date, due_date),
        updated_at = excluded.updated_at
    `);
    for (const m of activeMembers) {
      const assignId = 'ra_' + itemType + '_' + itemId + '_' + m.id;
      insertStmt.run(assignId, itemType, itemId, m.id, 'Unread', instructions || null, dueDate || null, null, now, now);
    }
  } else if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
    const placeholders = assignedMemberIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM reading_assignments WHERE item_type = ? AND item_id = ? AND member_id NOT IN (${placeholders})`).run(itemType, itemId, ...assignedMemberIds);

    const insertStmt = db.prepare(`
      INSERT INTO reading_assignments (id, item_type, item_id, member_id, status, instructions, due_date, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_type, item_id, member_id) DO UPDATE SET
        instructions = COALESCE(excluded.instructions, instructions),
        due_date = COALESCE(excluded.due_date, due_date),
        updated_at = excluded.updated_at
    `);
    for (const memberId of assignedMemberIds) {
      const assignId = 'ra_' + itemType + '_' + itemId + '_' + memberId;
      insertStmt.run(assignId, itemType, itemId, memberId, 'Unread', instructions || null, dueDate || null, null, now, now);
    }
  } else {
    db.prepare('DELETE FROM reading_assignments WHERE item_type = ? AND item_id = ?').run(itemType, itemId);
  }
}

// -------------------------------------------------------------
// 6. Tasks
// -------------------------------------------------------------
app.get('/api/tasks', (_req: Request, res: Response) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, m.title as milestone_title, tm.name as assigned_to_name
      FROM tasks t
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN team_members tm ON t.assigned_to_id = tm.id
      WHERE t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `).all();
    const enriched = attachTaskAssignments(tasks);
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      milestone_id,
      assigned_to_id,
      assigned_member_ids,
      is_all_members,
      status,
      priority,
      category,
      start_date,
      due_date,
      user_name,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const id = 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();
    const isAll = Boolean(is_all_members) ? 1 : 0;

    // If single or multiple member IDs provided
    let primaryAssignedId = assigned_to_id || null;
    if (isAll) {
      primaryAssignedId = null;
    } else if (Array.isArray(assigned_member_ids) && assigned_member_ids.length > 0) {
      primaryAssignedId = assigned_member_ids.length === 1 ? assigned_member_ids[0] : null;
    }

    db.prepare(`
      INSERT INTO tasks (
        id, milestone_id, title, description, assigned_to_id, is_all_members,
        status, priority, category, start_date, due_date, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      milestone_id || null,
      title,
      description || '',
      primaryAssignedId,
      isAll,
      status || 'Not Started',
      priority || 'Medium',
      category || 'General',
      start_date || '',
      due_date || '',
      req.user?.id || null,
      created_at
    );

    // Sync task assignments table
    syncTaskAssignments(id, isAll, assigned_member_ids, primaryAssignedId, status || 'Not Started');

    const activityTarget = isAll ? 'All Team Members' : (primaryAssignedId ? 'assigned team member' : 'team');
    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `created task (assigned to ${activityTarget})`, 'Task', title);

    const newTask = db.prepare(`
      SELECT t.*, m.title as milestone_title, tm.name as assigned_to_name
      FROM tasks t
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN team_members tm ON t.assigned_to_id = tm.id
      WHERE t.id = ?
    `).all(id);

    const enriched = attachTaskAssignments(newTask);
    res.status(201).json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      milestone_id,
      assigned_to_id,
      assigned_member_ids,
      is_all_members,
      status,
      priority,
      category,
      start_date,
      due_date,
      user_name,
    } = req.body;

    const completed_at = status === 'Completed' ? new Date().toISOString() : null;
    const hasIsAll = typeof is_all_members !== 'undefined';
    const isAll = hasIsAll ? (Boolean(is_all_members) ? 1 : 0) : undefined;

    let primaryAssignedId = assigned_to_id;
    if (isAll === 1) {
      primaryAssignedId = null;
    } else if (Array.isArray(assigned_member_ids)) {
      primaryAssignedId = assigned_member_ids.length === 1 ? assigned_member_ids[0] : null;
    }

    db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          milestone_id = COALESCE(?, milestone_id),
          assigned_to_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assigned_to_id END,
          is_all_members = COALESCE(?, is_all_members),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          category = COALESCE(?, category),
          start_date = COALESCE(?, start_date),
          due_date = COALESCE(?, due_date),
          completed_at = CASE WHEN ? = 'Completed' THEN ? ELSE completed_at END
      WHERE id = ?
    `).run(
      title,
      description,
      milestone_id,
      hasIsAll || Array.isArray(assigned_member_ids) ? 1 : null,
      primaryAssignedId,
      isAll,
      status,
      priority,
      category,
      start_date,
      due_date,
      status,
      completed_at,
      id
    );

    if (hasIsAll || Array.isArray(assigned_member_ids) || typeof assigned_to_id !== 'undefined') {
      const currentTask = db.prepare('SELECT is_all_members, status FROM tasks WHERE id = ?').get(id) as any;
      syncTaskAssignments(id, isAll ?? currentTask?.is_all_members, assigned_member_ids, primaryAssignedId, status || currentTask?.status);
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `updated task status to ${status || 'edited'}`, 'Task', title || id);

    const updated = db.prepare(`
      SELECT t.*, m.title as milestone_title, tm.name as assigned_to_name
      FROM tasks t
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN team_members tm ON t.assigned_to_id = tm.id
      WHERE t.id = ?
    `).all(id);

    const enriched = attachTaskAssignments(updated);
    res.json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Individual Member Task Status Update (Without altering other members' status)
app.put('/api/tasks/:id/assignment-status', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, member_id, user_name } = req.body;
    const targetMemberId = member_id || req.user?.id;
    if (!targetMemberId) return res.status(400).json({ error: 'Member ID is required' });
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const now = new Date().toISOString();
    const completed_at = status === 'Completed' ? now : null;

    const assignId = 'ta_' + id + '_' + targetMemberId;
    db.prepare(`
      INSERT INTO task_assignments (id, task_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id, member_id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `).run(assignId, id, targetMemberId, status, completed_at, now, now);

    // Compute overall task status based on all assignments
    const assignments = db.prepare('SELECT status FROM task_assignments WHERE task_id = ?').all(id) as any[];
    if (assignments.length > 0) {
      const allCompleted = assignments.every((a) => a.status === 'Completed');
      const anyInProgress = assignments.some((a) => a.status === 'In Progress' || a.status === 'Completed');
      const anyBlocked = assignments.some((a) => a.status === 'Blocked');

      let newParentStatus = 'Not Started';
      if (allCompleted) newParentStatus = 'Completed';
      else if (anyBlocked) newParentStatus = 'Blocked';
      else if (anyInProgress) newParentStatus = 'In Progress';

      db.prepare(`
        UPDATE tasks
        SET status = ?,
            completed_at = CASE WHEN ? = 'Completed' THEN ? ELSE NULL END
        WHERE id = ?
      `).run(newParentStatus, newParentStatus, now, id);
    }

    const taskTitle = (db.prepare('SELECT title FROM tasks WHERE id = ?').get(id) as any)?.title || id;
    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `updated personal task status to "${status}"`, 'Task', taskTitle);

    const taskRows = db.prepare(`
      SELECT t.*, m.title as milestone_title, tm.name as assigned_to_name
      FROM tasks t
      LEFT JOIN milestones m ON t.milestone_id = m.id
      LEFT JOIN team_members tm ON t.assigned_to_id = tm.id
      WHERE t.id = ?
    `).all(id);

    const enriched = attachTaskAssignments(taskRows);
    res.json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Task
app.delete('/api/tasks/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(id) as any;
    db.prepare('UPDATE tasks SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved task to trash', 'Task', task?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. Testing & Experiments
// -------------------------------------------------------------
app.get('/api/tests', (_req: Request, res: Response) => {
  try {
    const tests = db.prepare(`
      SELECT t.*, tm.name as performed_by_name,
             (SELECT COUNT(*) FROM test_measurements tm_sub WHERE tm_sub.test_id = t.id) as measurement_count
      FROM tests t
      LEFT JOIN team_members tm ON t.performed_by_id = tm.id
      WHERE t.deleted_at IS NULL
      ORDER BY t.date DESC, t.created_at DESC
    `).all();
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/:id/measurements', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const measurements = db.prepare(`
      SELECT * FROM test_measurements WHERE test_id = ? ORDER BY time_ms ASC
    `).all(id);
    res.json(measurements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tests', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      test_name,
      test_type,
      date,
      performed_by_id,
      status,
      observations,
      result,
      hardware_setup,
      supply_voltage_v,
      supply_current_a,
      pwm_freq_khz,
      user_name,
    } = req.body;

    if (!test_name) return res.status(400).json({ error: 'Test name is required' });

    const id = 'tst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO tests (
        id, test_name, test_type, date, performed_by_id, status,
        observations, result, hardware_setup, supply_voltage_v, supply_current_a, pwm_freq_khz, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      test_name,
      test_type || 'General',
      date || new Date().toISOString().split('T')[0],
      performed_by_id || null,
      status || 'Passed',
      observations || '',
      result || '',
      hardware_setup || '',
      supply_voltage_v || null,
      supply_current_a || null,
      pwm_freq_khz || null,
      created_at
    );

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'logged experimental test', 'Testing', test_name);

    const newTest = db.prepare(`
      SELECT t.*, tm.name as performed_by_name
      FROM tests t
      LEFT JOIN team_members tm ON t.performed_by_id = tm.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(newTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload and parse CSV measurements
app.post('/api/tests/upload-csv', requireAuth, upload.single('csv_file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const {
      test_name,
      test_type,
      date,
      performed_by_id,
      status,
      observations,
      hardware_setup,
      supply_voltage_v,
      supply_current_a,
      pwm_freq_khz,
      user_name,
    } = req.body;

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file contains no data rows.' });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const timeIdx = headers.findIndex((h) => h.includes('time') || h === 't' || h.includes('ms'));
    const speedIdx = headers.findIndex((h) => h.includes('speed') || h.includes('rpm'));
    const currentIdx = headers.findIndex((h) => h.includes('current') || h === 'i' || h.includes('amps'));
    const torqueIdx = headers.findIndex((h) => h.includes('torque') || h.includes('nm'));
    const tempIdx = headers.findIndex((h) => h.includes('temp') || h.includes('c'));
    const voltageIdx = headers.findIndex((h) => h.includes('voltage') || h === 'v');

    const testId = 'tst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO tests (
        id, test_name, test_type, date, performed_by_id, status,
        observations, result, hardware_setup, supply_voltage_v, supply_current_a, pwm_freq_khz, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testId,
      test_name || req.file.originalname,
      test_type || 'CSV Dyno Run',
      date || new Date().toISOString().split('T')[0],
      performed_by_id || null,
      status || 'Passed',
      observations || `Uploaded CSV file: ${req.file.originalname}`,
      `Imported ${lines.length - 1} measurements`,
      hardware_setup || '',
      supply_voltage_v || null,
      supply_current_a || null,
      pwm_freq_khz || null,
      created_at
    );

    const insertMeas = db.prepare(`
      INSERT INTO test_measurements (id, test_id, time_ms, speed_rpm, current_a, torque_nm, temp_c, voltage_v)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((rows: string[]) => {
      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map((c) => parseFloat(c.trim()));
        if (cols.some((c) => isNaN(c))) continue;

        const measId = 'tm_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5);
        const time_ms = timeIdx >= 0 && !isNaN(cols[timeIdx]) ? cols[timeIdx] : (i - 1) * 10;
        const speed_rpm = speedIdx >= 0 ? cols[speedIdx] : null;
        const current_a = currentIdx >= 0 ? cols[currentIdx] : null;
        const torque_nm = torqueIdx >= 0 ? cols[torqueIdx] : null;
        const temp_c = tempIdx >= 0 ? cols[tempIdx] : null;
        const voltage_v = voltageIdx >= 0 ? cols[voltageIdx] : null;

        insertMeas.run(measId, testId, time_ms, speed_rpm, current_a, torque_nm, temp_c, voltage_v);
        count++;
      }
      return count;
    });

    const parsedCount = insertMany(lines);
    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `uploaded CSV dataset (${parsedCount} pts)`, 'Testing', test_name || req.file.originalname);

    const newTest = db.prepare(`
      SELECT t.*, tm.name as performed_by_name,
             (SELECT COUNT(*) FROM test_measurements tm_sub WHERE tm_sub.test_id = t.id) as measurement_count
      FROM tests t
      LEFT JOIN team_members tm ON t.performed_by_id = tm.id
      WHERE t.id = ?
    `).get(testId);

    res.status(201).json(newTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Test
app.delete('/api/tests/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const test = db.prepare('SELECT test_name FROM tests WHERE id = ?').get(id) as any;
    db.prepare('UPDATE tests SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved test record to trash', 'Testing', test?.test_name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7B. GitHub Integration (Ehna12/Field-Oriented-Control-of-BLDC-motor)
// -------------------------------------------------------------
app.get('/api/github/repo', async (_req: Request, res: Response) => {
  try {
    const data = await fetchGitHubRepo();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/github/commits', async (_req: Request, res: Response) => {
  try {
    const commits = await fetchGitHubCommits();
    res.json(commits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/github/branches', async (_req: Request, res: Response) => {
  try {
    const branches = await fetchGitHubBranches();
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/github/tree', async (req: Request, res: Response) => {
  try {
    const branch = (req.query.branch as string) || 'main';
    const tree = await fetchGitHubTree(branch);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7C. Simulink & Simulation Models
// -------------------------------------------------------------
app.get('/api/simulations', (_req: Request, res: Response) => {
  try {
    const models = db.prepare(`
      SELECT sm.*, m.title as milestone_title, tm.name as created_by_name,
             (SELECT COUNT(*) FROM simulation_experiment_links sel WHERE sel.simulation_id = sm.id) as linked_experiment_count
      FROM simulation_models sm
      LEFT JOIN milestones m ON sm.milestone_id = m.id
      LEFT JOIN team_members tm ON sm.created_by_id = tm.id
      WHERE sm.deleted_at IS NULL
      ORDER BY sm.created_at DESC
    `).all();

    const getLinks = db.prepare(`
      SELECT sel.id as link_id, sel.test_id, t.test_name, t.test_type, t.status as test_status, t.date as test_date
      FROM simulation_experiment_links sel
      JOIN tests t ON sel.test_id = t.id
      WHERE sel.simulation_id = ? AND t.deleted_at IS NULL
    `);

    const enriched = models.map((m: any) => ({
      ...m,
      linked_experiments: getLinks.all(m.id),
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/simulations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const model = db.prepare(`
      SELECT sm.*, m.title as milestone_title, tm.name as created_by_name
      FROM simulation_models sm
      LEFT JOIN milestones m ON sm.milestone_id = m.id
      LEFT JOIN team_members tm ON sm.created_by_id = tm.id
      WHERE sm.id = ? AND sm.deleted_at IS NULL
    `).get(id) as any;

    if (!model) {
      return res.status(404).json({ error: 'Simulation model not found' });
    }

    const linkedExperiments = db.prepare(`
      SELECT sel.id as link_id, sel.test_id, t.test_name, t.test_type, t.status as test_status, t.date as test_date
      FROM simulation_experiment_links sel
      JOIN tests t ON sel.test_id = t.id
      WHERE sel.simulation_id = ? AND t.deleted_at IS NULL
    `).all(id);

    res.json({
      ...model,
      linked_experiments: linkedExperiments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/simulations', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      purpose,
      github_path,
      status,
      milestone_id,
      objective,
      parameters,
      inputs,
      expected_output,
      results,
      conclusion,
      notes,
      linked_test_ids,
      user_name,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const id = 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO simulation_models (
        id, name, description, purpose, github_path, status, milestone_id,
        objective, parameters, inputs, expected_output, results, conclusion,
        notes, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      description || '',
      purpose || '',
      github_path || '',
      status || 'In Development',
      milestone_id || null,
      objective || '',
      parameters || '',
      inputs || '',
      expected_output || '',
      results || '',
      conclusion || '',
      notes || '',
      req.user?.id || null,
      now,
      now
    );

    if (Array.isArray(linked_test_ids) && linked_test_ids.length > 0) {
      const insertLink = db.prepare(`
        INSERT INTO simulation_experiment_links (id, simulation_id, test_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const testId of linked_test_ids) {
        const linkId = 'sel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
        insertLink.run(linkId, id, testId, now);
      }
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'documented Simulink model', 'Simulink', name);

    const created = db.prepare(`
      SELECT sm.*, m.title as milestone_title, tm.name as created_by_name
      FROM simulation_models sm
      LEFT JOIN milestones m ON sm.milestone_id = m.id
      LEFT JOIN team_members tm ON sm.created_by_id = tm.id
      WHERE sm.id = ?
    `).get(id) as any;

    const linkedExperiments = db.prepare(`
      SELECT sel.id as link_id, sel.test_id, t.test_name, t.test_type, t.status as test_status, t.date as test_date
      FROM simulation_experiment_links sel
      JOIN tests t ON sel.test_id = t.id
      WHERE sel.simulation_id = ? AND t.deleted_at IS NULL
    `).all(id);

    res.status(201).json({ ...created, linked_experiments: linkedExperiments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/simulations/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      purpose,
      github_path,
      status,
      milestone_id,
      objective,
      parameters,
      inputs,
      expected_output,
      results,
      conclusion,
      notes,
      linked_test_ids,
      user_name,
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE simulation_models
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          purpose = COALESCE(?, purpose),
          github_path = COALESCE(?, github_path),
          status = COALESCE(?, status),
          milestone_id = COALESCE(?, milestone_id),
          objective = COALESCE(?, objective),
          parameters = COALESCE(?, parameters),
          inputs = COALESCE(?, inputs),
          expected_output = COALESCE(?, expected_output),
          results = COALESCE(?, results),
          conclusion = COALESCE(?, conclusion),
          notes = COALESCE(?, notes),
          updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description,
      purpose,
      github_path,
      status,
      milestone_id,
      objective,
      parameters,
      inputs,
      expected_output,
      results,
      conclusion,
      notes,
      now,
      id
    );

    if (Array.isArray(linked_test_ids)) {
      db.prepare('DELETE FROM simulation_experiment_links WHERE simulation_id = ?').run(id);
      const insertLink = db.prepare(`
        INSERT INTO simulation_experiment_links (id, simulation_id, test_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const testId of linked_test_ids) {
        const linkId = 'sel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
        insertLink.run(linkId, id, testId, now);
      }
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated simulation model', 'Simulink', name || id);

    const updated = db.prepare(`
      SELECT sm.*, m.title as milestone_title, tm.name as created_by_name
      FROM simulation_models sm
      LEFT JOIN milestones m ON sm.milestone_id = m.id
      LEFT JOIN team_members tm ON sm.created_by_id = tm.id
      WHERE sm.id = ?
    `).get(id) as any;

    const linkedExperiments = db.prepare(`
      SELECT sel.id as link_id, sel.test_id, t.test_name, t.test_type, t.status as test_status, t.date as test_date
      FROM simulation_experiment_links sel
      JOIN tests t ON sel.test_id = t.id
      WHERE sel.simulation_id = ? AND t.deleted_at IS NULL
    `).all(id);

    res.json({ ...updated, linked_experiments: linkedExperiments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Simulation Model
app.delete('/api/simulations/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const model = db.prepare('SELECT name FROM simulation_models WHERE id = ?').get(id) as any;
    db.prepare('UPDATE simulation_models SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved simulation model to trash', 'Simulink', model?.name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Link Simulation to Experiment
app.post('/api/simulations/link-experiment', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { simulation_id, test_id } = req.body;
    if (!simulation_id || !test_id) {
      return res.status(400).json({ error: 'simulation_id and test_id are required' });
    }

    const existing = db.prepare('SELECT * FROM simulation_experiment_links WHERE simulation_id = ? AND test_id = ?').get(simulation_id, test_id);
    if (existing) {
      return res.json({ success: true, message: 'Already linked' });
    }

    const linkId = 'sel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    db.prepare(`
      INSERT INTO simulation_experiment_links (id, simulation_id, test_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(linkId, simulation_id, test_id, new Date().toISOString());

    res.status(201).json({ success: true, link_id: linkId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unlink Simulation from Experiment
app.delete('/api/simulations/link-experiment/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM simulation_experiment_links WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. Issues & Blockers
// -------------------------------------------------------------
app.get('/api/issues', (_req: Request, res: Response) => {
  try {
    const issues = db.prepare(`
      SELECT i.*, tm.name as assigned_to_name, rpt.name as reported_by_name
      FROM issues i
      LEFT JOIN team_members tm ON i.assigned_to_id = tm.id
      LEFT JOIN team_members rpt ON i.reported_by_id = rpt.id
      WHERE i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `).all();
    res.json(issues);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/issues', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assigned_to_id, priority, status, subsystem, possible_cause, solution, user_name } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const id = 'iss_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO issues (id, title, description, reported_by_id, assigned_to_id, priority, status, subsystem, possible_cause, solution, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description || '',
      req.user?.id || null,
      assigned_to_id || null,
      priority || 'Medium',
      status || 'Open',
      subsystem || 'General',
      possible_cause || '',
      solution || '',
      created_at
    );

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'reported issue', 'Issue', title);

    const newIssue = db.prepare(`
      SELECT i.*, tm.name as assigned_to_name
      FROM issues i
      LEFT JOIN team_members tm ON i.assigned_to_id = tm.id
      WHERE i.id = ?
    `).get(id);

    res.status(201).json(newIssue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/issues/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to_id, priority, status, subsystem, possible_cause, solution, user_name } = req.body;

    const resolved_at = (status === 'Fixed' || status === 'Closed') ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE issues
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          assigned_to_id = COALESCE(?, assigned_to_id),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          subsystem = COALESCE(?, subsystem),
          possible_cause = COALESCE(?, possible_cause),
          solution = COALESCE(?, solution),
          resolved_at = CASE WHEN ? IN ('Fixed', 'Closed') THEN ? ELSE resolved_at END
      WHERE id = ?
    `).run(title, description, assigned_to_id, priority, status, subsystem, possible_cause, solution, status, resolved_at, id);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `updated issue status to ${status || 'edited'}`, 'Issue', title || id);

    const updated = db.prepare(`
      SELECT i.*, tm.name as assigned_to_name
      FROM issues i
      LEFT JOIN team_members tm ON i.assigned_to_id = tm.id
      WHERE i.id = ?
    `).get(id);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Issue
app.delete('/api/issues/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const issue = db.prepare('SELECT title FROM issues WHERE id = ?').get(id) as any;
    db.prepare('UPDATE issues SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved issue to trash', 'Issue', issue?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 9. Documents & Project Attachments
// -------------------------------------------------------------
app.get('/api/documents', (_req: Request, res: Response) => {
  try {
    const docs = db.prepare(`
      SELECT d.*, tm.name as uploaded_by_name
      FROM documents d
      LEFT JOIN team_members tm ON d.uploaded_by_id = tm.id
      WHERE d.deleted_at IS NULL
      ORDER BY d.created_at DESC
    `).all();
    const enriched = attachReadingAssignments(docs, 'document');
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/upload', requireAuth, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      type,
      description,
      user_name,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      uploaded_by_id,
    } = req.body;

    const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const file_url = `/uploads/${req.file.filename}`;
    const file_size = (req.file.size / 1024).toFixed(1) + ' KB';
    const created_at = new Date().toISOString();
    const isAll = Boolean(is_all_members) ? 1 : 0;

    const uId = req.user?.id || uploaded_by_id || null;
    const userExists = uId ? db.prepare('SELECT id FROM team_members WHERE id = ?').get(uId) : null;
    const safe_uploaded_by_id = userExists ? uId : null;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    db.prepare(`
      INSERT INTO documents (
        id, file_name, file_url, file_size, uploaded_by_id, type, description,
        is_all_members, due_date, instructions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.file.originalname,
      file_url,
      file_size,
      safe_uploaded_by_id,
      type || 'Datasheet',
      description || '',
      isAll,
      due_date || '',
      instructions || '',
      created_at
    );

    syncReadingAssignments('document', id, isAll, memberIds, instructions, due_date);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'uploaded project document', 'Document', req.file.originalname);

    const newDoc = db.prepare(`
      SELECT d.*, tm.name as uploaded_by_name
      FROM documents d
      LEFT JOIN team_members tm ON d.uploaded_by_id = tm.id
      WHERE d.id = ?
    `).all(id);

    const enriched = attachReadingAssignments(newDoc, 'document');
    res.status(201).json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Document
app.delete('/api/documents/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT file_name FROM documents WHERE id = ?').get(id) as any;
    db.prepare('UPDATE documents SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved document to trash', 'Document', doc?.file_name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 10. Research Papers Library
// -------------------------------------------------------------
app.get('/api/research-papers', (_req: Request, res: Response) => {
  try {
    const papers = db.prepare(`
      SELECT p.*, tm.name as added_by_name
      FROM research_papers p
      LEFT JOIN team_members tm ON p.added_by_id = tm.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `).all();
    const enriched = attachReadingAssignments(papers, 'research_paper');
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/research-papers', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      authors,
      year,
      journal_conference,
      doi,
      url,
      pdf_url,
      pdf_name,
      topic,
      tags,
      summary,
      notes,
      reading_status,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      user_name,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Paper title is required' });

    const id = 'ppr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();
    const isAll = Boolean(is_all_members) ? 1 : 0;

    const userExists = req.user?.id ? db.prepare('SELECT id FROM team_members WHERE id = ?').get(req.user.id) : null;
    const added_by_id = userExists ? req.user?.id : null;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    db.prepare(`
      INSERT INTO research_papers (
        id, title, authors, year, journal_conference, doi, url, pdf_url, pdf_name,
        topic, tags, summary, notes, reading_status, is_all_members, due_date, instructions,
        added_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      authors || '',
      year ? parseInt(year) : null,
      journal_conference || '',
      doi || '',
      url || '',
      pdf_url || '',
      pdf_name || '',
      topic || '',
      tags || '',
      summary || '',
      notes || '',
      reading_status || 'Unread',
      isAll,
      due_date || '',
      instructions || '',
      added_by_id,
      created_at,
      created_at
    );

    syncReadingAssignments('research_paper', id, isAll, memberIds, instructions, due_date);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'added research paper', 'Research', title);

    const newPaper = db.prepare(`
      SELECT p.*, tm.name as added_by_name
      FROM research_papers p
      LEFT JOIN team_members tm ON p.added_by_id = tm.id
      WHERE p.id = ?
    `).all(id);

    const enriched = attachReadingAssignments(newPaper, 'research_paper');
    res.status(201).json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Research Paper PDF & Save/Update Paper
app.post('/api/research-papers/upload-pdf', requireAuth, upload.single('pdf_file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const {
      id: paperId,
      title,
      authors,
      year,
      journal_conference,
      doi,
      url,
      topic,
      tags,
      summary,
      notes,
      reading_status,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      user_name,
    } = req.body;

    const pdf_url = `/uploads/${req.file.filename}`;
    const pdf_name = req.file.originalname;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    // 1. If updating an existing paper
    if (paperId) {
      const updated_at = new Date().toISOString();
      const hasIsAll = typeof is_all_members !== 'undefined';
      const isAll = hasIsAll ? (Boolean(is_all_members) ? 1 : 0) : undefined;

      db.prepare(`
        UPDATE research_papers
        SET title = COALESCE(?, title),
            authors = COALESCE(?, authors),
            year = COALESCE(?, year),
            journal_conference = COALESCE(?, journal_conference),
            doi = COALESCE(?, doi),
            url = COALESCE(?, url),
            pdf_url = ?,
            pdf_name = ?,
            topic = COALESCE(?, topic),
            tags = COALESCE(?, tags),
            summary = COALESCE(?, summary),
            notes = COALESCE(?, notes),
            reading_status = COALESCE(?, reading_status),
            is_all_members = COALESCE(?, is_all_members),
            due_date = COALESCE(?, due_date),
            instructions = COALESCE(?, instructions),
            updated_at = ?
        WHERE id = ?
      `).run(
        title || null,
        authors || null,
        year ? parseInt(year) : null,
        journal_conference || null,
        doi || null,
        url || null,
        pdf_url,
        pdf_name,
        topic || null,
        tags || null,
        summary || null,
        notes || null,
        reading_status || null,
        isAll,
        due_date || null,
        instructions || null,
        updated_at,
        paperId
      );

      if (hasIsAll || Array.isArray(memberIds)) {
        const curr = db.prepare('SELECT is_all_members, instructions, due_date FROM research_papers WHERE id = ?').get(paperId) as any;
        syncReadingAssignments('research_paper', paperId, isAll ?? curr?.is_all_members, memberIds, instructions ?? curr?.instructions, due_date ?? curr?.due_date);
      }

      logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated research paper with PDF', 'Research', title || paperId);

      const updated = db.prepare(`
        SELECT p.*, tm.name as added_by_name
        FROM research_papers p
        LEFT JOIN team_members tm ON p.added_by_id = tm.id
        WHERE p.id = ?
      `).all(paperId);

      const enriched = attachReadingAssignments(updated, 'research_paper');
      return res.json(enriched[0]);
    }

    // 2. If creating a new paper (title is present)
    if (title && title.trim()) {
      const id = 'ppr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const created_at = new Date().toISOString();
      const isAll = Boolean(is_all_members) ? 1 : 0;

      const userExists = req.user?.id ? db.prepare('SELECT id FROM team_members WHERE id = ?').get(req.user.id) : null;
      const added_by_id = userExists ? req.user?.id : null;

      db.prepare(`
        INSERT INTO research_papers (
          id, title, authors, year, journal_conference, doi, url, pdf_url, pdf_name,
          topic, tags, summary, notes, reading_status, is_all_members, due_date, instructions,
          added_by_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        title.trim(),
        authors || '',
        year ? parseInt(year) : null,
        journal_conference || '',
        doi || '',
        url || '',
        pdf_url,
        pdf_name,
        topic || '',
        tags || '',
        summary || '',
        notes || '',
        reading_status || 'Unread',
        isAll,
        due_date || '',
        instructions || '',
        added_by_id,
        created_at,
        created_at
      );

      syncReadingAssignments('research_paper', id, isAll, memberIds, instructions, due_date);

      logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'added research paper', 'Research', title.trim());

      const newPaper = db.prepare(`
        SELECT p.*, tm.name as added_by_name
        FROM research_papers p
        LEFT JOIN team_members tm ON p.added_by_id = tm.id
        WHERE p.id = ?
      `).all(id);

      const enriched = attachReadingAssignments(newPaper, 'research_paper');
      return res.status(201).json(enriched[0]);
    }

    // 3. Standalone file upload fallback
    res.json({
      pdf_url,
      pdf_name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/research-papers/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      authors,
      year,
      journal_conference,
      doi,
      url,
      pdf_url,
      pdf_name,
      topic,
      tags,
      summary,
      notes,
      reading_status,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      user_name,
    } = req.body;

    const updated_at = new Date().toISOString();
    const hasIsAll = typeof is_all_members !== 'undefined';
    const isAll = hasIsAll ? (Boolean(is_all_members) ? 1 : 0) : undefined;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    db.prepare(`
      UPDATE research_papers
      SET title = COALESCE(?, title),
          authors = COALESCE(?, authors),
          year = COALESCE(?, year),
          journal_conference = COALESCE(?, journal_conference),
          doi = COALESCE(?, doi),
          url = COALESCE(?, url),
          pdf_url = COALESCE(?, pdf_url),
          pdf_name = COALESCE(?, pdf_name),
          topic = COALESCE(?, topic),
          tags = COALESCE(?, tags),
          summary = COALESCE(?, summary),
          notes = COALESCE(?, notes),
          reading_status = COALESCE(?, reading_status),
          is_all_members = COALESCE(?, is_all_members),
          due_date = COALESCE(?, due_date),
          instructions = COALESCE(?, instructions),
          updated_at = ?
      WHERE id = ?
    `).run(
      title,
      authors,
      year ? parseInt(year) : null,
      journal_conference,
      doi,
      url,
      pdf_url,
      pdf_name,
      topic,
      tags,
      summary,
      notes,
      reading_status,
      isAll,
      due_date,
      instructions,
      updated_at,
      id
    );

    if (hasIsAll || Array.isArray(memberIds)) {
      const curr = db.prepare('SELECT is_all_members, instructions, due_date FROM research_papers WHERE id = ?').get(id) as any;
      syncReadingAssignments('research_paper', id, isAll ?? curr?.is_all_members, memberIds, instructions ?? curr?.instructions, due_date ?? curr?.due_date);
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated research paper', 'Research', title || id);

    const updated = db.prepare(`
      SELECT p.*, tm.name as added_by_name
      FROM research_papers p
      LEFT JOIN team_members tm ON p.added_by_id = tm.id
      WHERE p.id = ?
    `).all(id);

    const enriched = attachReadingAssignments(updated, 'research_paper');
    res.json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Research Paper
app.delete('/api/research-papers/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paper = db.prepare('SELECT title FROM research_papers WHERE id = ?').get(id) as any;
    db.prepare('UPDATE research_papers SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved research paper to trash', 'Research', paper?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 11. Learning & Reference Resources
// -------------------------------------------------------------
app.get('/api/learning-resources', (_req: Request, res: Response) => {
  try {
    const resources = db.prepare(`
      SELECT r.*, tm.name as added_by_name
      FROM learning_resources r
      LEFT JOIN team_members tm ON r.added_by_id = tm.id
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `).all();
    const enriched = attachReadingAssignments(resources, 'learning_resource');
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/learning-resources', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      url,
      resource_type,
      topic,
      description,
      tags,
      notes,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      user_name,
    } = req.body;

    if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

    const id = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();
    const isAll = Boolean(is_all_members) ? 1 : 0;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    db.prepare(`
      INSERT INTO learning_resources (
        id, title, url, resource_type, topic, description, tags, notes,
        is_all_members, due_date, instructions, added_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      url,
      resource_type || 'Video',
      topic || '',
      description || '',
      tags || '',
      notes || '',
      isAll,
      due_date || '',
      instructions || '',
      req.user?.id || null,
      created_at
    );

    syncReadingAssignments('learning_resource', id, isAll, memberIds, instructions, due_date);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'added learning resource', 'Learning', title);

    const newRes = db.prepare(`
      SELECT r.*, tm.name as added_by_name
      FROM learning_resources r
      LEFT JOIN team_members tm ON r.added_by_id = tm.id
      WHERE r.id = ?
    `).all(id);

    const enriched = attachReadingAssignments(newRes, 'learning_resource');
    res.status(201).json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/learning-resources/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      url,
      resource_type,
      topic,
      description,
      tags,
      notes,
      is_all_members,
      assigned_member_ids,
      due_date,
      instructions,
      user_name,
    } = req.body;

    const hasIsAll = typeof is_all_members !== 'undefined';
    const isAll = hasIsAll ? (Boolean(is_all_members) ? 1 : 0) : undefined;

    let memberIds = assigned_member_ids;
    if (typeof memberIds === 'string') {
      try { memberIds = JSON.parse(memberIds); } catch (_) { memberIds = memberIds.split(',').map((s: string) => s.trim()); }
    }

    db.prepare(`
      UPDATE learning_resources
      SET title = COALESCE(?, title),
          url = COALESCE(?, url),
          resource_type = COALESCE(?, resource_type),
          topic = COALESCE(?, topic),
          description = COALESCE(?, description),
          tags = COALESCE(?, tags),
          notes = COALESCE(?, notes),
          is_all_members = COALESCE(?, is_all_members),
          due_date = COALESCE(?, due_date),
          instructions = COALESCE(?, instructions)
      WHERE id = ?
    `).run(title, url, resource_type, topic, description, tags, notes, isAll, due_date, instructions, id);

    if (hasIsAll || Array.isArray(memberIds)) {
      const curr = db.prepare('SELECT is_all_members, instructions, due_date FROM learning_resources WHERE id = ?').get(id) as any;
      syncReadingAssignments('learning_resource', id, isAll ?? curr?.is_all_members, memberIds, instructions ?? curr?.instructions, due_date ?? curr?.due_date);
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated learning resource', 'Learning', title || id);

    const updated = db.prepare(`
      SELECT r.*, tm.name as added_by_name
      FROM learning_resources r
      LEFT JOIN team_members tm ON r.added_by_id = tm.id
      WHERE r.id = ?
    `).all(id);

    const enriched = attachReadingAssignments(updated, 'learning_resource');
    res.json(enriched[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Learning Resource
app.delete('/api/learning-resources/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const resItem = db.prepare('SELECT title FROM learning_resources WHERE id = ?').get(id) as any;
    db.prepare('UPDATE learning_resources SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved learning resource to trash', 'Learning', resItem?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 12. Reading Material Individual Member Status Update
// -------------------------------------------------------------
app.put('/api/reading-assignments/:itemType/:itemId/status', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { itemType, itemId } = req.params;
    const { status, member_id, user_name } = req.body;
    const targetMemberId = member_id || req.user?.id;
    if (!targetMemberId) return res.status(400).json({ error: 'Member ID is required' });
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const now = new Date().toISOString();
    const completed_at = status === 'Completed' ? now : null;
    const assignId = 'ra_' + itemType + '_' + itemId + '_' + targetMemberId;

    db.prepare(`
      INSERT INTO reading_assignments (id, item_type, item_id, member_id, status, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_type, item_id, member_id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `).run(assignId, itemType, itemId, targetMemberId, status, completed_at, now, now);

    // If research paper, update default reading_status if applicable
    if (itemType === 'research_paper') {
      const assignments = db.prepare('SELECT status FROM reading_assignments WHERE item_type = ? AND item_id = ?').all(itemType, itemId) as any[];
      if (assignments.length > 0 && assignments.every((a) => a.status === 'Completed')) {
        db.prepare('UPDATE research_papers SET reading_status = ?, updated_at = ? WHERE id = ?').run('Completed', now, itemId);
      }
    }

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, `updated reading status to "${status}"`, 'Reading', itemId);
    res.json({ success: true, status, completed_at });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 13. Engineering Notes
// -------------------------------------------------------------
app.get('/api/engineering-notes', (_req: Request, res: Response) => {
  try {
    const notes = db.prepare(`
      SELECT n.*, tm.name as author_name
      FROM engineering_notes n
      LEFT JOIN team_members tm ON n.author_id = tm.id
      WHERE n.deleted_at IS NULL
      ORDER BY n.updated_at DESC
    `).all();
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/engineering-notes', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, content, tags, user_name } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const id = 'not_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO engineering_notes (id, title, content, tags, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      content || '',
      tags || '',
      req.user?.id || null,
      created_at,
      created_at
    );

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'created engineering note', 'Notebook', title);

    const newNote = db.prepare(`
      SELECT n.*, tm.name as author_name
      FROM engineering_notes n
      LEFT JOIN team_members tm ON n.author_id = tm.id
      WHERE n.id = ?
    `).get(id);

    res.status(201).json(newNote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/engineering-notes/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, tags, user_name } = req.body;

    const updated_at = new Date().toISOString();

    db.prepare(`
      UPDATE engineering_notes
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          tags = COALESCE(?, tags),
          updated_at = ?
      WHERE id = ?
    `).run(title, content, tags, updated_at, id);

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated engineering note', 'Notebook', title || id);

    const updated = db.prepare(`
      SELECT n.*, tm.name as author_name
      FROM engineering_notes n
      LEFT JOIN team_members tm ON n.author_id = tm.id
      WHERE n.id = ?
    `).get(id);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Engineering Note
app.delete('/api/engineering-notes/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = db.prepare('SELECT title FROM engineering_notes WHERE id = ?').get(id) as any;
    db.prepare('UPDATE engineering_notes SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved engineering note to trash', 'Notebook', note?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 13. Collaborative Report Sections & Word (.DOCX) Export
// -------------------------------------------------------------
app.get('/api/report/sections', (_req: Request, res: Response) => {
  try {
    const sections = db.prepare(`
      SELECT s.*, tm.name as last_edited_by_name,
             (SELECT COUNT(*) FROM report_links rl WHERE rl.report_section_id = s.id) as link_count
      FROM report_sections s
      LEFT JOIN team_members tm ON s.last_edited_by_id = tm.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.order_index ASC, s.created_at ASC
    `).all();
    res.json(sections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/report/sections', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, content, status, order_index, user_name } = req.body;
    if (!title) return res.status(400).json({ error: 'Chapter title is required' });

    const id = 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();
    const authorName = user_name || req.user?.name || 'Team Member';

    db.prepare(`
      INSERT INTO report_sections (id, title, order_index, content, status, last_edited_by_id, last_edited_by_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      order_index || 0,
      content || '',
      status || 'Draft',
      req.user?.id || null,
      authorName,
      created_at,
      created_at
    );

    logActivity(authorName, req.user?.id || null, 'created report chapter', 'Report', title);

    const newSec = db.prepare(`
      SELECT s.*, tm.name as last_edited_by_name
      FROM report_sections s
      LEFT JOIN team_members tm ON s.last_edited_by_id = tm.id
      WHERE s.id = ?
    `).get(id);

    res.status(201).json(newSec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/report/sections/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, status, order_index, user_name } = req.body;

    const updated_at = new Date().toISOString();
    const editorName = user_name || req.user?.name || 'Team Member';

    db.prepare(`
      UPDATE report_sections
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          status = COALESCE(?, status),
          order_index = COALESCE(?, order_index),
          last_edited_by_id = ?,
          last_edited_by_name = ?,
          updated_at = ?
      WHERE id = ?
    `).run(title, content, status, order_index, req.user?.id || null, editorName, updated_at, id);

    logActivity(editorName, req.user?.id || null, 'edited report chapter', 'Report', title || id);

    const updated = db.prepare(`
      SELECT s.*, tm.name as last_edited_by_name
      FROM report_sections s
      LEFT JOIN team_members tm ON s.last_edited_by_id = tm.id
      WHERE s.id = ?
    `).get(id);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Delete Report Section
app.delete('/api/report/sections/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sec = db.prepare('SELECT title FROM report_sections WHERE id = ?').get(id) as any;
    db.prepare('UPDATE report_sections SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved report chapter to trash', 'Report', sec?.title || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Report Links
app.get('/api/report/links/:sectionId', (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const links = db.prepare('SELECT * FROM report_links WHERE report_section_id = ? ORDER BY created_at ASC').all(sectionId);
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/report/links', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { report_section_id, entity_type, entity_id, entity_title } = req.body;
    if (!report_section_id || !entity_id) {
      return res.status(400).json({ error: 'Section and entity ID are required' });
    }

    const id = 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO report_links (id, report_section_id, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, report_section_id, entity_type, entity_id, entity_title || '', created_at);

    const newLink = db.prepare('SELECT * FROM report_links WHERE id = ?').get(id);
    res.status(201).json(newLink);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/report/links/:id', requireAuth, (_req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM report_links WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Native Word (.DOCX) Report Export
app.get('/api/report/export-docx', async (_req: Request, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_foc_main') as any;
    const motor = db.prepare('SELECT * FROM motor_parameters WHERE id = ?').get('motor_main') as any;
    const sections = db.prepare(`
      SELECT * FROM report_sections WHERE deleted_at IS NULL ORDER BY order_index ASC, created_at ASC
    `).all() as any[];

    const docChildren: Paragraph[] = [];

    // Title & Header
    docChildren.push(
      new Paragraph({
        text: project?.name || 'FOC Drive Project Report',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: project?.description || 'Technical Documentation and Progress Report',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Date: ${new Date().toLocaleDateString()} | Status: ${project?.status || 'Planning'}`, italics: true }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
      })
    );

    // Motor Parameters Summary Section
    if (motor) {
      docChildren.push(
        new Paragraph({
          text: 'Design & Motor Specifications',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Motor Model: `, bold: true }),
            new TextRun(`${motor.motor_model || 'BLDC'}`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Rated Voltage: `, bold: true }),
            new TextRun(`${motor.rated_voltage_v} V | `),
            new TextRun({ text: `Rated Current: `, bold: true }),
            new TextRun(`${motor.rated_current_a} A | `),
            new TextRun({ text: `Kv: `, bold: true }),
            new TextRun(`${motor.kv_rating} RPM/V`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Phase Resistance: `, bold: true }),
            new TextRun(`${motor.phase_resistance_ohm} Ω | `),
            new TextRun({ text: `Phase Inductance: `, bold: true }),
            new TextRun(`${motor.phase_inductance_uh} µH`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Gearbox: `, bold: true }),
            new TextRun(`${motor.gearbox_type} (Ratio: ${motor.gear_ratio}:1)`),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Chapters
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      docChildren.push(
        new Paragraph({
          text: `${i + 1}. ${sec.title}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 350, after: 150 },
        })
      );

      const contentLines = (sec.content || '').split(/\r?\n/);
      for (const line of contentLines) {
        if (!line.trim()) {
          docChildren.push(new Paragraph({ text: '', spacing: { after: 100 } }));
          continue;
        }

        if (line.startsWith('### ')) {
          docChildren.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 100 } }));
        } else if (line.startsWith('## ')) {
          docChildren.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        } else if (line.startsWith('# ')) {
          docChildren.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 250, after: 100 } }));
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          docChildren.push(new Paragraph({ text: '• ' + line.substring(2), bullet: { level: 0 } }));
        } else {
          docChildren.push(new Paragraph({ text: line, spacing: { after: 120 } }));
        }
      }
    }

    const docxDoc = new Document({
      sections: [{ properties: {}, children: docChildren }],
    });

    const buffer = await Packer.toBuffer(docxDoc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=FOC_Drive_Project_Report_${new Date().toISOString().split('T')[0]}.docx`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 13.5. Team Meetings
// -------------------------------------------------------------
app.get('/api/meetings', (_req: Request, res: Response) => {
  try {
    const meetings = db.prepare(`
      SELECT m.*, tm.name as created_by_name
      FROM meetings m
      LEFT JOIN team_members tm ON m.created_by_id = tm.id
      WHERE m.deleted_at IS NULL
      ORDER BY m.date ASC, m.start_time ASC
    `).all();
    res.json(meetings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/meetings/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = db.prepare(`
      SELECT m.*, tm.name as created_by_name
      FROM meetings m
      LEFT JOIN team_members tm ON m.created_by_id = tm.id
      WHERE m.id = ? AND m.deleted_at IS NULL
    `).get(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetings', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, date, start_time, end_time, meeting_link, location, description, notes, reminder, user_name } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Meeting title is required' });
    }
    if (!date || !date.trim()) {
      return res.status(400).json({ error: 'Meeting date is required' });
    }
    if (!start_time || !start_time.trim()) {
      return res.status(400).json({ error: 'Meeting start time is required' });
    }

    // Validate URL if provided
    let cleanLink = (meeting_link || '').trim();
    if (cleanLink) {
      if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
        cleanLink = 'https://' + cleanLink;
      }
      try {
        new URL(cleanLink);
      } catch {
        return res.status(400).json({ error: 'Please enter a valid meeting URL' });
      }
    }

    const id = 'mtg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO meetings (
        id, title, date, start_time, end_time, meeting_link, location, description, notes, reminder, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      date.trim(),
      start_time.trim(),
      end_time ? end_time.trim() : '',
      cleanLink || '',
      location ? location.trim() : '',
      description ? description.trim() : '',
      notes ? notes.trim() : '',
      reminder || 'none',
      req.user?.id || null,
      now,
      now
    );

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'scheduled team meeting', 'Meeting', title.trim());

    const newMeeting = db.prepare(`
      SELECT m.*, tm.name as created_by_name
      FROM meetings m
      LEFT JOIN team_members tm ON m.created_by_id = tm.id
      WHERE m.id = ?
    `).get(id);

    res.status(201).json(newMeeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetings/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, start_time, end_time, meeting_link, location, description, notes, reminder, user_name } = req.body;

    const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Validate URL if provided
    let cleanLink = meeting_link !== undefined ? (meeting_link || '').trim() : existing.meeting_link;
    if (cleanLink) {
      if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
        cleanLink = 'https://' + cleanLink;
      }
      try {
        new URL(cleanLink);
      } catch {
        return res.status(400).json({ error: 'Please enter a valid meeting URL' });
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE meetings
      SET title = COALESCE(?, title),
          date = COALESCE(?, date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          meeting_link = ?,
          location = COALESCE(?, location),
          description = COALESCE(?, description),
          notes = COALESCE(?, notes),
          reminder = COALESCE(?, reminder),
          updated_at = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      date ? date.trim() : null,
      start_time ? start_time.trim() : null,
      end_time !== undefined ? (end_time || '').trim() : null,
      cleanLink || '',
      location !== undefined ? (location || '').trim() : null,
      description !== undefined ? (description || '').trim() : null,
      notes !== undefined ? (notes || '').trim() : null,
      reminder !== undefined ? reminder : null,
      now,
      id
    );

    logActivity(user_name || req.user?.name || 'User', req.user?.id || null, 'updated team meeting details', 'Meeting', title || existing.title);

    const updated = db.prepare(`
      SELECT m.*, tm.name as created_by_name
      FROM meetings m
      LEFT JOIN team_members tm ON m.created_by_id = tm.id
      WHERE m.id = ?
    `).get(id);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = db.prepare('SELECT title FROM meetings WHERE id = ?').get(id) as any;
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    db.prepare('UPDATE meetings SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    logActivity(req.user?.name || 'User', req.user?.id || null, 'moved meeting to trash', 'Meeting', meeting.title || id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 14. Trash & Soft-Delete Recovery System
// -------------------------------------------------------------
app.get('/api/trash', requireAuth, (_req: AuthRequest, res: Response) => {
  try {
    const papers = db.prepare('SELECT id, title, deleted_at, "research_paper" as entity_type FROM research_papers WHERE deleted_at IS NOT NULL').all();
    const notes = db.prepare('SELECT id, title, deleted_at, "engineering_note" as entity_type FROM engineering_notes WHERE deleted_at IS NOT NULL').all();
    const resources = db.prepare('SELECT id, title, deleted_at, "learning_resource" as entity_type FROM learning_resources WHERE deleted_at IS NOT NULL').all();
    const tests = db.prepare('SELECT id, test_name as title, deleted_at, "test" as entity_type FROM tests WHERE deleted_at IS NOT NULL').all();
    const docs = db.prepare('SELECT id, file_name as title, deleted_at, "document" as entity_type FROM documents WHERE deleted_at IS NOT NULL').all();
    const tasks = db.prepare('SELECT id, title, deleted_at, "task" as entity_type FROM tasks WHERE deleted_at IS NOT NULL').all();
    const milestones = db.prepare('SELECT id, title, deleted_at, "milestone" as entity_type FROM milestones WHERE deleted_at IS NOT NULL').all();
    const issues = db.prepare('SELECT id, title, deleted_at, "issue" as entity_type FROM issues WHERE deleted_at IS NOT NULL').all();
    const simulations = db.prepare('SELECT id, name as title, deleted_at, "simulation_model" as entity_type FROM simulation_models WHERE deleted_at IS NOT NULL').all();
    const sections = db.prepare('SELECT id, title, deleted_at, "report_section" as entity_type FROM report_sections WHERE deleted_at IS NOT NULL').all();
    const meetings = db.prepare('SELECT id, title, deleted_at, "meeting" as entity_type FROM meetings WHERE deleted_at IS NOT NULL').all();

    const allTrash = [
      ...papers,
      ...notes,
      ...resources,
      ...tests,
      ...docs,
      ...tasks,
      ...milestones,
      ...issues,
      ...simulations,
      ...sections,
      ...meetings,
    ].sort((a: any, b: any) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

    res.json(allTrash);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore item from Trash
app.post('/api/trash/restore', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { entity_type, id } = req.body;
    if (!entity_type || !id) {
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    const tableMap: Record<string, string> = {
      research_paper: 'research_papers',
      engineering_note: 'engineering_notes',
      learning_resource: 'learning_resources',
      test: 'tests',
      document: 'documents',
      task: 'tasks',
      milestone: 'milestones',
      issue: 'issues',
      simulation_model: 'simulation_models',
      report_section: 'report_sections',
      meeting: 'meetings',
    };

    const tableName = tableMap[entity_type];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity type for restoration.' });
    }

    db.prepare(`UPDATE ${tableName} SET deleted_at = NULL WHERE id = ?`).run(id);
    logActivity(req.user?.name || 'User', req.user?.id || null, `restored ${entity_type.replace('_', ' ')} from trash`, 'Trash Recovery', id);

    res.json({ success: true, message: `Successfully restored ${entity_type}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently Purge item from Trash (Admin only)
app.delete('/api/trash/permanent', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { entity_type, id } = req.body;
    if (!entity_type || !id) {
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    const tableMap: Record<string, string> = {
      research_paper: 'research_papers',
      engineering_note: 'engineering_notes',
      learning_resource: 'learning_resources',
      test: 'tests',
      document: 'documents',
      task: 'tasks',
      milestone: 'milestones',
      issue: 'issues',
      simulation_model: 'simulation_models',
      report_section: 'report_sections',
      meeting: 'meetings',
    };

    const tableName = tableMap[entity_type];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity type.' });
    }

    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    logActivity(req.user?.name || 'Admin', req.user?.id || null, `permanently purged ${entity_type} from system`, 'Trash', id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });

  }
});

// -------------------------------------------------------------
// 15. Admin-Only Backup & Data Management Hub
// -------------------------------------------------------------
app.get('/api/admin/backups', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/backup-status', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const status = getBackupStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/backups/create', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const backup = await createDatabaseBackup('manual', reason || `Manual on-demand snapshot by ${req.user?.name}`);
    res.status(201).json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/backups/download/:filename', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const sanitized = path.basename(req.params.filename);
    const filePath = path.join(BACKUPS_DIR, sanitized);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup snapshot file not found' });
    }
    res.download(filePath, sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/backups/restore/:filename', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    await restoreDatabaseFromSnapshot(filename);
    logActivity(req.user?.name || 'Admin', req.user?.id || null, `restored database from snapshot ${filename}`, 'Admin Restore', filename);
    res.json({ success: true, message: 'Database successfully restored from backup snapshot.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/backups/:filename', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const sanitized = path.basename(req.params.filename);
    const filePath = path.join(BACKUPS_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM backup_records WHERE filename = ?').run(sanitized);
    logActivity(req.user?.name || 'Admin', req.user?.id || null, `deleted backup snapshot ${sanitized}`, 'Backup', sanitized);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full Unified Project JSON Dump
app.get('/api/admin/export-full-json', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const dump = getFullProjectJsonDump();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=FOC_Drive_Complete_Data_Dump_${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete ZIP Archive: Database + Uploads + JSON
app.get('/api/admin/export-complete-zip', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=FOC_Drive_Complete_Project_Archive_${new Date().toISOString().split('T')[0]}.zip`);
    await createProjectZipArchive(res);
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// -------------------------------------------------------------
// 15B. External Disaster Recovery & Complete Archive Restoration
// -------------------------------------------------------------
app.get('/api/admin/external-backup/status', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const status = getExternalBackupStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/external-backup/trigger', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminName = req.user?.name || 'Administrator';
    const record = await createExternalProjectBackup(adminName);
    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/external-backup/test-destination', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await testExternalDestination();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/external-backup/history', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const records = listExternalBackups();
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/external-backup/download/:filename', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const sanitized = path.basename(req.params.filename);
    const filePath = path.join(EXTERNAL_BACKUP_DIR, sanitized);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'External disaster recovery archive not found' });
    }
    res.download(filePath, sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore Complete Project Archive (Restores BOTH SQLite Database AND all Uploaded Files)
app.post('/api/admin/restore-archive', requireAdmin, archiveUpload.single('archive'), async (req: AuthRequest, res: Response) => {
  try {
    const adminName = req.user?.name || 'Administrator';

    let fileBuffer: Buffer | null = null;
    if (req.file) {
      fileBuffer = req.file.buffer;
    } else if (req.body.filename) {
      // Restore directly from an existing external archive file on server
      const sanitized = path.basename(req.body.filename);
      const targetPath = path.join(EXTERNAL_BACKUP_DIR, sanitized);
      if (fs.existsSync(targetPath)) {
        fileBuffer = fs.readFileSync(targetPath);
      } else {
        return res.status(404).json({ error: `Archive file ${sanitized} not found on server` });
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Please upload a .zip archive or specify an existing backup filename.' });
    }

    const result = await restoreCompleteProjectArchive(fileBuffer, adminName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin User Management
app.get('/api/admin/users', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members').all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, bio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT * FROM team_members WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || 'project123', salt);

    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO team_members (id, name, email, password_hash, role, bio, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, name.trim(), cleanEmail, password_hash, role || 'member', bio || '', created_at);

    logActivity(req.user?.name || 'Admin', req.user?.id || null, `created user account (${role || 'member'})`, 'Admin', name);

    const newUser = db.prepare('SELECT id, name, email, role, avatar, bio, is_active, created_at FROM team_members WHERE id = ?').get(id);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/role', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }
    if (req.user?.id === id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote your own administrator account' });
    }

    db.prepare('UPDATE team_members SET role = ? WHERE id = ?').run(role, id);
    const user = db.prepare('SELECT id, name, email, role FROM team_members WHERE id = ?').get(id) as any;
    logActivity(req.user?.name || 'Admin', req.user?.id || null, `changed role to ${role}`, 'Admin', user?.name || id);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (req.user?.id === id && !is_active) {
      return res.status(400).json({ error: 'Cannot disable your own active account' });
    }

    db.prepare('UPDATE team_members SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    const user = db.prepare('SELECT id, name, email, is_active FROM team_members WHERE id = ?').get(id) as any;
    logActivity(req.user?.name || 'Admin', req.user?.id || null, is_active ? 'enabled account' : 'disabled account', 'Admin', user?.name || id);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/password', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    db.prepare('UPDATE team_members SET password_hash = ? WHERE id = ?').run(password_hash, id);
    const user = db.prepare('SELECT id, name, email FROM team_members WHERE id = ?').get(id) as any;
    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'reset password for user', 'Admin', user?.name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own active administrator account' });
    }
    const user = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'deleted user account', 'Admin', user?.name || id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Storage Files
app.get('/api/admin/storage', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return res.json({ files: [], totalFiles: 0, totalSize: '0 MB' });
    }
    const files = fs.readdirSync(UPLOADS_DIR).map((filename) => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, filename));
      return {
        name: filename,
        size: (stats.size / 1024).toFixed(1) + ' KB',
        sizeBytes: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    });
    const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
    res.json({
      files,
      totalFiles: files.length,
      totalSize: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/storage/:filename', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const filePath = path.join(UPLOADS_DIR, path.basename(req.params.filename));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 16. Real Activity Log
// -------------------------------------------------------------
app.get('/api/activities', (_req: Request, res: Response) => {
  try {
    const activities = db.prepare(`
      SELECT * FROM activities ORDER BY timestamp DESC LIMIT 100
    `).all();
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// -------------------------------------------------------------
// 17. Automated 24/7 Cloud Sync & Disaster Recovery Endpoints
// -------------------------------------------------------------
app.get('/api/cloud-sync/status', (_req: Request, res: Response) => {
  try {
    const status = getCloudSyncStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloud-sync/push', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const record = await pushToCloudVault(req.user?.name || 'Administrator', 'manual_push');
    res.json({ success: true, record, status: getCloudSyncStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloud-sync/pull', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const restored = await performColdBootAutoHydration();
    res.json({
      success: restored,
      message: restored ? 'Successfully restored state from Cloud Vault!' : 'Database is already up to date with Cloud Vault.',
      status: getCloudSyncStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloud-sync/config', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { github_token, cloud_vault_endpoint, cloud_vault_gist_id } = req.body;
    if (github_token !== undefined) setVaultConfig('GITHUB_TOKEN', github_token.trim());
    if (cloud_vault_endpoint !== undefined) setVaultConfig('CLOUD_VAULT_ENDPOINT', cloud_vault_endpoint.trim());
    if (cloud_vault_gist_id !== undefined) setVaultConfig('CLOUD_VAULT_GIST_ID', cloud_vault_gist_id.trim());

    logActivity(req.user?.name || 'Admin', req.user?.id || null, 'updated Cloud Sync Vault configuration', 'Cloud Sync', 'Config Update');
    res.json({ success: true, status: getCloudSyncStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 18. Serve Production Frontend SPA
// -------------------------------------------------------------
const distCandidates = [
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '..'),
  path.resolve(process.cwd(), 'dist'),
  '/app/dist',
];
const DIST_DIR = distCandidates.find((d) => fs.existsSync(path.join(d, 'index.html'))) || path.resolve(__dirname, '../dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  setTimeout(() => {
    try { initCloudSync(); } catch (e) { console.error('Cloud Sync init error:', e); }
    try { initAutomatedBackups(); } catch (e) { console.error('Automated backups init error:', e); }
    try { initExternalBackupsScheduler(); } catch (e) { console.error('External backups init error:', e); }
  }, 2000);
});
