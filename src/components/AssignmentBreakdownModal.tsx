import React from 'react';
import { X, Users, CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import type { TaskAssignment, ReadingAssignment, TeamMember } from '../services/api';
import { UserAvatar } from './UserAvatar';

interface AssignmentBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemType?: 'task' | 'reading';
  assignments?: (TaskAssignment | ReadingAssignment)[];
  isAllMembers?: boolean;
  team: TeamMember[];
  theme?: 'dark' | 'light';
}

export const AssignmentBreakdownModal: React.FC<AssignmentBreakdownModalProps> = ({
  isOpen,
  onClose,
  title,
  itemType = 'task',
  assignments = [],
  isAllMembers = false,
  team = [],
  theme = 'dark',
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Merge full team if isAllMembers is true to guarantee every member is shown even before first interaction
  const assignmentMap = new Map<string, TaskAssignment | ReadingAssignment>();
  assignments.forEach((a) => assignmentMap.set(a.member_id, a));

  const memberRows = isAllMembers
    ? team.map((member) => {
        const existing = assignmentMap.get(member.id);
        return {
          member_id: member.id,
          member_name: member.name,
          member_role: member.role,
          member_email: member.email,
          member_avatar: member.avatar,
          status: existing ? existing.status : (itemType === 'task' ? 'Not Started' : 'Unread'),
          completed_at: existing?.completed_at,
          updated_at: existing?.updated_at,
        };
      })
    : assignments.map((a) => ({
        member_id: a.member_id,
        member_name: a.member_name || 'Team Member',
        member_role: a.member_role || 'member',
        member_email: a.member_email || '',
        member_avatar: a.member_avatar,
        status: a.status,
        completed_at: a.completed_at,
        updated_at: a.updated_at,
      }));

  const completedCount = memberRows.filter((r) => r.status === 'Completed').length;
  const totalCount = memberRows.length || 1;
  const percent = Math.round((completedCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Progress':
      case 'Reading':
        return <Clock className="w-4 h-4 text-sky-500 animate-pulse" />;
      case 'Blocked':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'Unread':
      case 'Not Started':
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'In Progress':
      case 'Reading':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
          : 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Blocked':
        return isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Unread':
      case 'Not Started':
      default:
        return isDark
          ? 'bg-slate-800 text-slate-400 border-slate-700'
          : 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Assignment Status Breakdown
              </h2>
              <p className={`text-xs truncate max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className={`p-4 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Overall Team Completion
            </span>
            <span className="font-mono text-cyan-500">
              {completedCount} / {totalCount} ({percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-700/30 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {memberRows.map((row) => (
            <div
              key={row.member_id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                isDark ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={row.member_name} size="sm" />
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {row.member_name}
                  </div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    {row.member_role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(row.status)}`}>
                  {getStatusIcon(row.status)}
                  <span>{row.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`pt-3 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
