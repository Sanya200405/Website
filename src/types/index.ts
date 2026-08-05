export type UserRole = 'Admin' | 'Project Lead' | 'Hardware' | 'Firmware' | 'Control/FOC' | 'Mechanical' | 'Testing' | 'Documentation' | 'Viewer';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  skills: string[];
  bio: string;
  workloadPercentage: number;
}

export type TaskStatus = 'Backlog' | 'Not Started' | 'In Progress' | 'Blocked' | 'Under Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskCategory = 'Hardware' | 'Firmware' | 'FOC' | 'Mechanical' | 'Research' | 'Testing' | 'Documentation' | 'Management';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedToAvatar: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  startDate: string;
  deadline: string;
  estimatedEffortHours: number;
  actualEffortHours: number;
  milestoneId?: string;
  milestoneTitle?: string;
  relatedDocId?: string;
  relatedDocTitle?: string;
  relatedFileId?: string;
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  dependencies: string[]; // task IDs
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  tags: string[];
}

export interface Milestone {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  deadline: string;
  progressPercentage: number;
  subtasks: { id: string; title: string; completed: boolean }[];
  isCurrent: boolean;
}

export interface Phase {
  id: string;
  number: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progressPercentage: number;
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Delayed';
  assigneeName: string;
  milestoneCount: number;
  dependencies: string[];
}

export interface TechnicalDoc {
  id: string;
  title: string;
  category: 'FOC' | 'Motor' | 'Moteus Study' | 'Hardware' | 'Firmware' | 'Mechanical' | 'Testing';
  content: string; // Markdown / Text
  authorName: string;
  lastUpdated: string;
  tags: string[];
  relatedDocs?: string[];
  subsections?: { id: string; title: string }[];
}

export type ComponentStatus = 'Selected' | 'Candidate' | 'Rejected';
export type ComponentCategory = 'MCU' | 'MOSFET' | 'Gate Driver' | 'Current Sensor' | 'Voltage Regulator' | 'Encoder' | 'Capacitor' | 'Resistor' | 'Connector' | 'Communication IC' | 'Protection' | 'Mechanical' | 'Gearbox';

export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  manufacturer: string;
  partNumber: string;
  datasheetUrl: string;
  purpose: string;
  specs: {
    voltageRating?: string;
    currentRating?: string;
    package?: string;
    resistance?: string;
    bandwidth?: string;
    gearRatio?: string;
    resolution?: string;
    [key: string]: string | undefined;
  };
  costUsd: number;
  availabilityStatus: 'In Stock' | 'Lead Time 2-3w' | 'Out of Stock' | 'Ordered';
  status: ComponentStatus;
  reasonForSelection: string;
  schematicSection: string;
  pcbLocation: string;
  notes: string;
  tags: string[];
}

export interface HardwareRevision {
  id: string;
  revName: string; // e.g. Rev 0, Rev 1
  date: string;
  personResponsible: string;
  changesSummary: string;
  reasonForChange: string;
  problemsFound: string;
  testResultsSummary: string;
  gerberFileUrl?: string;
  schematicFileUrl?: string;
  status: 'Deprecated' | 'Active Testing' | 'Planned Production';
}

export interface FirmwareModule {
  id: string;
  name: string;
  description: string;
  status: 'Verified' | 'In Development' | 'Testing' | 'Planned';
  loopFrequency: string; // e.g., "20 kHz FOC Loop"
  assignedMember: string;
  repositoryLink: string;
  lastCommitHash: string;
  notes: string;
}

export interface ResearchEntry {
  id: string;
  topic: string;
  title: string;
  source: string; // IEEE, Paper, GitHub, App Note
  url: string;
  summary: string;
  importantFindings: string;
  equations: string[];
  relevantComponents: string[];
  applicationToProject: string;
  addedBy: string;
  addedDate: string;
  tags: string[];
}

export interface ExperimentDataPoint {
  timeMs: number;
  targetCurrentA?: number;
  measuredCurrentA?: number;
  speedRpm?: number;
  torqueNm?: number;
  tempC?: number;
}

export interface ExperimentLog {
  id: string;
  title: string;
  objective: string;
  date: string;
  conductedBy: string;
  hardwareSetup: string;
  motorUsed: string;
  supplyVoltageV: number;
  supplyCurrentA: number;
  pwmFrequencyKhz: number;
  motorSpeedRpm: number;
  loadTorqueNm: number;
  gearRatio: string;
  controllerSettings: string;
  expectedResult: string;
  actualResult: string;
  observations: string;
  problemsEncountered: string;
  conclusion: string;
  nextAction: string;
  dataPoints: ExperimentDataPoint[];
  tags: string[];
}

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Open' | 'Investigating' | 'Fixed' | 'Testing' | 'Closed' | 'Won\'t Fix';

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  assignedToName: string;
  dateDiscovered: string;
  subsystem: 'Hardware' | 'Firmware' | 'FOC Algorithm' | 'Mechanical' | 'Sensors' | 'CAN-FD';
  possibleCause: string;
  investigationNotes: string;
  solution: string;
  testResult: string;
  finalConclusion: string;
  tags: string[];
}

export interface DecisionRecord {
  id: string;
  title: string;
  date: string;
  decision: string;
  alternativesConsidered: string[];
  advantages: string[];
  disadvantages: string[];
  reasonForChoice: string;
  peopleInvolved: string[];
  relatedTaskId?: string;
  relatedDocId?: string;
  tags: string[];
}

export interface MeetingActionItem {
  id: string;
  title: string;
  assignedToName: string;
  convertedToTaskId?: string;
  completed: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  locationOrLink: string;
  participants: string[];
  agenda: string[];
  notes: string;
  decisions: string[];
  actionItems: MeetingActionItem[];
  followUpDate?: string;
  isRecurring: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  category: 'Datasheets' | 'Schematics' | 'PCB' | 'CAD' | 'Firmware' | 'Research Papers' | 'Test Results' | 'Images' | 'Meeting Documents' | 'Reports';
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  url: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  tags: string[];
}

export interface ActivityLog {
  id: string;
  personName: string;
  personAvatar: string;
  action: string;
  targetName: string;
  category: string;
  timestamp: string;
}
