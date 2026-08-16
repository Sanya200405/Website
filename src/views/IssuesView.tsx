import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Trash2,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { IssueItem } from '../services/api';

interface IssuesViewProps {
  state: AppState;
  onOpenNewIssue: () => void;
  onEditIssue: (issue: IssueItem) => void;
  onDeleteIssue: (id: string) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({
  state,
  onOpenNewIssue,
  onEditIssue,
  onDeleteIssue,
}) => {
  const isDark = state.theme === 'dark';
  const { issues } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.subsystem && i.subsystem.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || i.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return isDark
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
          : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'High':
        return isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
          : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'Medium':
        return isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
          : 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
      case 'Low':
      default:
        return isDark
          ? 'bg-slate-800 text-slate-400 border-slate-700 font-semibold'
          : 'bg-slate-100 text-slate-600 border-slate-300 font-semibold';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fixed':
      case 'Closed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'Investigating':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      case 'Blocked':
        return isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold'
          : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'Open':
      default:
        return isDark
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold'
          : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const filterSelectClass = `px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${
    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
  }`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Issues & Blockers Tracker
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Track hardware bugs, firmware faults, thermal limits, and blockers with root cause analysis.
            </p>
          </div>
          <button
            onClick={onOpenNewIssue}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-3.5 ${cardBgClass}`}>
        <div className="relative flex-1 w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search issues, subsystems, root cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterSelectClass}
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Blocked">Blocked</option>
          <option value="Fixed">Fixed</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className={filterSelectClass}
        >
          <option value="all">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {filteredIssues.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
          }`}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {issues.length === 0 ? 'No active issues recorded' : 'No matching issues found'}
            </h3>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {issues.length === 0
                ? 'All engineering tracks are clear. Report issues to track bugs or unexpected hardware behavior.'
                : 'Try adjusting your search criteria or filters.'}
            </p>
          </div>
          {issues.length === 0 && (
            <button
              onClick={onOpenNewIssue}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Report First Issue</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadge(issue.priority)}`}>
                      {issue.priority} Priority
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {issue.subsystem || 'General'}
                    </span>
                  </div>

                  <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {issue.title}
                  </h3>

                  <p className={`text-sm leading-relaxed max-w-3xl font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {issue.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => onEditIssue(issue)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                    title="Edit Issue"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteIssue(issue.id)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                    title="Delete Issue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Root Cause & Solution Details */}
              {(issue.possible_cause || issue.solution) && (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 pt-3.5 border-t text-sm ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  {issue.possible_cause && (
                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>Root Cause Analysis</span>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{issue.possible_cause}</p>
                    </div>
                  )}
                  {issue.solution && (
                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
                    }`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>Resolution & Fix</span>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{issue.solution}</p>
                    </div>
                  )}
                </div>
              )}

              <div className={`flex items-center justify-between text-xs pt-3 mt-3 border-t font-mono ${
                isDark ? 'border-slate-800/40 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}>
                <span>Reported: {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}</span>
                <span>Assigned: {issue.assigned_to_name || 'Unassigned'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
