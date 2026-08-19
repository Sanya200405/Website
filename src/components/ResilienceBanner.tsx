import React, { useState, useMemo } from 'react';
import {
  CloudLightning,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import {
  detectMissingServerItems,
  pushMissingItemsToServer,
} from '../services/cloudSyncService';
import type {
  TaskItem,
  MilestoneItem,
  MeetingItem,
  EngineeringNote,
  ResearchPaper,
  LearningResource,
  TestItem,
  IssueItem,
  SimulationModel,
} from '../services/api';

interface ResilienceBannerProps {
  tasks: TaskItem[];
  milestones: MilestoneItem[];
  meetings: MeetingItem[];
  notes: EngineeringNote[];
  papers: ResearchPaper[];
  resources: LearningResource[];
  tests: TestItem[];
  issues: IssueItem[];
  simulations: SimulationModel[];
  onRestored: () => void;
}

export const ResilienceBanner: React.FC<ResilienceBannerProps> = ({
  tasks,
  milestones,
  meetings,
  notes,
  papers,
  resources,
  tests,
  issues,
  simulations,
  onRestored,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const missingInfo = useMemo(() => {
    return detectMissingServerItems(
      tasks,
      milestones,
      meetings,
      notes,
      papers,
      resources,
      tests,
      issues,
      simulations
    );
  }, [tasks, milestones, meetings, notes, papers, resources, tests, issues, simulations]);

  if (!missingInfo.hasMissing || isDismissed) {
    return null;
  }

  const breakdownParts: string[] = [];
  if (missingInfo.missingTasks.length > 0) breakdownParts.push(`${missingInfo.missingTasks.length} task(s)`);
  if (missingInfo.missingMilestones.length > 0) breakdownParts.push(`${missingInfo.missingMilestones.length} milestone(s)`);
  if (missingInfo.missingMeetings.length > 0) breakdownParts.push(`${missingInfo.missingMeetings.length} meeting(s)`);
  if (missingInfo.missingNotes.length > 0) breakdownParts.push(`${missingInfo.missingNotes.length} note(s)`);
  if (missingInfo.missingPapers.length > 0) breakdownParts.push(`${missingInfo.missingPapers.length} paper(s)`);
  if (missingInfo.missingResources.length > 0) breakdownParts.push(`${missingInfo.missingResources.length} resource(s)`);
  if (missingInfo.missingTests.length > 0) breakdownParts.push(`${missingInfo.missingTests.length} test(s)`);
  if (missingInfo.missingIssues.length > 0) breakdownParts.push(`${missingInfo.missingIssues.length} issue(s)`);
  if (missingInfo.missingSimulations.length > 0) breakdownParts.push(`${missingInfo.missingSimulations.length} simulation(s)`);

  const breakdownText = breakdownParts.join(', ');

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setRestoreError(null);
      const res = await pushMissingItemsToServer(missingInfo);
      setRestoreSuccess(`Successfully recovered ${res.restoredCount} item(s) to the server!`);
      setTimeout(() => {
        onRestored();
      }, 800);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore items from browser cache');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-slate-900 border-b border-amber-500/40 text-amber-100 px-4 py-3 shadow-lg relative z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5 md:mt-0">
            <CloudLightning className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide text-amber-200">
                Browser Resilience Vault Detected
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {missingInfo.totalMissing} Missing from Server
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
              Your browser saved <strong className="text-white">{breakdownText}</strong> from a previous session that are not on the active server.
            </p>
            {restoreSuccess && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {restoreSuccess}
              </p>
            )}
            {restoreError && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {restoreError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Restore All to Server</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </>
            )}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-amber-800/40 text-amber-300/70 hover:text-amber-200 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
