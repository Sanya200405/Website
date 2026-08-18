import { useState, useEffect } from 'react';
import { useProjectStore } from './services/store';
import { Sidebar, type NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { TaskModal } from './components/TaskModal';
import { MilestoneModal } from './components/MilestoneModal';
import { TeamModal } from './components/TeamModal';
import { TestModal } from './components/TestModal';
import { SimulationModal } from './components/SimulationModal';
import { IssueModal } from './components/IssueModal';
import { DocModal } from './components/DocModal';
import { ResearchPaperModal } from './components/ResearchPaperModal';
import { LearningResourceModal } from './components/LearningResourceModal';
import { NoteModal } from './components/NoteModal';
import { ReportLinkModal } from './components/ReportLinkModal';
import { ScheduleMeetingModal } from './components/ScheduleMeetingModal';

import type {
  TaskItem,
  MilestoneItem,
  TeamMember,
  IssueItem,
  ResearchPaper,
  LearningResource,
  EngineeringNote,
  SimulationModel,
  MeetingItem,
} from './services/api';

// Dedicated Views
import { DashboardView } from './views/DashboardView';
import { RoadmapView } from './views/RoadmapView';
import { TasksView } from './views/TasksView';
import { DevelopmentView } from './views/DevelopmentView';
import { TeamView } from './views/TeamView';
import { MeetingsView } from './views/MeetingsView';
import { ExperimentsView } from './views/ExperimentsView';
import { IssuesView } from './views/IssuesView';
import { KnowledgeView } from './views/KnowledgeView';
import { ReportView } from './views/ReportView';
import { AdminView } from './views/AdminView';
import { ActivityView } from './views/ActivityView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const {
    state,
    refreshAll,
    toggleTheme,
    login,
    register,
    logout,
    addTask,
    updateTask,
    updateMyTaskStatus,
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
    updateMyReadingStatus,
    addEngineeringNote,
    updateEngineeringNote,
    deleteEngineeringNote,
    addReportSection,
    updateReportSection,
    deleteReportSection,
    addReportLink,
    deleteReportLink,
    updateProjectDetails,
    updateMotorParameters,
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
  } = useProjectStore();

  const [currentNav, setCurrentNav] = useState<NavSection>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [initialMeetingDate, setInitialMeetingDate] = useState<string | undefined>(undefined);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationModel | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<EngineeringNote | null>(null);

  const [isReportLinkModalOpen, setIsReportLinkModalOpen] = useState(false);
  const [selectedReportSectionId, setSelectedReportSectionId] = useState<string | null>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewMilestone = () => {
    setSelectedMilestone(null);
    setIsMilestoneModalOpen(true);
  };

  const handleEditMilestone = (milestone: MilestoneItem) => {
    setSelectedMilestone(milestone);
    setIsMilestoneModalOpen(true);
  };

  const handleOpenNewMember = () => {
    setSelectedMember(null);
    setIsTeamModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsTeamModalOpen(true);
  };

  const handleOpenNewSimulation = () => {
    setSelectedSimulation(null);
    setIsSimulationModalOpen(true);
  };

  const handleEditSimulation = (sim: SimulationModel) => {
    setSelectedSimulation(sim);
    setIsSimulationModalOpen(true);
  };

  const handleOpenNewIssue = () => {
    setSelectedIssue(null);
    setIsIssueModalOpen(true);
  };

  const handleEditIssue = (issue: IssueItem) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(true);
  };

  const handleOpenNewPaper = () => {
    setSelectedPaper(null);
    setIsPaperModalOpen(true);
  };

  const handleEditPaper = (paper: ResearchPaper) => {
    setSelectedPaper(paper);
    setIsPaperModalOpen(true);
  };

  const handleOpenNewResource = () => {
    setSelectedResource(null);
    setIsResourceModalOpen(true);
  };

  const handleEditResource = (resource: LearningResource) => {
    setSelectedResource(resource);
    setIsResourceModalOpen(true);
  };

  const handleOpenNewNote = () => {
    setSelectedNote(null);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: EngineeringNote) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenReportLink = (sectionId: string) => {
    setSelectedReportSectionId(sectionId);
    setIsReportLinkModalOpen(true);
  };

  const handleOpenNewMeeting = (initialDate?: string) => {
    setSelectedMeeting(null);
    setInitialMeetingDate(initialDate);
    setIsMeetingModalOpen(true);
  };

  const handleEditMeeting = (meeting: MeetingItem) => {
    setSelectedMeeting(meeting);
    setInitialMeetingDate(meeting.date);
    setIsMeetingModalOpen(true);
  };

  const renderActiveView = () => {
    switch (currentNav) {
      case 'dashboard':
        return (
          <DashboardView
            state={state}
            onNavigate={setCurrentNav}
            onOpenNewTask={handleOpenNewTask}
            onOpenNewMilestone={handleOpenNewMilestone}
            onOpenNewMember={handleOpenNewMember}
            onOpenNewTest={() => setIsTestModalOpen(true)}
          />
        );
      case 'roadmap':
        return (
          <RoadmapView
            state={state}
            onOpenNewMilestone={handleOpenNewMilestone}
            onEditMilestone={handleEditMilestone}
            onDeleteMilestone={deleteMilestone}
          />
        );
      case 'tasks':
        return (
          <TasksView
            state={state}
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onUpdateStatus={(id, status) => updateTask(id, { status })}
            onUpdateMemberStatus={updateMyTaskStatus}
            onDeleteTask={deleteTask}
          />
        );
      case 'development':
        return (
          <DevelopmentView
            state={state}
            onOpenNewSimulation={handleOpenNewSimulation}
            onEditSimulation={handleEditSimulation}
            onDeleteSimulation={deleteSimulation}
            onRefreshAll={refreshAll}
          />
        );
      case 'team':
        return (
          <TeamView
            state={state}
            onOpenNewMember={handleOpenNewMember}
            onEditMember={handleEditMember}
            onDeleteMember={deleteTeamMember}
          />
        );
      case 'meetings':
        return (
          <MeetingsView
            state={state}
            onOpenNewMeeting={handleOpenNewMeeting}
            onEditMeeting={handleEditMeeting}
            onDeleteMeeting={deleteMeeting}
            onAddEngineeringNote={addEngineeringNote}
          />
        );
      case 'testing':
        return (
          <ExperimentsView
            state={state}
            onOpenNewTest={() => setIsTestModalOpen(true)}
            onDeleteTest={deleteTest}
          />
        );
      case 'issues':
        return (
          <IssuesView
            state={state}
            onOpenNewIssue={handleOpenNewIssue}
            onEditIssue={handleEditIssue}
            onDeleteIssue={deleteIssue}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeView
            state={state}
            onOpenNewPaper={handleOpenNewPaper}
            onEditPaper={handleEditPaper}
            onDeletePaper={deleteResearchPaper}
            onOpenNewResource={handleOpenNewResource}
            onEditResource={handleEditResource}
            onDeleteResource={deleteLearningResource}
            onOpenNewNote={handleOpenNewNote}
            onEditNote={handleEditNote}
            onDeleteNote={deleteEngineeringNote}
            onOpenUploadDoc={() => setIsDocModalOpen(true)}
            onDeleteDoc={deleteDocument}
            onUpdateReadingStatus={updateMyReadingStatus}
          />
        );
      case 'report':
        return (
          <ReportView
            state={state}
            onAddSection={addReportSection}
            onUpdateSection={updateReportSection}
            onDeleteSection={deleteReportSection}
            onOpenLinkModal={handleOpenReportLink}
          />
        );
      case 'admin':
        return (
          <AdminView
            state={state}
            onAdminCreateUser={adminCreateUser}
            onAdminUpdateUserRole={adminUpdateUserRole}
            onAdminUpdateUserStatus={adminUpdateUserStatus}
            onAdminResetPassword={adminResetPassword}
            onAdminDeleteUser={adminDeleteUser}
            onAdminDeleteStorageFile={adminDeleteStorageFile}
            onUpdateProject={updateProjectDetails}
            onUpdateMotorParameters={updateMotorParameters}
            onAdminCreateBackup={adminCreateBackup}
            onAdminRestoreBackup={adminRestoreBackup}
            onAdminDeleteBackup={adminDeleteBackup}
            onAdminTriggerExternalBackup={adminTriggerExternalBackup}
            onAdminTestExternalDestination={adminTestExternalDestination}
            onAdminRestoreCompleteArchive={adminRestoreCompleteArchive}
            onRestoreTrashItem={restoreTrashItem}
            onPurgeTrashItem={purgeTrashItem}
          />
        );
      case 'activity':
        return <ActivityView state={state} />;
      case 'settings':
        return (
          <SettingsView
            state={state}
            onToggleTheme={toggleTheme}
            onUpdateProject={updateProjectDetails}
          />
        );
      default:
        return (
          <DashboardView
            state={state}
            onNavigate={setCurrentNav}
            onOpenNewTask={handleOpenNewTask}
            onOpenNewMilestone={handleOpenNewMilestone}
            onOpenNewMember={handleOpenNewMember}
            onOpenNewTest={() => setIsTestModalOpen(true)}
          />
        );
    }
  };

  const isDark = state.theme === 'dark';

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        state={state}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          theme={state.theme}
          onToggleTheme={toggleTheme}
          currentUser={state.currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={logout}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNewTask={handleOpenNewTask}
          onOpenNewMilestone={handleOpenNewMilestone}
          onOpenNewMeeting={() => handleOpenNewMeeting()}
          onOpenNewPaper={handleOpenNewPaper}
          onOpenNewResource={handleOpenNewResource}
          onOpenNewNote={handleOpenNewNote}
        />

        {/* Views Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {state.isLoading && state.team.length === 0 && state.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Connecting to persistent database...</span>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        onNavigate={setCurrentNav}
        theme={state.theme}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authStatus={state.authStatus}
        onLogin={async (credentials) => {
          const res = await login(credentials);
          return res.user;
        }}
        onRegister={async (data) => {
          const res = await register(data);
          return res.user;
        }}
        theme={state.theme}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={async (data) => {
          if (selectedTask) {
            return updateTask(selectedTask.id, data);
          }
          return addTask(data);
        }}
        task={selectedTask}
        team={state.team}
        milestones={state.milestones}
        theme={state.theme}
      />

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSave={async (data) => {
          if (selectedMilestone) {
            return updateMilestone(selectedMilestone.id, data);
          }
          return addMilestone(data);
        }}
        milestone={selectedMilestone}
        team={state.team}
        theme={state.theme}
      />

      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSave={async (data) => {
          if (selectedSimulation) {
            await updateSimulation(selectedSimulation.id, data);
          } else {
            await addSimulation(data);
          }
        }}
        initialData={selectedSimulation}
        milestones={state.milestones}
        tests={state.tests}
        theme={state.theme}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSave={async (data) => {
          if (selectedMember) {
            return updateTeamMember(selectedMember.id, data);
          }
          return addTeamMember(data);
        }}
        member={selectedMember}
        theme={state.theme}
      />

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSaveManual={addTest}
        onUploadCsv={uploadTestCsv}
        team={state.team}
        theme={state.theme}
      />

      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSave={async (data) => {
          if (selectedIssue) {
            return updateIssue(selectedIssue.id, data);
          }
          return addIssue(data);
        }}
        issue={selectedIssue}
        team={state.team}
        theme={state.theme}
      />

      <DocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onUpload={uploadDocument}
        team={state.team}
        theme={state.theme}
      />

      <ResearchPaperModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        onSaveManual={async (data: Partial<ResearchPaper>) => {
          if (selectedPaper) {
            return updateResearchPaper(selectedPaper.id, data);
          }
          return addResearchPaper(data);
        }}
        onUploadPdf={uploadResearchPaperPdf}
        paper={selectedPaper}
        team={state.team}
        theme={state.theme}
      />

      <LearningResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSave={async (data) => {
          if (selectedResource) {
            return updateLearningResource(selectedResource.id, data);
          }
          return addLearningResource(data);
        }}
        resource={selectedResource}
        team={state.team}
        theme={state.theme}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={async (data) => {
          if (selectedNote) {
            return updateEngineeringNote(selectedNote.id, data);
          }
          return addEngineeringNote(data);
        }}
        note={selectedNote}
        theme={state.theme}
      />

      <ReportLinkModal
        isOpen={isReportLinkModalOpen}
        onClose={() => setIsReportLinkModalOpen(false)}
        sectionId={selectedReportSectionId}
        state={state}
        onAddLink={addReportLink}
        onDeleteLink={deleteReportLink}
        theme={state.theme}
      />

      <ScheduleMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onSave={async (data) => {
          if (selectedMeeting) {
            return updateMeeting(selectedMeeting.id, data);
          }
          return addMeeting(data);
        }}
        meeting={selectedMeeting}
        initialDate={initialMeetingDate}
        theme={state.theme}
      />
    </div>
  );
}

export default App;
