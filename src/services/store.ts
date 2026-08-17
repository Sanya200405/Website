import { useState, useEffect, useCallback } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  type ProjectStats,
  type ProjectInfo,
  type MotorParameters,
  type TeamMember,
  type MilestoneItem,
  type TaskItem,
  type TestItem,
  type IssueItem,
  type DocumentItem,
  type ResearchPaper,
  type LearningResource,
  type EngineeringNote,
  type ReportSection,
  type ActivityItem,
  type AuthStatus,
  type StorageInfo,
  type BackupMetadata,
  type BackupStatusInfo,
  type ExternalBackupRecord,
  type ExternalBackupStatus,
  type TrashItem,
  type SimulationModel,
  type GitHubRepoData,
  type GitHubCommitData,
  type MeetingItem,
} from './api';

const THEME_KEY = 'foc_drive_theme';
const USER_KEY = 'foc_drive_current_user';

export interface AppState {
  theme: 'dark' | 'light';
  currentUser: TeamMember | null;
  authStatus: AuthStatus | null;
  project: ProjectInfo;
  motorParameters: MotorParameters | null;
  stats: ProjectStats;
  team: TeamMember[];
  milestones: MilestoneItem[];
  tasks: TaskItem[];
  tests: TestItem[];
  simulations: SimulationModel[];
  meetings: MeetingItem[];
  gitHubRepo: GitHubRepoData | null;
  gitHubCommits: GitHubCommitData[];
  issues: IssueItem[];
  documents: DocumentItem[];
  researchPapers: ResearchPaper[];
  learningResources: LearningResource[];
  engineeringNotes: EngineeringNote[];
  reportSections: ReportSection[];
  activities: ActivityItem[];
  trashItems: TrashItem[];
  adminUsers: TeamMember[];
  adminStorage: StorageInfo | null;
  adminBackups: BackupMetadata[];
  adminBackupStatus: BackupStatusInfo | null;
  externalBackupStatus: ExternalBackupStatus | null;
  externalBackups: ExternalBackupRecord[];
  isLoading: boolean;
  error: string | null;
}

const defaultStats: ProjectStats = {
  overallProgress: 0,
  totalTasks: 0,
  completedTasks: 0,
  activeTasks: 0,
  pendingTasks: 0,
  blockedTasks: 0,
  totalMilestones: 0,
  completedMilestones: 0,
  openIssues: 0,
  completedTests: 0,
  totalTests: 0,
  totalTeamMembers: 0,
  totalDocuments: 0,
  totalResearchPapers: 0,
  totalLearningResources: 0,
  totalEngineeringNotes: 0,
  totalReportSections: 0,
};

const defaultProject: ProjectInfo = {
  id: 'proj_foc_main',
  name: 'FOC Drive Project',
  description: 'Development of an FOC Drive for BLDC Motor with Planetary Gear Reduction',
  status: 'Planning',
  start_date: new Date().toISOString().split('T')[0],
  target_date: '',
  created_at: new Date().toISOString(),
};

export function useProjectStore() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  });

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [project, setProject] = useState<ProjectInfo>(defaultProject);
  const [motorParameters, setMotorParameters] = useState<MotorParameters | null>(null);
  const [stats, setStats] = useState<ProjectStats>(defaultStats);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [simulations, setSimulations] = useState<SimulationModel[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [gitHubRepo, setGitHubRepo] = useState<GitHubRepoData | null>(null);
  const [gitHubCommits, setGitHubCommits] = useState<GitHubCommitData[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [engineeringNotes, setEngineeringNotes] = useState<EngineeringNote[]>([]);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<TeamMember[]>([]);
  const [adminStorage, setAdminStorage] = useState<StorageInfo | null>(null);
  const [adminBackups, setAdminBackups] = useState<BackupMetadata[]>([]);
  const [adminBackupStatus, setAdminBackupStatus] = useState<BackupStatusInfo | null>(null);
  const [externalBackupStatus, setExternalBackupStatus] = useState<ExternalBackupStatus | null>(null);
  const [externalBackups, setExternalBackups] = useState<ExternalBackupRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify token / get profile if token exists
      const token = getStoredToken();
      if (token) {
        api.getMe()
          .then((user) => {
            setCurrentUser(user);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          })
          .catch(() => {
            setStoredToken(null);
            setCurrentUser(null);
            localStorage.removeItem(USER_KEY);
          });
      }

      const [
        authStatusData,
        statsData,
        projectData,
        motorData,
        teamData,
        milestonesData,
        tasksData,
        testsData,
        simulationsData,
        meetingsData,
        githubRepoData,
        githubCommitsData,
        issuesData,
        docsData,
        papersData,
        resourcesData,
        notesData,
        sectionsData,
        activitiesData,
      ] = await Promise.all([
        api.getAuthStatus().catch(() => ({ hasAdmin: false, userCount: 0 })),
        api.getStats().catch(() => defaultStats),
        api.getProject().catch(() => defaultProject),
        api.getMotorParameters().catch(() => null),
        api.getTeam().catch(() => []),
        api.getMilestones().catch(() => []),
        api.getTasks().catch(() => []),
        api.getTests().catch(() => []),
        api.getSimulations().catch(() => []),
        api.getMeetings().catch(() => []),
        api.getGitHubRepo().catch(() => null),
        api.getGitHubCommits().catch(() => []),
        api.getIssues().catch(() => []),
        api.getDocuments().catch(() => []),
        api.getResearchPapers().catch(() => []),
        api.getLearningResources().catch(() => []),
        api.getEngineeringNotes().catch(() => []),
        api.getReportSections().catch(() => []),
        api.getActivities().catch(() => []),
      ]);

      setAuthStatus(authStatusData);
      setStats(statsData);
      setProject(projectData);
      setMotorParameters(motorData);
      setTeam(teamData);
      setMilestones(milestonesData);
      setTasks(tasksData);
      setTests(testsData);
      setSimulations(simulationsData);
      setMeetings(meetingsData);
      setGitHubRepo(githubRepoData);
      setGitHubCommits(githubCommitsData);
      setIssues(issuesData);
      setDocuments(docsData);
      setResearchPapers(papersData);
      setLearningResources(resourcesData);
      setEngineeringNotes(notesData);
      setReportSections(sectionsData);
      setActivities(activitiesData);


      // Load Trash items if authenticated
      if (token) {
        api.getTrash().then((tData) => setTrashItems(tData)).catch(() => setTrashItems([]));
      }

      // If user is Admin, load admin datasets & backups
      if (currentUser?.role === 'admin') {
        Promise.all([
          api.getAdminUsers().catch(() => []),
          api.adminGetStorage().catch(() => null),
          api.getAdminBackups().catch(() => []),
          api.getAdminBackupStatus().catch(() => null),
          api.getExternalBackupStatus().catch(() => null),
          api.getExternalBackupHistory().catch(() => []),
        ]).then(([uData, sData, bData, bsData, ebStatus, ebHist]) => {
          setAdminUsers(uData);
          setAdminStorage(sData);
          setAdminBackups(bData);
          setAdminBackupStatus(bsData);
          setExternalBackupStatus(ebStatus);
          setExternalBackups(ebHist);
        });
      }
    } catch (err: any) {
      console.error('Failed to load project state', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const login = async (credentials: { email: string; password?: string }) => {
    const result = await api.login(credentials);
    setStoredToken(result.token);
    setCurrentUser(result.user);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    await fetchAllData();
    return result;
  };

  const register = async (data: { name: string; email: string; password?: string; role?: 'admin' | 'member'; bio?: string }) => {
    const result = await api.register(data);
    setStoredToken(result.token);
    setCurrentUser(result.user);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    await fetchAllData();
    return result;
  };

  const logout = () => {
    setStoredToken(null);
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
    setTrashItems([]);
    setAdminUsers([]);
    setAdminStorage(null);
    setAdminBackups([]);
    setAdminBackupStatus(null);
  };

  const currentUserName = currentUser?.name || 'User';

  // --- Motor Parameters ---
  const updateMotorParameters = async (data: Partial<MotorParameters>) => {
    const updated = await api.updateMotorParameters(data);
    setMotorParameters(updated);
    await fetchAllData();
    return updated;
  };

  // --- Tasks ---
  const addTask = async (data: Partial<TaskItem>) => {
    const newTask = await api.addTask({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newTask;
  };

  const updateTask = async (id: string, data: Partial<TaskItem>) => {
    const updated = await api.updateTask(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    await fetchAllData();
  };

  // --- Milestones ---
  const addMilestone = async (data: Partial<MilestoneItem>) => {
    const newMs = await api.addMilestone({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newMs;
  };

  const updateMilestone = async (id: string, data: Partial<MilestoneItem>) => {
    const updated = await api.updateMilestone(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteMilestone = async (id: string) => {
    await api.deleteMilestone(id);
    await fetchAllData();
  };

  // --- Team Members ---
  const addTeamMember = async (data: Partial<TeamMember> & { user_name?: string; password?: string }) => {
    const newMember = await api.addTeamMember(data);
    await fetchAllData();
    return newMember;
  };

  const updateTeamMember = async (id: string, data: Partial<TeamMember> & { user_name?: string }) => {
    const updated = await api.updateTeamMember(id, data);
    await fetchAllData();
    return updated;
  };

  const deleteTeamMember = async (id: string) => {
    await api.deleteTeamMember(id);
    await fetchAllData();
  };

  // --- Tests / Experiments ---
  const addTest = async (data: Partial<TestItem>) => {
    const newTest = await api.addTest({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newTest;
  };

  const uploadTestCsv = async (formData: FormData) => {
    formData.append('user_name', currentUserName);
    const newTest = await api.uploadTestCsv(formData);
    await fetchAllData();
    return newTest;
  };

  const deleteTest = async (id: string) => {
    await api.deleteTest(id);
    await fetchAllData();
  };

  // --- Simulink & Simulation Models ---
  const addSimulation = async (data: Partial<SimulationModel> & { linked_test_ids?: string[] }) => {
    const newSim = await api.addSimulation({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newSim;
  };

  const updateSimulation = async (id: string, data: Partial<SimulationModel> & { linked_test_ids?: string[] }) => {
    const updated = await api.updateSimulation(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteSimulation = async (id: string) => {
    await api.deleteSimulation(id);
    await fetchAllData();
  };

  const linkSimulationExperiment = async (simulation_id: string, test_id: string) => {
    const res = await api.linkSimulationExperiment(simulation_id, test_id);
    await fetchAllData();
    return res;
  };

  const unlinkSimulationExperiment = async (link_id: string) => {
    const res = await api.unlinkSimulationExperiment(link_id);
    await fetchAllData();
    return res;
  };

  // --- Issues ---
  const addIssue = async (data: Partial<IssueItem>) => {
    const newIssue = await api.addIssue({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newIssue;
  };

  const updateIssue = async (id: string, data: Partial<IssueItem>) => {
    const updated = await api.updateIssue(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteIssue = async (id: string) => {
    await api.deleteIssue(id);
    await fetchAllData();
  };

  // --- Documents ---
  const uploadDocument = async (formData: FormData) => {
    formData.append('user_name', currentUserName);
    const doc = await api.uploadDocument(formData);
    await fetchAllData();
    return doc;
  };

  const deleteDocument = async (id: string) => {
    await api.deleteDocument(id);
    await fetchAllData();
  };

  // --- Research Papers ---
  const addResearchPaper = async (data: Partial<ResearchPaper>) => {
    const newPaper = await api.addResearchPaper({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newPaper;
  };

  const uploadResearchPaperPdf = async (formData: FormData) => {
    formData.append('user_name', currentUserName);
    const newPaper = await api.uploadResearchPaperPdf(formData);
    await fetchAllData();
    return newPaper;
  };

  const updateResearchPaper = async (id: string, data: Partial<ResearchPaper>) => {
    const updated = await api.updateResearchPaper(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteResearchPaper = async (id: string) => {
    await api.deleteResearchPaper(id);
    await fetchAllData();
  };

  // --- Learning Resources ---
  const addLearningResource = async (data: Partial<LearningResource>) => {
    const newRes = await api.addLearningResource({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newRes;
  };

  const updateLearningResource = async (id: string, data: Partial<LearningResource>) => {
    const updated = await api.updateLearningResource(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteLearningResource = async (id: string) => {
    await api.deleteLearningResource(id);
    await fetchAllData();
  };

  // --- Engineering Notes ---
  const addEngineeringNote = async (data: Partial<EngineeringNote>) => {
    const newNote = await api.addEngineeringNote({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newNote;
  };

  const updateEngineeringNote = async (id: string, data: Partial<EngineeringNote>) => {
    const updated = await api.updateEngineeringNote(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteEngineeringNote = async (id: string) => {
    await api.deleteEngineeringNote(id);
    await fetchAllData();
  };

  // --- Collaborative Report ---
  const addReportSection = async (data: Partial<ReportSection>) => {
    const newSec = await api.addReportSection({ ...data, user_name: currentUserName, last_edited_by_id: currentUser?.id });
    await fetchAllData();
    return newSec;
  };

  const updateReportSection = async (id: string, data: Partial<ReportSection>) => {
    const updated = await api.updateReportSection(id, { ...data, user_name: currentUserName, last_edited_by_id: currentUser?.id });
    await fetchAllData();
    return updated;
  };

  const deleteReportSection = async (id: string) => {
    await api.deleteReportSection(id);
    await fetchAllData();
  };

  const addReportLink = async (data: { report_section_id: string; entity_type: string; entity_id: string; entity_title: string }) => {
    const link = await api.addReportLink(data);
    await fetchAllData();
    return link;
  };

  const deleteReportLink = async (id: string) => {
    await api.deleteReportLink(id);
    await fetchAllData();
  };

  // --- Team Meetings ---
  const addMeeting = async (data: Partial<MeetingItem>) => {
    const newMeeting = await api.addMeeting({ ...data, user_name: currentUserName });
    await fetchAllData();
    return newMeeting;
  };

  const updateMeeting = async (id: string, data: Partial<MeetingItem>) => {
    const updated = await api.updateMeeting(id, { ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  const deleteMeeting = async (id: string) => {
    await api.deleteMeeting(id);
    await fetchAllData();
  };

  const updateProjectDetails = async (data: Partial<ProjectInfo>) => {
    const updated = await api.updateProject({ ...data, user_name: currentUserName });
    await fetchAllData();
    return updated;
  };

  // --- Trash Recovery Actions ---
  const restoreTrashItem = async (entity_type: string, id: string) => {
    const res = await api.restoreTrashItem(entity_type, id);
    await fetchAllData();
    return res;
  };

  const purgeTrashItem = async (entity_type: string, id: string) => {
    const res = await api.purgeTrashItem(entity_type, id);
    await fetchAllData();
    return res;
  };

  // --- Admin Backups & Resilience Actions ---
  const adminCreateBackup = async (reason?: string) => {
    const res = await api.adminCreateBackup(reason);
    await fetchAllData();
    return res;
  };

  const adminRestoreBackup = async (filename: string) => {
    const res = await api.adminRestoreBackup(filename);
    await fetchAllData();
    return res;
  };

  const adminDeleteBackup = async (filename: string) => {
    const res = await api.adminDeleteBackup(filename);
    await fetchAllData();
    return res;
  };

  // --- External Disaster Recovery Actions ---
  const adminTriggerExternalBackup = async () => {
    const res = await api.triggerExternalBackup();
    await fetchAllData();
    return res;
  };

  const adminTestExternalDestination = async () => {
    return api.testExternalDestination();
  };

  const adminRestoreCompleteArchive = async (formDataOrData: FormData | { filename: string }) => {
    const res = await api.restoreCompleteProjectArchive(formDataOrData);
    await fetchAllData();
    return res;
  };

  // --- Admin User Operations ---
  const adminCreateUser = async (data: { name: string; email: string; password?: string; role?: 'admin' | 'member'; bio?: string }) => {
    const res = await api.adminCreateUser(data);
    await fetchAllData();
    return res;
  };

  const adminUpdateUserRole = async (id: string, role: 'admin' | 'member') => {
    const res = await api.adminUpdateUserRole(id, role);
    await fetchAllData();
    return res;
  };

  const adminUpdateUserStatus = async (id: string, is_active: boolean) => {
    const res = await api.adminUpdateUserStatus(id, is_active);
    await fetchAllData();
    return res;
  };

  const adminResetPassword = async (id: string, password: string) => {
    const res = await api.adminResetPassword(id, password);
    await fetchAllData();
    return res;
  };

  const adminDeleteUser = async (id: string) => {
    const res = await api.adminDeleteUser(id);
    await fetchAllData();
    return res;
  };

  const adminDeleteStorageFile = async (filename: string) => {
    const res = await api.adminDeleteStorageFile(filename);
    await fetchAllData();
    return res;
  };

  return {
    state: {
      theme,
      currentUser,
      authStatus,
      project,
      motorParameters,
      stats,
      team,
      milestones,
      tasks,
      tests,
      simulations,
      meetings,
      gitHubRepo,
      gitHubCommits,
      issues,
      documents,
      researchPapers,
      learningResources,
      engineeringNotes,
      reportSections,
      activities,
      trashItems,
      adminUsers,
      adminStorage,
      adminBackups,
      adminBackupStatus,
      externalBackupStatus,
      externalBackups,
      isLoading,
      error,
    },
    refreshAll: fetchAllData,
    toggleTheme,
    login,
    register,
    logout,
    updateMotorParameters,
    addTask,
    updateTask,
    deleteTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addTest,
    uploadTestCsv,
    deleteTest,
    addSimulation,
    updateSimulation,
    deleteSimulation,
    linkSimulationExperiment,
    unlinkSimulationExperiment,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    addIssue,
    updateIssue,
    deleteIssue,
    uploadDocument,
    deleteDocument,
    addResearchPaper,
    uploadResearchPaperPdf,
    updateResearchPaper,
    deleteResearchPaper,
    addLearningResource,
    updateLearningResource,
    deleteLearningResource,
    addEngineeringNote,
    updateEngineeringNote,
    deleteEngineeringNote,
    addReportSection,
    updateReportSection,
    deleteReportSection,
    addReportLink,
    deleteReportLink,
    updateProjectDetails,
    restoreTrashItem,
    purgeTrashItem,
    adminCreateBackup,
    adminRestoreBackup,
    adminDeleteBackup,
    adminTriggerExternalBackup,
    adminTestExternalDestination,
    adminRestoreCompleteArchive,
    adminCreateUser,
    adminUpdateUserRole,
    adminUpdateUserStatus,
    adminResetPassword,
    adminDeleteUser,
    adminDeleteStorageFile,
  };
}

