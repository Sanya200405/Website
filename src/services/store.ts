import { useState, useEffect } from 'react';
import type {
  User, Task, Phase, Milestone, TechnicalDoc, Component,
  HardwareRevision, FirmwareModule, ResearchEntry, ExperimentLog,
  Issue, DecisionRecord, Meeting, ProjectFile, ActivityLog, TaskStatus
} from '../types';
import {
  INITIAL_USERS, INITIAL_PHASES, INITIAL_MILESTONES, INITIAL_TASKS,
  INITIAL_TECHNICAL_DOCS, INITIAL_COMPONENTS, INITIAL_HARDWARE_REVISIONS,
  INITIAL_FIRMWARE_MODULES, INITIAL_RESEARCH, INITIAL_EXPERIMENTS,
  INITIAL_ISSUES, INITIAL_DECISIONS, INITIAL_MEETINGS, INITIAL_FILES,
  INITIAL_ACTIVITIES
} from './initialData';

const STORAGE_KEY = 'foc_drive_project_state_v1';

export interface AppState {
  theme: 'dark' | 'light';
  currentUser: User;
  users: User[];
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  docs: TechnicalDoc[];
  components: Component[];
  hardwareRevisions: HardwareRevision[];
  firmwareModules: FirmwareModule[];
  researchEntries: ResearchEntry[];
  experiments: ExperimentLog[];
  issues: Issue[];
  decisions: DecisionRecord[];
  meetings: Meeting[];
  files: ProjectFile[];
  activities: ActivityLog[];
}

export function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
  return {
    theme: 'dark',
    currentUser: INITIAL_USERS[0],
    users: INITIAL_USERS,
    phases: INITIAL_PHASES,
    milestones: INITIAL_MILESTONES,
    tasks: INITIAL_TASKS,
    docs: INITIAL_TECHNICAL_DOCS,
    components: INITIAL_COMPONENTS,
    hardwareRevisions: INITIAL_HARDWARE_REVISIONS,
    firmwareModules: INITIAL_FIRMWARE_MODULES,
    researchEntries: INITIAL_RESEARCH,
    experiments: INITIAL_EXPERIMENTS,
    issues: INITIAL_ISSUES,
    decisions: INITIAL_DECISIONS,
    meetings: INITIAL_MEETINGS,
    files: INITIAL_FILES,
    activities: INITIAL_ACTIVITIES,
  };
}

export function useProjectStore() {
  const [state, setState] = useState<AppState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state]);

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const setCurrentUser = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdDate' | 'lastUpdated'>) => {
    const newTask: Task = {
      ...task,
      id: 't_' + Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    const newActivity: ActivityLog = {
      id: 'act_' + Date.now(),
      personName: state.currentUser.name,
      personAvatar: state.currentUser.avatar,
      action: 'created task',
      targetName: newTask.title,
      category: 'Tasks',
      timestamp: 'Just now'
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      activities: [newActivity, ...prev.activities]
    }));
    return newTask;
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      const updatedTasks = prev.tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : t
      );
      const newActivity: ActivityLog = {
        id: 'act_' + Date.now(),
        personName: prev.currentUser.name,
        personAvatar: prev.currentUser.avatar,
        action: `updated task to ${newStatus}`,
        targetName: task.title,
        category: 'Tasks',
        timestamp: 'Just now'
      };
      return {
        ...prev,
        tasks: updatedTasks,
        activities: [newActivity, ...prev.activities]
      };
    });
  };

  const updateTask = (updatedTask: Task) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === updatedTask.id ? { ...updatedTask, lastUpdated: new Date().toISOString().split('T')[0] } : t)
    }));
  };

  const deleteTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const addDoc = (doc: Omit<TechnicalDoc, 'id' | 'lastUpdated'>) => {
    const newDoc: TechnicalDoc = {
      ...doc,
      id: 'd_' + Date.now(),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    const newActivity: ActivityLog = {
      id: 'act_' + Date.now(),
      personName: state.currentUser.name,
      personAvatar: state.currentUser.avatar,
      action: 'published doc',
      targetName: newDoc.title,
      category: 'Documentation',
      timestamp: 'Just now'
    };
    setState(prev => ({
      ...prev,
      docs: [newDoc, ...prev.docs],
      activities: [newActivity, ...prev.activities]
    }));
  };

  const addComponent = (comp: Omit<Component, 'id'>) => {
    const newComp: Component = { ...comp, id: 'c_' + Date.now() };
    setState(prev => ({ ...prev, components: [...prev.components, newComp] }));
  };

  const addExperiment = (exp: Omit<ExperimentLog, 'id'>) => {
    const newExp: ExperimentLog = { ...exp, id: 'e_' + Date.now() };
    const newActivity: ActivityLog = {
      id: 'act_' + Date.now(),
      personName: state.currentUser.name,
      personAvatar: state.currentUser.avatar,
      action: 'recorded experiment',
      targetName: newExp.title,
      category: 'Experiments',
      timestamp: 'Just now'
    };
    setState(prev => ({
      ...prev,
      experiments: [newExp, ...prev.experiments],
      activities: [newActivity, ...prev.activities]
    }));
  };

  const addIssue = (issue: Omit<Issue, 'id' | 'dateDiscovered'>) => {
    const newIssue: Issue = {
      ...issue,
      id: 'iss_' + Date.now(),
      dateDiscovered: new Date().toISOString().split('T')[0]
    };
    setState(prev => ({ ...prev, issues: [newIssue, ...prev.issues] }));
  };

  const addDecision = (decision: Omit<DecisionRecord, 'id' | 'date'>) => {
    const newDec: DecisionRecord = {
      ...decision,
      id: 'dec_' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setState(prev => ({ ...prev, decisions: [newDec, ...prev.decisions] }));
  };

  const addMeeting = (meeting: Omit<Meeting, 'id'>) => {
    const newM: Meeting = { ...meeting, id: 'm_' + Date.now() };
    const newActivity: ActivityLog = {
      id: 'act_' + Date.now(),
      personName: state.currentUser.name,
      personAvatar: state.currentUser.avatar,
      action: 'scheduled meeting',
      targetName: newM.title,
      category: 'Meetings',
      timestamp: 'Just now'
    };
    setState(prev => ({
      ...prev,
      meetings: [newM, ...prev.meetings],
      activities: [newActivity, ...prev.activities]
    }));
  };

  const convertActionItemToTask = (meetingId: string, actionItemId: string, assignedToName: string, title: string) => {
    const assignedUser = state.users.find(u => u.name === assignedToName) || state.currentUser;
    const newTask = addTask({
      title: `[Meeting Action Item] ${title}`,
      description: `Action item generated from meeting: ${title}`,
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      assignedToAvatar: assignedUser.avatar,
      priority: 'High',
      status: 'Not Started',
      category: 'Management',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedEffortHours: 4,
      actualEffortHours: 0,
      checklist: [],
      comments: [],
      dependencies: [],
      createdBy: state.currentUser.name,
      tags: ['ActionItem', 'Meeting']
    });

    setState(prev => ({
      ...prev,
      meetings: prev.meetings.map(m => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          actionItems: m.actionItems.map(ai => ai.id === actionItemId ? { ...ai, convertedToTaskId: newTask.id } : ai)
        };
      })
    }));
  };

  const addPhase = (phase: Omit<Phase, 'id'>) => {
    const newPhase: Phase = { ...phase, id: 'p_' + Date.now() };
    setState(prev => ({ ...prev, phases: [...prev.phases, newPhase] }));
  };

  const updatePhaseProgress = (phaseId: string, progressPercentage: number) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map(p => p.id === phaseId ? { ...p, progressPercentage } : p)
    }));
  };

  const addResearch = (res: Omit<ResearchEntry, 'id' | 'addedDate'>) => {
    const newRes: ResearchEntry = {
      ...res,
      id: 'r_' + Date.now(),
      addedDate: new Date().toISOString().split('T')[0]
    };
    setState(prev => ({ ...prev, researchEntries: [newRes, ...prev.researchEntries] }));
  };

  const addFile = (file: Omit<ProjectFile, 'id' | 'uploadedDate'>) => {
    const newF: ProjectFile = {
      ...file,
      id: 'f_' + Date.now(),
      uploadedDate: new Date().toISOString().split('T')[0]
    };
    setState(prev => ({ ...prev, files: [newF, ...prev.files] }));
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(loadInitialState());
  };

  return {
    state,
    toggleTheme,
    setCurrentUser,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addDoc,
    addComponent,
    addExperiment,
    addIssue,
    addDecision,
    addMeeting,
    convertActionItemToTask,
    addPhase,
    updatePhaseProgress,
    addResearch,
    addFile,
    resetToDefault
  };
}
