// Typed API Client with Bearer Token Auth and Full Knowledge & Report Endpoints

export interface ProjectStats {
  overallProgress: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  openIssues: number;
  completedTests: number;
  totalTests: number;
  totalTeamMembers?: number;
  totalDocuments?: number;
  totalResearchPapers?: number;
  totalLearningResources?: number;
  totalEngineeringNotes?: number;
  totalReportSections?: number;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold';
  start_date?: string;
  target_date?: string;
  created_at: string;
}

export interface MotorParameters {
  id: string;
  project_id?: string;
  motor_model: string;
  rated_voltage_v?: number;
  rated_current_a?: number;
  peak_current_a?: number;
  pole_pairs?: number;
  kv_rating?: number;
  phase_resistance_ohm?: number;
  phase_inductance_uh?: number;
  max_rpm?: number;
  rated_speed_rpm?: number;
  continuous_torque_nm?: number;
  peak_torque_nm?: number;
  gear_ratio?: number;
  gearbox_type?: string;
  gearbox_efficiency?: number;
  inverter_topology?: string;
  pwm_frequency_khz?: number;
  current_sensing_type?: string;
  encoder_type?: string;
  encoder_cpr?: number;
  thermal_limit_c?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  bio?: string;
  is_active?: number;
  active_tasks_count?: number;
  total_tasks_count?: number;
  created_at: string;
}

export interface MilestoneItem {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  assigned_member_id?: string;
  assigned_member_name?: string;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  total_tasks?: number;
  completed_tasks?: number;
  progressPercentage?: number;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  member_id: string;
  member_name?: string;
  member_email?: string;
  member_role?: string;
  member_avatar?: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingAssignment {
  id: string;
  item_type: 'research_paper' | 'learning_resource' | 'document';
  item_id: string;
  member_id: string;
  member_name?: string;
  member_email?: string;
  member_role?: string;
  member_avatar?: string;
  status: 'Unread' | 'Reading' | 'Completed';
  instructions?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  milestone_id?: string;
  milestone_title?: string;
  title: string;
  description?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  assigned_member_ids?: string[];
  is_all_members?: boolean;
  assignments?: TaskAssignment[];
  total_assignments_count?: number;
  completed_assignments_count?: number;
  progress_summary?: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  start_date?: string;
  due_date?: string;
  created_by_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface TestItem {
  id: string;
  test_name: string;
  test_type: string;
  date: string;
  performed_by_id?: string;
  performed_by_name?: string;
  status: 'Passed' | 'Failed' | 'In Progress' | 'Inconclusive';
  observations?: string;
  result?: string;
  hardware_setup?: string;
  supply_voltage_v?: number;
  supply_current_a?: number;
  pwm_freq_khz?: number;
  measurement_count?: number;
  created_at: string;
}

export interface TestMeasurement {
  id: string;
  test_id: string;
  time_ms: number;
  speed_rpm?: number;
  current_a?: number;
  torque_nm?: number;
  temp_c?: number;
  voltage_v?: number;
}

export interface IssueItem {
  id: string;
  title: string;
  description?: string;
  reported_by_id?: string;
  reported_by_name?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Investigating' | 'Blocked' | 'Fixed' | 'Closed';
  subsystem: string;
  possible_cause?: string;
  solution?: string;
  created_at: string;
  resolved_at?: string;
}

export interface DocumentItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: string;
  uploaded_by_id?: string;
  uploaded_by_name?: string;
  type: string;
  description?: string;
  is_all_members?: boolean;
  assigned_member_ids?: string[];
  due_date?: string;
  instructions?: string;
  assignments?: ReadingAssignment[];
  total_assignments_count?: number;
  completed_assignments_count?: number;
  progress_summary?: string;
  created_at: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors?: string;
  year?: number | null;
  journal_conference?: string;
  doi?: string;
  url?: string;
  pdf_url?: string;
  pdf_name?: string;
  topic?: string;
  tags?: string;
  summary?: string;
  notes?: string;
  reading_status: 'Unread' | 'Reading' | 'Completed';
  is_all_members?: boolean;
  assigned_member_ids?: string[];
  due_date?: string;
  instructions?: string;
  assignments?: ReadingAssignment[];
  total_assignments_count?: number;
  completed_assignments_count?: number;
  progress_summary?: string;
  added_by_id?: string;
  added_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  resource_type: 'Video' | 'Lecture Notes' | 'Course' | 'Article' | 'Book' | 'Tutorial' | 'Other';
  topic?: string;
  description?: string;
  tags?: string;
  notes?: string;
  is_all_members?: boolean;
  assigned_member_ids?: string[];
  due_date?: string;
  instructions?: string;
  assignments?: ReadingAssignment[];
  total_assignments_count?: number;
  completed_assignments_count?: number;
  progress_summary?: string;
  added_by_id?: string;
  added_by_name?: string;
  created_at: string;
}

export interface EngineeringNote {
  id: string;
  title: string;
  content: string;
  tags?: string;
  author_id?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSection {
  id: string;
  title: string;
  order_index: number;
  content: string;
  status: 'Draft' | 'In Review' | 'Completed';
  last_edited_by_id?: string;
  last_edited_by_name?: string;
  link_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ReportLink {
  id: string;
  report_section_id: string;
  entity_type: 'research_paper' | 'engineering_note' | 'learning_resource' | 'test' | 'document' | 'task' | 'milestone' | 'issue' | 'simulation_model' | 'simulation' | 'report_section';
  entity_id: string;
  entity_title: string;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_title: string;
  timestamp: string;
}

export interface AuthStatus {
  hasAdmin: boolean;
  userCount: number;
}

export interface StorageFile {
  name: string;
  size: string;
  sizeBytes: number;
  createdAt: string;
}

export interface StorageInfo {
  files: StorageFile[];
  totalFiles: number;
  totalSize: string;
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

export interface ExternalBackupStatus {
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

export interface TrashItem {
  id: string;
  title: string;
  deleted_at: string;
  entity_type: 'research_paper' | 'engineering_note' | 'learning_resource' | 'test' | 'document' | 'task' | 'milestone' | 'issue' | 'simulation_model' | 'report_section';
}

export interface GitHubRepoData {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string;
  pushedAt: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
}

export interface GitHubCommitData {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorDate: string;
  authorAvatar?: string;
  htmlUrl: string;
}

export interface GitHubBranchData {
  name: string;
  commitSha: string;
  isProtected?: boolean;
}

export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  fileExtension?: string;
  url: string;
}

export interface SimulationExperimentLink {
  link_id: string;
  test_id: string;
  test_name: string;
  test_type: string;
  test_status: string;
  test_date: string;
}

export interface SimulationModel {
  id: string;
  name: string;
  description?: string;
  purpose?: string;
  github_path?: string;
  status: 'Planning' | 'In Development' | 'Validated' | 'Deprecated';
  milestone_id?: string;
  milestone_title?: string;
  objective?: string;
  parameters?: string;
  inputs?: string;
  expected_output?: string;
  results?: string;
  conclusion?: string;
  notes?: string;
  created_by_id?: string;
  created_by_name?: string;
  linked_experiment_count?: number;
  linked_experiments?: SimulationExperimentLink[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  meeting_link?: string;
  location?: string;
  description?: string;
  notes?: string;
  reminder?: 'none' | '10_mins' | '30_mins' | '1_hour' | '1_day';
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

const BASE_URL = '/api';
const TOKEN_KEY = 'foc_drive_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network error or server unavailable' }));
    throw new Error(errorData.error || `HTTP ${res.status} Error`);
  }

  return res.json();
}

export const api = {
  // Auth
  getAuthStatus: () => fetchJSON<AuthStatus>(`${BASE_URL}/auth/status`),
  login: (credentials: { email: string; password?: string }) =>
    fetchJSON<{ user: TeamMember; token: string }>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: { name: string; email: string; password?: string; role?: 'admin' | 'member'; bio?: string }) =>
    fetchJSON<{ user: TeamMember; token: string }>(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => fetchJSON<TeamMember>(`${BASE_URL}/auth/me`),

  // Project & Motor Parameters
  getProject: () => fetchJSON<ProjectInfo>(`${BASE_URL}/project`),
  updateProject: (data: Partial<ProjectInfo> & { user_name?: string }) =>
    fetchJSON<ProjectInfo>(`${BASE_URL}/project`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getMotorParameters: () => fetchJSON<MotorParameters>(`${BASE_URL}/motor-parameters`),
  updateMotorParameters: (data: Partial<MotorParameters>) =>
    fetchJSON<MotorParameters>(`${BASE_URL}/motor-parameters`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStats: () => fetchJSON<ProjectStats>(`${BASE_URL}/stats`),

  // Team
  getTeam: () => fetchJSON<TeamMember[]>(`${BASE_URL}/team`),
  addTeamMember: (data: Partial<TeamMember> & { user_name?: string; password?: string }) =>
    fetchJSON<TeamMember>(`${BASE_URL}/team`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeamMember: (id: string, data: Partial<TeamMember> & { user_name?: string }) =>
    fetchJSON<TeamMember>(`${BASE_URL}/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTeamMember: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/team/${id}`, {
      method: 'DELETE',
    }),

  // Milestones
  getMilestones: () => fetchJSON<MilestoneItem[]>(`${BASE_URL}/milestones`),
  addMilestone: (data: Partial<MilestoneItem> & { user_name?: string }) =>
    fetchJSON<MilestoneItem>(`${BASE_URL}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMilestone: (id: string, data: Partial<MilestoneItem> & { user_name?: string }) =>
    fetchJSON<MilestoneItem>(`${BASE_URL}/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMilestone: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/milestones/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: () => fetchJSON<TaskItem[]>(`${BASE_URL}/tasks`),
  addTask: (data: Partial<TaskItem> & { user_name?: string }) =>
    fetchJSON<TaskItem>(`${BASE_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<TaskItem> & { user_name?: string }) =>
    fetchJSON<TaskItem>(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateMyTaskStatus: (taskId: string, status: string, memberId?: string, userName?: string) =>
    fetchJSON<TaskItem>(`${BASE_URL}/tasks/${taskId}/assignment-status`, {
      method: 'PUT',
      body: JSON.stringify({ status, member_id: memberId, user_name: userName }),
    }),
  deleteTask: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Tests & Experiments
  getTests: () => fetchJSON<TestItem[]>(`${BASE_URL}/tests`),
  getTestMeasurements: (id: string) => fetchJSON<TestMeasurement[]>(`${BASE_URL}/tests/${id}/measurements`),
  addTest: (data: Partial<TestItem> & { user_name?: string }) =>
    fetchJSON<TestItem>(`${BASE_URL}/tests`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadTestCsv: async (formData: FormData) => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/tests/upload-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  deleteTest: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/tests/${id}`, {
      method: 'DELETE',
    }),

  // GitHub Integration
  getGitHubRepo: () => fetchJSON<GitHubRepoData>(`${BASE_URL}/github/repo`),
  getGitHubCommits: () => fetchJSON<GitHubCommitData[]>(`${BASE_URL}/github/commits`),
  getGitHubBranches: () => fetchJSON<GitHubBranchData[]>(`${BASE_URL}/github/branches`),
  getGitHubTree: (branch: string = 'main') =>
    fetchJSON<GitHubTreeItem[]>(`${BASE_URL}/github/tree?branch=${encodeURIComponent(branch)}`),

  // Simulink & Simulation Models
  getSimulations: () => fetchJSON<SimulationModel[]>(`${BASE_URL}/simulations`),
  getSimulation: (id: string) => fetchJSON<SimulationModel>(`${BASE_URL}/simulations/${id}`),
  addSimulation: (data: Partial<SimulationModel> & { linked_test_ids?: string[]; user_name?: string }) =>
    fetchJSON<SimulationModel>(`${BASE_URL}/simulations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSimulation: (id: string, data: Partial<SimulationModel> & { linked_test_ids?: string[]; user_name?: string }) =>
    fetchJSON<SimulationModel>(`${BASE_URL}/simulations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSimulation: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/simulations/${id}`, {
      method: 'DELETE',
    }),
  linkSimulationExperiment: (simulation_id: string, test_id: string) =>
    fetchJSON<{ success: boolean; link_id: string }>(`${BASE_URL}/simulations/link-experiment`, {
      method: 'POST',
      body: JSON.stringify({ simulation_id, test_id }),
    }),
  unlinkSimulationExperiment: (link_id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/simulations/link-experiment/${link_id}`, {
      method: 'DELETE',
    }),

  // Issues
  getIssues: () => fetchJSON<IssueItem[]>(`${BASE_URL}/issues`),
  addIssue: (data: Partial<IssueItem> & { user_name?: string }) =>
    fetchJSON<IssueItem>(`${BASE_URL}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIssue: (id: string, data: Partial<IssueItem> & { user_name?: string }) =>
    fetchJSON<IssueItem>(`${BASE_URL}/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteIssue: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/issues/${id}`, {
      method: 'DELETE',
    }),

  // Documents & Attachments
  getDocuments: () => fetchJSON<DocumentItem[]>(`${BASE_URL}/documents`),
  uploadDocument: async (formData: FormData) => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  deleteDocument: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    }),

  // Research Papers
  getResearchPapers: () => fetchJSON<ResearchPaper[]>(`${BASE_URL}/research-papers`),
  addResearchPaper: (data: Partial<ResearchPaper> & { user_name?: string }) =>
    fetchJSON<ResearchPaper>(`${BASE_URL}/research-papers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadResearchPaperPdf: async (formData: FormData) => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/research-papers/upload-pdf`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'PDF upload failed' }));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<ResearchPaper | { pdf_url: string; pdf_name: string }>;
  },
  updateResearchPaper: (id: string, data: Partial<ResearchPaper> & { user_name?: string }) =>
    fetchJSON<ResearchPaper>(`${BASE_URL}/research-papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteResearchPaper: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/research-papers/${id}`, {
      method: 'DELETE',
    }),

  // Learning Resources
  getLearningResources: () => fetchJSON<LearningResource[]>(`${BASE_URL}/learning-resources`),
  addLearningResource: (data: Partial<LearningResource> & { user_name?: string }) =>
    fetchJSON<LearningResource>(`${BASE_URL}/learning-resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLearningResource: (id: string, data: Partial<LearningResource> & { user_name?: string }) =>
    fetchJSON<LearningResource>(`${BASE_URL}/learning-resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLearningResource: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/learning-resources/${id}`, {
      method: 'DELETE',
    }),

  // Reading Material Status
  updateMyReadingStatus: (itemType: 'research_paper' | 'learning_resource' | 'document', itemId: string, status: string, memberId?: string, userName?: string) =>
    fetchJSON<{ success: boolean; status: string; completed_at?: string }>(`${BASE_URL}/reading-assignments/${itemType}/${itemId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, member_id: memberId, user_name: userName }),
    }),

  // Engineering Notes
  getEngineeringNotes: () => fetchJSON<EngineeringNote[]>(`${BASE_URL}/engineering-notes`),
  addEngineeringNote: (data: Partial<EngineeringNote> & { user_name?: string }) =>
    fetchJSON<EngineeringNote>(`${BASE_URL}/engineering-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEngineeringNote: (id: string, data: Partial<EngineeringNote> & { user_name?: string }) =>
    fetchJSON<EngineeringNote>(`${BASE_URL}/engineering-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEngineeringNote: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/engineering-notes/${id}`, {
      method: 'DELETE',
    }),

  // Report Sections & Links
  getReportSections: () => fetchJSON<ReportSection[]>(`${BASE_URL}/report/sections`),
  addReportSection: (data: Partial<ReportSection> & { user_name?: string }) =>
    fetchJSON<ReportSection>(`${BASE_URL}/report/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReportSection: (id: string, data: Partial<ReportSection> & { user_name?: string }) =>
    fetchJSON<ReportSection>(`${BASE_URL}/report/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteReportSection: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/report/sections/${id}`, {
      method: 'DELETE',
    }),
  getReportLinks: (sectionId: string) => fetchJSON<ReportLink[]>(`${BASE_URL}/report/links/${sectionId}`),
  addReportLink: (data: { report_section_id: string; entity_type: string; entity_id: string; entity_title: string }) =>
    fetchJSON<ReportLink>(`${BASE_URL}/report/links`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteReportLink: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/report/links/${id}`, {
      method: 'DELETE',
    }),

  // Team Meetings
  getMeetings: () => fetchJSON<MeetingItem[]>(`${BASE_URL}/meetings`),
  getMeeting: (id: string) => fetchJSON<MeetingItem>(`${BASE_URL}/meetings/${id}`),
  addMeeting: (data: Partial<MeetingItem> & { user_name?: string }) =>
    fetchJSON<MeetingItem>(`${BASE_URL}/meetings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMeeting: (id: string, data: Partial<MeetingItem> & { user_name?: string }) =>
    fetchJSON<MeetingItem>(`${BASE_URL}/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMeeting: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/meetings/${id}`, {
      method: 'DELETE',
    }),

  // Trash & Soft-Delete Recovery
  getTrash: () => fetchJSON<TrashItem[]>(`${BASE_URL}/trash`),
  restoreTrashItem: (entity_type: string, id: string) =>
    fetchJSON<{ success: boolean; message: string }>(`${BASE_URL}/trash/restore`, {
      method: 'POST',
      body: JSON.stringify({ entity_type, id }),
    }),
  purgeTrashItem: (entity_type: string, id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/trash/permanent`, {
      method: 'DELETE',
      body: JSON.stringify({ entity_type, id }),
    }),

  // Activities
  getActivities: () => fetchJSON<ActivityItem[]>(`${BASE_URL}/activities`),

  // Admin APIs (requireAdmin)
  getAdminUsers: () => fetchJSON<TeamMember[]>(`${BASE_URL}/admin/users`),
  adminCreateUser: (data: { name: string; email: string; password?: string; role?: 'admin' | 'member'; bio?: string }) =>
    fetchJSON<TeamMember>(`${BASE_URL}/admin/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateUserRole: (id: string, role: 'admin' | 'member') =>
    fetchJSON<TeamMember>(`${BASE_URL}/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  adminUpdateUserStatus: (id: string, is_active: boolean) =>
    fetchJSON<TeamMember>(`${BASE_URL}/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    }),
  adminResetPassword: (id: string, new_password: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/admin/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password }),
    }),
  adminDeleteUser: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
    }),
  adminGetStorage: () => fetchJSON<StorageInfo>(`${BASE_URL}/admin/storage`),
  adminDeleteStorageFile: (filename: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/admin/storage/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    }),

  // Admin Backups & Local Snapshots
  getAdminBackups: () => fetchJSON<BackupMetadata[]>(`${BASE_URL}/admin/backups`),
  getAdminBackupStatus: () => fetchJSON<BackupStatusInfo>(`${BASE_URL}/admin/backup-status`),
  adminCreateBackup: (reason?: string) =>
    fetchJSON<BackupMetadata>(`${BASE_URL}/admin/backups/create`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  adminRestoreBackup: (filename: string) =>
    fetchJSON<{ success: boolean; message: string }>(`${BASE_URL}/admin/backups/restore/${encodeURIComponent(filename)}`, {
      method: 'POST',
    }),
  adminDeleteBackup: (filename: string) =>
    fetchJSON<{ success: boolean }>(`${BASE_URL}/admin/backups/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    }),

  // External Disaster Recovery & Complete Archive Restoration
  getExternalBackupStatus: () => fetchJSON<ExternalBackupStatus>(`${BASE_URL}/admin/external-backup/status`),
  getExternalBackupHistory: () => fetchJSON<ExternalBackupRecord[]>(`${BASE_URL}/admin/external-backup/history`),
  triggerExternalBackup: () =>
    fetchJSON<{ success: boolean; record: ExternalBackupRecord }>(`${BASE_URL}/admin/external-backup/trigger`, {
      method: 'POST',
    }),
  testExternalDestination: () =>
    fetchJSON<{ success: boolean; destinationDisplay: string; message: string }>(`${BASE_URL}/admin/external-backup/test-destination`, {
      method: 'POST',
    }),
  restoreCompleteProjectArchive: async (formDataOrData: FormData | { filename: string }) => {
    const token = getStoredToken();
    if (formDataOrData instanceof FormData) {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/admin/restore-archive`, {
        method: 'POST',
        headers,
        body: formDataOrData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Archive restoration failed' }));
        throw new Error(data.error || 'Archive restoration failed');
      }
      return res.json() as Promise<ArchiveRestoreResult>;
    }
    return fetchJSON<ArchiveRestoreResult>(`${BASE_URL}/admin/restore-archive`, {
      method: 'POST',
      body: JSON.stringify(formDataOrData),
    });
  },
};
