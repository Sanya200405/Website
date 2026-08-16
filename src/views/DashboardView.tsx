import React from 'react';
import {
  Clock,
  AlertCircle,
  FlaskConical,
  Award,
  ArrowRight,
  Plus,
  Users,
  ShieldCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { NavSection } from '../components/Sidebar';
import { UserAvatar } from '../components/UserAvatar';
import { GithubIcon } from '../components/GithubIcon';

interface DashboardViewProps {
  state: AppState;
  onNavigate: (tab: NavSection) => void;
  onOpenNewTask: () => void;
  onOpenNewMilestone: () => void;
  onOpenNewMember: () => void;
  onOpenNewTest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onOpenNewTask,
  onOpenNewMilestone,
  onOpenNewMember,
  onOpenNewTest,
}) => {
  const isDark = state.theme === 'dark';
  const { stats, project, milestones, tasks, issues, tests, activities } = state;

  const currentMilestone = milestones.find((m) => m.status === 'In Progress') || milestones[0];
  const recentTasks = tasks.slice(0, 5);
  const activeIssues = issues.filter((i) => i.status !== 'Closed' && i.status !== 'Fixed').slice(0, 3);
  const latestTest = tests[0];
  const isBrandNew = stats.totalTasks === 0 && stats.totalMilestones === 0 && stats.totalTeamMembers === 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Passed':
      case 'Fixed':
      case 'Closed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'In Progress':
      case 'Investigating':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      case 'Blocked':
      case 'Failed':
      case 'Critical':
        return isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold'
          : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'Pending':
      case 'Not Started':
      default:
        return isDark
          ? 'bg-slate-800 text-slate-300 border-slate-700 font-semibold'
          : 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

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

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Project Header Banner */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs border uppercase tracking-wider ${getStatusBadge(project.status)}`}>
                Status: {project.status}
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Engineering Project Hub
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {project.name}
            </h1>
            <p className={`text-sm max-w-2xl leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {project.description}
            </p>
          </div>

          {/* Clean Overall Progress Card */}
          <div className={`p-5 rounded-2xl border flex items-center gap-5 flex-shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-center min-w-[80px]">
              <span className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                {stats.overallProgress}%
              </span>
              <span className={`block text-xs font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Progress
              </span>
            </div>
            <div className="w-32 space-y-2">
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-200 border-slate-300'}`}>
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, stats.overallProgress))}%` }}
                />
              </div>
              <div className={`flex justify-between text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>{stats.completedTasks} done</span>
                <span>{stats.totalTasks} total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onboarding / Welcome banner if brand new */}
      {isBrandNew && (
        <div className={`p-6 md:p-7 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/30'
            : 'bg-gradient-to-r from-cyan-50 via-white to-white border-cyan-200 shadow-sm'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${
              isDark ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-cyan-100 border border-cyan-300 text-cyan-800'
            }`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2.5 flex-1">
              <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Welcome to your FOC Drive Project
              </h2>
              <p className={`text-sm leading-relaxed max-w-2xl font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Your project workspace is ready and connected to the persistent database. Start by adding your team members, setting up project milestones, and creating initial tasks.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenNewMember}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Add Team Member</span>
                </button>
                <button
                  onClick={onOpenNewMilestone}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>+ Add Milestone</span>
                </button>
                <button
                  onClick={onOpenNewTask}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>+ Create Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Overview Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Overall Progress</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {stats.overallProgress}%
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Real milestone calc</span>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed Tasks</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {stats.completedTasks}
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Out of {stats.totalTasks} total</span>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Tasks</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
            {stats.activeTasks}
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>In Progress</span>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pending Tasks</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            {stats.pendingTasks}
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Not Started</span>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Open Issues</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${
            stats.openIssues > 0
              ? isDark ? 'text-rose-400' : 'text-rose-700'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {stats.openIssues}
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Unresolved</span>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed Tests</span>
          <span className={`text-2xl md:text-3xl font-extrabold mt-1 block font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            {stats.completedTests}
          </span>
          <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Passed logs</span>
        </div>
      </div>

      {/* 4. Current Milestone & Blockers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Milestone Card (2 Cols) */}
        <div className={`lg:col-span-2 p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Current Milestone Phase
                </h3>
              </div>
              {currentMilestone && (
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadge(currentMilestone.status)}`}>
                  {currentMilestone.status}
                </span>
              )}
            </div>

            {currentMilestone ? (
              <div className="space-y-4">
                <div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {currentMilestone.title}
                  </h4>
                  <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {currentMilestone.description || 'No description provided for this milestone.'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Milestone Progress</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      {currentMilestone.progressPercentage || 0}%
                    </span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-200 border-slate-300'}`}>
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, currentMilestone.progressPercentage || 0))}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-xs font-medium pt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>
                      {currentMilestone.assigned_member_name ? `Lead: ${currentMilestone.assigned_member_name}` : 'Unassigned'}
                    </span>
                    <span>
                      {currentMilestone.due_date ? `Deadline: ${currentMilestone.due_date}` : 'No deadline set'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No active milestones created yet.
                </p>
                <button
                  onClick={onOpenNewMilestone}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Milestone</span>
                </button>
              </div>
            )}
          </div>

          <div className={`pt-4 mt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {milestones.length} total milestone{milestones.length === 1 ? '' : 's'} defined
            </span>
            <button
              onClick={() => onNavigate('roadmap')}
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Issues & Blockers Card (1 Col) */}
        <div className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Issues / Blockers
                </h3>
              </div>
              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activeIssues.length} active
              </span>
            </div>

            {activeIssues.length === 0 ? (
              <div className="py-8 text-center space-y-2.5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No active blockers</h4>
                <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  All systems and tasks are proceeding without critical blockers.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'border-slate-800 bg-slate-950/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold truncate pr-2">
                        {issue.title}
                      </h5>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityBadge(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {issue.description || 'No description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`pt-4 mt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.openIssues} open issue{stats.openIssues === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => onNavigate('issues')}
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Issues</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Current Work (Tasks Table) */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <CheckSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Current Work</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Active and assigned project tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View All ({tasks.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-12 text-center space-y-3.5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              isDark ? 'bg-slate-800 border border-slate-700 text-slate-400' : 'bg-slate-100 border border-slate-300 text-slate-600'
            }`}>
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No tasks added yet</h4>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Add tasks to track engineering items, assign responsibilities, and compute real milestone progress.
            </p>
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider font-bold ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}>
                  <th className="pb-3 pr-4 font-bold">Task</th>
                  <th className="pb-3 pr-4 font-bold">Assigned Member</th>
                  <th className="pb-3 pr-4 font-bold">Category</th>
                  <th className="pb-3 pr-4 font-bold">Priority</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 font-bold">Due Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {recentTasks.map((task) => (
                  <tr key={task.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold">{task.title}</div>
                      {task.milestone_title && (
                        <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Phase: {task.milestone_title}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      {task.assigned_to_name ? (
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={task.assigned_to_name} size="sm" />
                          <span className="font-medium">{task.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span className={`italic text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {task.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs border ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className={`py-3.5 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {task.due_date || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Development Repository, Testing, and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Development Repository Card */}
        <div className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-950/20 border border-slate-300 dark:border-slate-700">
                  <GithubIcon className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                </div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Development Repository
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
              }`}>
                GitHub
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400 truncate max-w-[180px]">
                  Ehna12 / FOC Drive
                </span>
                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {state.gitHubRepo?.defaultBranch || 'main'}
                </span>
              </div>

              <h4 className={`text-sm font-bold leading-snug truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title="Field-Oriented-Control-of-BLDC-motor">
                {state.gitHubRepo?.name || 'Field-Oriented-Control-of-BLDC-motor'}
              </h4>

              <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {state.gitHubCommits[0]?.message || 'Source code, Simulink models, MATLAB scripts, and version history.'}
              </p>

              <div className={`flex items-center justify-between text-xs pt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>{state.simulations.length} Simulink models</span>
                {state.gitHubCommits[0] && (
                  <span>{new Date(state.gitHubCommits[0].authorDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className={`pt-4 mt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => onNavigate('development')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <span>Models Hub</span>
            </button>
            <a
              href={state.gitHubRepo?.htmlUrl || 'https://github.com/Ehna12/Field-Oriented-Control-of-BLDC-motor'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Open Repository</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Testing Summary Card */}
        <div className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Testing & Results
                </h3>
              </div>
              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {tests.length} logged
              </span>
            </div>

            {latestTest ? (
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-cyan-600 dark:text-cyan-400 truncate max-w-[140px]">
                    {latestTest.test_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(latestTest.status)}`}>
                    {latestTest.status}
                  </span>
                </div>
                <h4 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {latestTest.test_name}
                </h4>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {latestTest.observations || latestTest.result || 'No observation notes recorded.'}
                </p>
                <div className={`flex items-center justify-between text-xs pt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{latestTest.date}</span>
                  <span>{latestTest.measurement_count || 0} pts</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                  isDark ? 'bg-slate-800 border border-slate-700 text-slate-400' : 'bg-slate-100 border border-slate-300 text-slate-600'
                }`}>
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No tests uploaded yet</h4>
                <button
                  onClick={onOpenNewTest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Test</span>
                </button>
              </div>
            )}
          </div>

          <div className={`pt-4 mt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.completedTests} passed tests
            </span>
            <button
              onClick={() => onNavigate('testing')}
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Testing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Activity Stream
                </h3>
              </div>
              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Audit Log
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                  isDark ? 'bg-slate-800 border border-slate-700 text-slate-400' : 'bg-slate-100 border border-slate-300 text-slate-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No activity yet</h4>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <UserAvatar name={act.user_name} size="sm" className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className={`leading-relaxed truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <strong className="font-semibold">{act.user_name}</strong>{' '}
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{act.action}</span>
                      </p>
                      <span className={`text-[11px] block font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`pt-4 mt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {activities.length} total events
            </span>
            <button
              onClick={() => onNavigate('activity')}
              className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
