import { api } from './api';

const CACHE_PREFIX = 'foc_resilience_';

export interface LocalResilienceState {
  tasks: any[];
  meetings: any[];
  notes: any[];
  lastSavedAt: string;
}

export function saveLocalStateBackup(tasks: any[], meetings: any[], notes: any[]) {
  try {
    if (tasks.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}tasks`, JSON.stringify(tasks));
    }
    if (meetings.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}meetings`, JSON.stringify(meetings));
    }
    if (notes.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}notes`, JSON.stringify(notes));
    }
    localStorage.setItem(`${CACHE_PREFIX}last_saved`, new Date().toISOString());
  } catch (_) {}
}

export function getLocalStateBackup(): LocalResilienceState {
  let tasks: any[] = [];
  let meetings: any[] = [];
  let notes: any[] = [];
  let lastSavedAt = '';

  try {
    const rawT = localStorage.getItem(`${CACHE_PREFIX}tasks`);
    if (rawT) tasks = JSON.parse(rawT);

    const rawM = localStorage.getItem(`${CACHE_PREFIX}meetings`);
    if (rawM) meetings = JSON.parse(rawM);

    const rawN = localStorage.getItem(`${CACHE_PREFIX}notes`);
    if (rawN) notes = JSON.parse(rawN);

    lastSavedAt = localStorage.getItem(`${CACHE_PREFIX}last_saved`) || '';
  } catch (_) {}

  return { tasks, meetings, notes, lastSavedAt };
}

/**
 * Checks if browser cache has tasks/meetings/notes that are absent from the active server
 */
export function detectMissingServerItems(serverTasks: any[], serverMeetings: any[], serverNotes: any[]): {
  hasMissing: boolean;
  missingTasks: any[];
  missingMeetings: any[];
  missingNotes: any[];
  totalMissing: number;
} {
  const local = getLocalStateBackup();
  const serverTaskIds = new Set((serverTasks || []).map((t) => t.id));
  const serverMeetingIds = new Set((serverMeetings || []).map((m) => m.id));
  const serverNoteIds = new Set((serverNotes || []).map((n) => n.id));

  const missingTasks = local.tasks.filter((t) => !serverTaskIds.has(t.id));
  const missingMeetings = local.meetings.filter((m) => !serverMeetingIds.has(m.id));
  const missingNotes = local.notes.filter((n) => !serverNoteIds.has(n.id));

  const totalMissing = missingTasks.length + missingMeetings.length + missingNotes.length;

  return {
    hasMissing: totalMissing > 0,
    missingTasks,
    missingMeetings,
    missingNotes,
    totalMissing,
  };
}

/**
 * Auto-restores missing browser-cached items to the server
 */
export async function pushMissingItemsToServer(
  missingTasks: any[],
  missingMeetings: any[],
  missingNotes: any[]
): Promise<{ restoredCount: number }> {
  let restored = 0;

  // Restore Tasks
  for (const t of missingTasks) {
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

  // Restore Meetings
  for (const m of missingMeetings) {
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

  // Restore Notes
  for (const n of missingNotes) {
    try {
      await api.addEngineeringNote({
        title: n.title,
        content: n.content,
        tags: n.tags,
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
