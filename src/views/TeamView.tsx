import React from 'react';
import {
  Users,
  Plus,
  Mail,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { TeamMember } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';

interface TeamViewProps {
  state: AppState;
  onOpenNewMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  state,
  onOpenNewMember,
  onEditMember,
  onDeleteMember,
}) => {
  const isDark = state.theme === 'dark';
  const { team, tasks, stats } = state;

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
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Team Workspace
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Manage engineering team members, assign project roles, and track active workloads.
            </p>
          </div>
          <button
            onClick={onOpenNewMember}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Team Members Grid */}
      {team.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
          }`}>
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>No team members added yet</h3>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Add your engineering team members (e.g. Hardware Lead, Firmware Lead, Test Engineer) to assign tasks and milestones.
            </p>
          </div>
          <button
            onClick={onOpenNewMember}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Team Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigned_to_id === member.id);
            const activeMemberTasks = memberTasks.filter((t) => t.status === 'In Progress' || t.status === 'Not Started');
            const completedMemberTasks = memberTasks.filter((t) => t.status === 'Completed');
            const workload = stats.activeTasks > 0
              ? Math.round((activeMemberTasks.length / stats.activeTasks) * 100)
              : 0;

            return (
              <div
                key={member.id}
                className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between transition-all ${cardBgClass}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <UserAvatar name={member.name} size="lg" />
                      <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {member.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border mt-1 inline-block uppercase ${
                          member.role === 'admin'
                            ? isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                            : isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {member.role || 'member'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditMember(member)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                        title="Edit Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {member.email && (
                    <div className={`flex items-center gap-2 text-xs mb-3 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}

                  {member.bio && (
                    <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {member.bio}
                    </p>
                  )}
                </div>

                {/* Real Workload & Task Metrics */}
                <div className={`pt-4 border-t space-y-2 text-sm ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className={`flex justify-between items-center text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Active Workload</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {activeMemberTasks.length} active tasks ({workload}%)
                    </span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-200 border-slate-300'}`}>
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, workload))}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-xs pt-1 font-mono font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>{completedMemberTasks.length} completed</span>
                    <span>{memberTasks.length} assigned total</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
