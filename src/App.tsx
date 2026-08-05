import React, { useState, useEffect } from 'react';
import { useProjectStore } from './services/store';
import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { TaskModal } from './components/TaskModal';
import { ScheduleMeetingModal } from './components/ScheduleMeetingModal';

// Views
import { DashboardView } from './views/DashboardView';
import { RoadmapView } from './views/RoadmapView';
import { TasksView } from './views/TasksView';
import { TeamView } from './views/TeamView';
import { IndividualProgressView } from './views/IndividualProgressView';
import { DocumentationView } from './views/DocumentationView';
import { ComponentDatabaseView } from './views/ComponentDatabaseView';
import { HardwareView } from './views/HardwareView';
import { FirmwareView } from './views/FirmwareView';
import { ResearchView } from './views/ResearchView';
import { ExperimentsView } from './views/ExperimentsView';
import { IssuesView } from './views/IssuesView';
import { DecisionsView } from './views/DecisionsView';
import { MeetingsView } from './views/MeetingsView';
import { CalendarView } from './views/CalendarView';
import { MilestonesView } from './views/MilestonesView';
import { FilesView } from './views/FilesView';
import { ActivityView } from './views/ActivityView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const {
    state,
    toggleTheme,
    setCurrentUser,
    addTask,
    updateTaskStatus,
    deleteTask,
    addDoc,
    addComponent,
    addExperiment,
    addIssue,
    addDecision,
    addMeeting,
    convertActionItemToTask,
    updatePhaseProgress,
    addResearch,
    addFile,
    resetToDefault
  } = useProjectStore();

  const [currentNav, setCurrentNav] = useState<NavSection>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openEntity = (type: string, id: string) => {
    if (type === 'task') setCurrentNav('tasks');
    else if (type === 'doc') setCurrentNav('documentation');
    else if (type === 'component') setCurrentNav('components');
    else if (type === 'experiment') setCurrentNav('experiments');
    else if (type === 'issue') setCurrentNav('issues');
    else if (type === 'decision') setCurrentNav('decisions');
    else if (type === 'meeting') setCurrentNav('meetings');
  };

  const renderActiveView = () => {
    switch (currentNav) {
      case 'dashboard':
        return <DashboardView state={state} onNavigate={setCurrentNav} onOpenNewTask={() => setIsTaskModalOpen(true)} onOpenNewMeeting={() => setIsMeetingModalOpen(true)} />;
      case 'roadmap':
        return <RoadmapView state={state} onUpdatePhaseProgress={updatePhaseProgress} />;
      case 'tasks':
        return <TasksView state={state} onUpdateStatus={updateTaskStatus} onOpenNewTask={() => setIsTaskModalOpen(true)} onDeleteTask={deleteTask} />;
      case 'team':
        return <TeamView state={state} />;
      case 'my-progress':
        return <IndividualProgressView state={state} />;
      case 'documentation':
        return <DocumentationView state={state} onAddDoc={addDoc} />;
      case 'components':
        return <ComponentDatabaseView state={state} onAddComponent={addComponent} />;
      case 'hardware':
        return <HardwareView state={state} />;
      case 'firmware':
        return <FirmwareView state={state} />;
      case 'research':
        return <ResearchView state={state} onAddResearch={addResearch} />;
      case 'experiments':
        return <ExperimentsView state={state} onAddExperiment={addExperiment} />;
      case 'issues':
        return <IssuesView state={state} onAddIssue={addIssue} />;
      case 'decisions':
        return <DecisionsView state={state} onAddDecision={addDecision} />;
      case 'meetings':
        return <MeetingsView state={state} onOpenNewMeeting={() => setIsMeetingModalOpen(true)} onConvertActionItemToTask={convertActionItemToTask} />;
      case 'calendar':
        return <CalendarView state={state} />;
      case 'milestones':
        return <MilestonesView state={state} />;
      case 'files':
        return <FilesView state={state} onAddFile={addFile} />;
      case 'activity':
        return <ActivityView state={state} />;
      case 'settings':
        return <SettingsView state={state} onToggleTheme={toggleTheme} onResetDefault={resetToDefault} />;
      default:
        return <DashboardView state={state} onNavigate={setCurrentNav} onOpenNewTask={() => setIsTaskModalOpen(true)} onOpenNewMeeting={() => setIsMeetingModalOpen(true)} />;
    }
  };

  const isDark = state.theme === 'dark';

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        theme={state.theme}
        taskCount={state.tasks.filter(t => t.status !== 'Completed').length}
        issueCount={state.issues.filter(i => i.status !== 'Closed').length}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          theme={state.theme}
          onToggleTheme={toggleTheme}
          currentUser={state.currentUser}
          users={state.users}
          onSelectUser={setCurrentUser}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNewTask={() => setIsTaskModalOpen(true)}
          onOpenNewMeeting={() => setIsMeetingModalOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        onSelectEntity={openEntity}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={addTask}
        users={state.users}
        milestones={state.milestones}
        isDark={isDark}
        currentUser={state.currentUser}
      />

      <ScheduleMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onSave={addMeeting}
        users={state.users}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
