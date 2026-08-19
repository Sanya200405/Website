import { api } from './api';

const CACHE_PREFIX = 'foc_resilience_';

export interface LocalResilienceState {
  tasks: any[];
  milestones: any[];
  meetings: any[];
  notes: any[];
  researchPapers: any[];
  learningResources: any[];
  tests: any[];
  issues: any[];
  simulations: any[];
  lastSavedAt: string;
}

export function saveLocalStateBackup(
  tasks: any[] = [],
  milestones: any[] = [],
  meetings: any[] = [],
  notes: any[] = [],
  researchPapers: any[] = [],
  learningResources: any[] = [],
  tests: any[] = [],
  issues: any[] = [],
  simulations: any[] = []
) {
  try {
    if (tasks && tasks.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}tasks`, JSON.stringify(tasks));
    }
    if (milestones && milestones.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}milestones`, JSON.stringify(milestones));
    }
    if (meetings && meetings.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}meetings`, JSON.stringify(meetings));
    }
    if (notes && notes.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}notes`, JSON.stringify(notes));
    }
    if (researchPapers && researchPapers.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}papers`, JSON.stringify(researchPapers));
    }
    if (learningResources && learningResources.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}resources`, JSON.stringify(learningResources));
    }
    if (tests && tests.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}tests`, JSON.stringify(tests));
    }
    if (issues && issues.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}issues`, JSON.stringify(issues));
    }
    if (simulations && simulations.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}simulations`, JSON.stringify(simulations));
    }
    localStorage.setItem(`${CACHE_PREFIX}last_saved`, new Date().toISOString());
  } catch (_) {}
}

export function getLocalStateBackup(): LocalResilienceState {
  let tasks: any[] = [];
  let milestones: any[] = [];
  let meetings: any[] = [];
  let notes: any[] = [];
  let researchPapers: any[] = [];
  let learningResources: any[] = [];
  let tests: any[] = [];
  let issues: any[] = [];
  let simulations: any[] = [];
  let lastSavedAt = '';

  try {
    const rawT = localStorage.getItem(`${CACHE_PREFIX}tasks`);
    if (rawT) tasks = JSON.parse(rawT);

    const rawM = localStorage.getItem(`${CACHE_PREFIX}milestones`);
    if (rawM) milestones = JSON.parse(rawM);

    const rawMt = localStorage.getItem(`${CACHE_PREFIX}meetings`);
    if (rawMt) meetings = JSON.parse(rawMt);

    const rawN = localStorage.getItem(`${CACHE_PREFIX}notes`);
    if (rawN) notes = JSON.parse(rawN);

    const rawP = localStorage.getItem(`${CACHE_PREFIX}papers`);
    if (rawP) researchPapers = JSON.parse(rawP);

    const rawR = localStorage.getItem(`${CACHE_PREFIX}resources`);
    if (rawR) learningResources = JSON.parse(rawR);

    const rawTs = localStorage.getItem(`${CACHE_PREFIX}tests`);
    if (rawTs) tests = JSON.parse(rawTs);

    const rawI = localStorage.getItem(`${CACHE_PREFIX}issues`);
    if (rawI) issues = JSON.parse(rawI);

    const rawS = localStorage.getItem(`${CACHE_PREFIX}simulations`);
    if (rawS) simulations = JSON.parse(rawS);

    lastSavedAt = localStorage.getItem(`${CACHE_PREFIX}last_saved`) || '';
  } catch (_) {}

  return {
    tasks,
    milestones,
    meetings,
    notes,
    researchPapers,
    learningResources,
    tests,
    issues,
    simulations,
    lastSavedAt,
  };
}

/**
 * Checks if browser cache has items that are absent from the active server
 */
export function detectMissingServerItems(
  serverTasks: any[] = [],
  serverMilestones: any[] = [],
  serverMeetings: any[] = [],
  serverNotes: any[] = [],
  serverPapers: any[] = [],
  serverResources: any[] = [],
  serverTests: any[] = [],
  serverIssues: any[] = [],
  serverSimulations: any[] = []
): {
  hasMissing: boolean;
  missingTasks: any[];
  missingMilestones: any[];
  missingMeetings: any[];
  missingNotes: any[];
  missingPapers: any[];
  missingResources: any[];
  missingTests: any[];
  missingIssues: any[];
  missingSimulations: any[];
  totalMissing: number;
} {
  const local = getLocalStateBackup();

  const serverTaskIds = new Set((serverTasks || []).map((t) => t.id));
  const serverMilestoneIds = new Set((serverMilestones || []).map((m) => m.id));
  const serverMeetingIds = new Set((serverMeetings || []).map((m) => m.id));
  const serverNoteIds = new Set((serverNotes || []).map((n) => n.id));
  const serverPaperIds = new Set((serverPapers || []).map((p) => p.id));
  const serverResourceIds = new Set((serverResources || []).map((r) => r.id));
  const serverTestIds = new Set((serverTests || []).map((t) => t.id));
  const serverIssueIds = new Set((serverIssues || []).map((i) => i.id));
  const serverSimulationIds = new Set((serverSimulations || []).map((s) => s.id));

  const missingTasks = local.tasks.filter((t) => !serverTaskIds.has(t.id));
  const missingMilestones = local.milestones.filter((m) => !serverMilestoneIds.has(m.id));
  const missingMeetings = local.meetings.filter((m) => !serverMeetingIds.has(m.id));
  const missingNotes = local.notes.filter((n) => !serverNoteIds.has(n.id));
  const missingPapers = local.researchPapers.filter((p) => !serverPaperIds.has(p.id));
  const missingResources = local.learningResources.filter((r) => !serverResourceIds.has(r.id));
  const missingTests = local.tests.filter((t) => !serverTestIds.has(t.id));
  const missingIssues = local.issues.filter((i) => !serverIssueIds.has(i.id));
  const missingSimulations = local.simulations.filter((s) => !serverSimulationIds.has(s.id));

  const totalMissing =
    missingTasks.length +
    missingMilestones.length +
    missingMeetings.length +
    missingNotes.length +
    missingPapers.length +
    missingResources.length +
    missingTests.length +
    missingIssues.length +
    missingSimulations.length;

  return {
    hasMissing: totalMissing > 0,
    missingTasks,
    missingMilestones,
    missingMeetings,
    missingNotes,
    missingPapers,
    missingResources,
    missingTests,
    missingIssues,
    missingSimulations,
    totalMissing,
  };
}

/**
 * Auto-restores missing browser-cached items to the server
 */
export async function pushMissingItemsToServer(missing: {
  missingTasks?: any[];
  missingMilestones?: any[];
  missingMeetings?: any[];
  missingNotes?: any[];
  missingPapers?: any[];
  missingResources?: any[];
  missingTests?: any[];
  missingIssues?: any[];
  missingSimulations?: any[];
}): Promise<{ restoredCount: number }> {
  let restored = 0;

  // 1. Milestones
  for (const m of missing.missingMilestones || []) {
    try {
      await api.addMilestone({
        title: m.title,
        description: m.description,
        status: m.status,
        assigned_member_id: m.assigned_member_id,
        start_date: m.start_date,
        due_date: m.due_date,
      });
      restored++;
    } catch (_) {}
  }

  // 2. Tasks
  for (const t of missing.missingTasks || []) {
    try {
      await api.addTask({
        title: t.title,
        description: t.description,
        milestone_id: t.milestone_id,
        assigned_to_id: t.assigned_to_id,
        priority: t.priority,
        category: t.category,
        due_date: t.due_date,
        status: t.status,
        is_all_members: t.is_all_members,
        assigned_member_ids: t.assigned_member_ids,
      });
      restored++;
    } catch (_) {}
  }

  // 3. Meetings
  for (const m of missing.missingMeetings || []) {
    try {
      await api.addMeeting({
        title: m.title,
        date: m.date,
        start_time: m.start_time,
        end_time: m.end_time,
        meeting_link: m.meeting_link,
        location: m.location,
        description: m.description,
        notes: m.notes,
        reminder: m.reminder,
      });
      restored++;
    } catch (_) {}
  }

  // 4. Notes
  for (const n of missing.missingNotes || []) {
    try {
      await api.addEngineeringNote({
        title: n.title,
        content: n.content,
        tags: n.tags,
      });
      restored++;
    } catch (_) {}
  }

  // 5. Research Papers
  for (const p of missing.missingPapers || []) {
    try {
      await api.addResearchPaper({
        title: p.title,
        authors: p.authors,
        year: p.year,
        journal_conference: p.journal_conference,
        doi: p.doi,
        url: p.url,
        topic: p.topic,
        tags: p.tags,
        summary: p.summary,
        notes: p.notes,
        reading_status: p.reading_status,
      });
      restored++;
    } catch (_) {}
  }

  // 6. Learning Resources
  for (const r of missing.missingResources || []) {
    try {
      await api.addLearningResource({
        title: r.title,
        url: r.url,
        resource_type: r.resource_type,
        topic: r.topic,
        description: r.description,
        tags: r.tags,
        notes: r.notes,
      });
      restored++;
    } catch (_) {}
  }

  // 7. Tests
  for (const ts of missing.missingTests || []) {
    try {
      await api.addTest({
        test_name: ts.test_name,
        test_type: ts.test_type,
        date: ts.date,
        status: ts.status,
        observations: ts.observations,
        result: ts.result,
        hardware_setup: ts.hardware_setup,
      });
      restored++;
    } catch (_) {}
  }

  // 8. Issues
  for (const i of missing.missingIssues || []) {
    try {
      await api.addIssue({
        title: i.title,
        description: i.description,
        priority: i.priority,
        status: i.status,
        subsystem: i.subsystem,
        possible_cause: i.possible_cause,
        solution: i.solution,
      });
      restored++;
    } catch (_) {}
  }

  // 9. Simulations
  for (const s of missing.missingSimulations || []) {
    try {
      await api.addSimulation({
        name: s.name,
        description: s.description,
        purpose: s.purpose,
        github_path: s.github_path,
        status: s.status,
      });
      restored++;
    } catch (_) {}
  }

  // Trigger immediate cloud push to lock it into Cloud Vault
  try {
    await api.triggerCloudSyncPush();
  } catch (_) {}

  return { restoredCount: restored };
}
