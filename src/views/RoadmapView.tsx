import React, { useState } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { MilestoneItem } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { ConfirmModal } from '../components/ConfirmModal';

interface RoadmapViewProps {
  state: AppState;
  onOpenNewMilestone: () => void;
  onEditMilestone: (milestone: MilestoneItem) => void;
  onDeleteMilestone: (id: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  state,
  onOpenNewMilestone,
  onEditMilestone,
  onDeleteMilestone,
}) => {
  const isDark = state.theme === 'dark';
  const { milestones, tasks, stats } = state;

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'In Progress':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      case 'Delayed':
        return isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold'
          : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'Not Started':
      default:
        return isDark
          ? 'bg-slate-800 text-slate-300 border-slate-700 font-semibold'
          : 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  const confirmDeleteMilestone = (ms: MilestoneItem) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Milestone Phase to Trash?',
      message: `Are you sure you want to move phase "${ms.title}" to the Trash Vault? Assigned tasks will be unlinked from this phase.`,
      onConfirm: () => {
        onDeleteMilestone(ms.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Project Progress & Roadmap
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Track project phases and milestones. Progress is dynamically calculated based on completed subtasks.
            </p>
          </div>
          <button
            onClick={onOpenNewMilestone}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone Phase</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 md:p-5 rounded-2xl border ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Milestones</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {stats.totalMilestones}
          </span>
        </div>
        <div className={`p-4 md:p-5 rounded-2xl border ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed Phases</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {stats.completedMilestones}
          </span>
        </div>
        <div className={`p-4 md:p-5 rounded-2xl border ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Milestone Progress</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
            {stats.overallProgress}%
          </span>
        </div>
        <div className={`p-4 md:p-5 rounded-2xl border ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Tasks Linked</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            {stats.totalTasks}
          </span>
        </div>
      </div>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
          <Award className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No milestones defined yet</h3>
          <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            Break down the FOC motor drive engineering journey into structured roadmap phases.
          </p>
          <button
            onClick={onOpenNewMilestone}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Phase 1</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((ms, index) => {
            const milestoneTasks = tasks.filter((t) => t.milestone_id === ms.id);
            const completedCount = milestoneTasks.filter((t) => t.status === 'Completed').length;
            const progress = milestoneTasks.length > 0
              ? Math.round((completedCount / milestoneTasks.length) * 100)
              : ms.status === 'Completed' ? 100 : 0;

            return (
              <div
                key={ms.id}
                className={`p-6 md:p-7 rounded-2xl border space-y-4 transition-all ${cardBgClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                        isDark ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}>
                        Phase {index + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadge(ms.status)}`}>
                        {ms.status}
                      </span>
                      {ms.assigned_member_name && (
                        <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <UserAvatar name={ms.assigned_member_name} size="sm" />
                          <span>{ms.assigned_member_name}</span>
                        </div>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {ms.title}
                    </h3>
                    <p className={`text-sm leading-relaxed max-w-3xl font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {ms.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => onEditMilestone(ms)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                      title="Edit Milestone"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDeleteMilestone(ms)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      title="Move Milestone to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`space-y-2 pt-3 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Tasks Progress ({completedCount}/{milestoneTasks.length} Completed)
                    </span>
                    <span className={`font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-200 border-slate-300'}`}>
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-between text-xs pt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>Start: {ms.start_date || '—'}</span>
                    <span>Target Due: {ms.due_date || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Move to Trash"
        confirmVariant="danger"
        theme={state.theme}
      />
    </div>
  );
};
