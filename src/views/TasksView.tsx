import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Columns,
  List,
  Edit2,
  Trash2,
  Users,
  UserCheck,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { TaskItem } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { ConfirmModal } from '../components/ConfirmModal';
import { AssignmentBreakdownModal } from '../components/AssignmentBreakdownModal';

interface TasksViewProps {
  state: AppState;
  onOpenNewTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onUpdateStatus: (id: string, status: TaskItem['status']) => void;
  onUpdateMemberStatus?: (taskId: string, status: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  onOpenNewTask,
  onEditTask,
  onUpdateStatus,
  onUpdateMemberStatus,
  onDeleteTask,
}) => {
  const isDark = state.theme === 'dark';
  const { tasks, team, currentUser } = state;

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

  const [selectedBreakdownTask, setSelectedBreakdownTask] = useState<TaskItem | null>(null);

  const confirmDeleteTask = (task: TaskItem) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Task to Trash?',
      message: `Are you sure you want to move "${task.title}" to the Trash Vault?`,
      onConfirm: () => {
        onDeleteTask(task.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState<boolean>(false);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.milestone_title && t.milestone_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    // Check if task is assigned to current user
    const isAssignedToCurrentUser = Boolean(
      t.is_all_members ||
      (currentUser && t.assigned_to_id === currentUser.id) ||
      (currentUser && t.assigned_member_ids?.includes(currentUser.id)) ||
      (currentUser && t.assignments?.some((a) => a.member_id === currentUser.id))
    );

    if (onlyAssignedToMe && !isAssignedToCurrentUser) {
      return false;
    }

    let matchesAssignee = true;
    if (assigneeFilter === 'me') {
      matchesAssignee = isAssignedToCurrentUser;
    } else if (assigneeFilter !== 'all') {
      matchesAssignee = Boolean(
        t.is_all_members ||
        t.assigned_to_id === assigneeFilter ||
        t.assigned_member_ids?.includes(assigneeFilter) ||
        t.assignments?.some((a) => a.member_id === assigneeFilter)
      );
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const columns: { status: TaskItem['status']; title: string; color: string; dotColor: string }[] = [
    {
      status: 'Not Started',
      title: 'Not Started',
      color: isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-slate-100/70',
      dotColor: 'bg-slate-500',
    },
    {
      status: 'In Progress',
      title: 'In Progress',
      color: isDark ? 'border-sky-500/30 bg-sky-950/20' : 'border-sky-300 bg-sky-50/70',
      dotColor: 'bg-sky-500',
    },
    {
      status: 'Blocked',
      title: 'Blocked',
      color: isDark ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-300 bg-rose-50/70',
      dotColor: 'bg-rose-500',
    },
    {
      status: 'Completed',
      title: 'Completed',
      color: isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-300 bg-emerald-50/70',
      dotColor: 'bg-emerald-500',
    },
  ];

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
      case 'Completed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'In Progress':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      case 'Blocked':
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

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const filterSelectClass = `px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
  }`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <CheckSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Tasks Management
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Organize, assign, and track engineering tasks across hardware, firmware, mechanical, and testing.
            </p>
          </div>
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, Filters & View Mode */}
      <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${cardBgClass}`}>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search tasks by title, milestone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Quick "Assigned to Me" Filter */}
          <button
            type="button"
            onClick={() => setOnlyAssignedToMe((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              onlyAssignedToMe
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assigned to Me</span>
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
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

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="all">All Assignees</option>
            <option value="me">★ Assigned to Me</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className={`flex items-center gap-1 border p-1 rounded-xl self-start md:self-auto ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-300 bg-slate-100'
        }`}>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'board'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Board View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Table View"
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Main Tasks Content */}
      {filteredTasks.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isDark ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-cyan-100 border border-cyan-300 text-cyan-800'
          }`}>
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {tasks.length === 0 ? 'No tasks added yet' : 'No matching tasks found'}
            </h3>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {tasks.length === 0
                ? 'Create engineering tasks to assign members, link milestones, and track deadlines.'
                : 'Try adjusting your search query or filters to find what you are looking for.'}
            </p>
          </div>
          {tasks.length === 0 && (
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`p-4 rounded-2xl border ${col.color} min-h-[420px] flex flex-col space-y-3.5`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {col.title}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-800 border-slate-300 shadow-sm'
                  }`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Tasks */}
                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => {
                    const isAll = Boolean(task.is_all_members);
                    const hasMultiAssignees = isAll || (task.assignments && task.assignments.length > 1);
                    const myAssignment = currentUser ? task.assignments?.find((a) => a.member_id === currentUser.id) : null;
                    const myPersonalStatus = myAssignment?.status || task.status;
                    const isUserAssigned = Boolean(
                      isAll ||
                      myAssignment ||
                      (currentUser && task.assigned_to_id === currentUser.id) ||
                      (currentUser && task.assigned_member_ids?.includes(currentUser.id))
                    );

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditTask(task)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDeleteTask(task)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className={`text-sm font-semibold mb-1 leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {task.description}
                          </p>
                        )}

                        {task.milestone_title && (
                          <div className={`text-xs font-semibold truncate mb-2.5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                            ◈ {task.milestone_title}
                          </div>
                        )}

                        {/* Assignee display & Progress Breakdown Trigger */}
                        <div className={`pt-2.5 border-t space-y-2 text-xs font-medium ${
                          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            {hasMultiAssignees ? (
                              <button
                                type="button"
                                onClick={() => setSelectedBreakdownTask(task)}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                  isDark
                                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                                }`}
                                title="Click to view individual member progress"
                              >
                                <Users className="w-3.5 h-3.5 text-cyan-500" />
                                <span>{isAll ? 'All Members' : `${task.assignments?.length || task.assigned_member_ids?.length || 0} Members`}</span>
                                <span className="font-mono text-[11px] font-bold">
                                  ({task.completed_assignments_count || 0}/{task.total_assignments_count || (isAll ? team.length : (task.assignments?.length || 1))})
                                </span>
                              </button>
                            ) : task.assigned_to_name ? (
                              <div className="flex items-center gap-2">
                                <UserAvatar name={task.assigned_to_name} size="sm" />
                                <span className={`truncate max-w-[100px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                  {task.assigned_to_name}
                                </span>
                              </div>
                            ) : (
                              <span className={`italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Unassigned</span>
                            )}
                            <span className="font-mono">{task.due_date || 'No date'}</span>
                          </div>

                          {/* Mini Progress Bar for Shared Tasks */}
                          {hasMultiAssignees && (
                            <div
                              onClick={() => setSelectedBreakdownTask(task)}
                              className="w-full bg-slate-700/20 h-1.5 rounded-full overflow-hidden cursor-pointer"
                              title="Click for breakdown"
                            >
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.round(
                                    ((task.completed_assignments_count || 0) /
                                      (task.total_assignments_count || (isAll ? team.length : 1))) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Individual "My Status" Toggle & Task Status Mover */}
                        <div className={`mt-3 pt-2.5 border-t space-y-2 ${
                          isDark ? 'border-slate-800/60' : 'border-slate-100'
                        }`}>
                          {isUserAssigned && hasMultiAssignees && (
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                <UserCheck className="w-3 h-3" />
                                <span>My Status:</span>
                              </span>
                              <select
                                value={myPersonalStatus}
                                onChange={(e) => {
                                  if (onUpdateMemberStatus) {
                                    onUpdateMemberStatus(task.id, e.target.value);
                                  } else {
                                    onUpdateStatus(task.id, e.target.value as TaskItem['status']);
                                  }
                                }}
                                className={`text-xs rounded-lg px-2 py-0.5 border font-semibold focus:outline-none ${getStatusBadge(myPersonalStatus)}`}
                              >
                                <option value="Not Started" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Not Started</option>
                                <option value="In Progress" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>In Progress</option>
                                <option value="Blocked" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Blocked</option>
                                <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Completed</option>
                              </select>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              {hasMultiAssignees ? 'Task Status:' : 'Move:'}
                            </span>
                            <select
                              value={task.status}
                              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskItem['status'])}
                              className={`text-xs rounded-lg px-2 py-1 border focus:outline-none font-medium ${
                                isDark ? 'bg-slate-950 text-slate-200 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-300'
                              }`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Blocked">Blocked</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className={`p-6 md:p-7 rounded-2xl border ${cardBgClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider font-bold ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}>
                  <th className="pb-3 pr-4 font-bold">Task</th>
                  <th className="pb-3 pr-4 font-bold">Phase</th>
                  <th className="pb-3 pr-4 font-bold">Assigned Member(s)</th>
                  <th className="pb-3 pr-4 font-bold">Category</th>
                  <th className="pb-3 pr-4 font-bold">Priority</th>
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 pr-4 font-bold">Due Date</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {filteredTasks.map((task) => {
                  const isAll = Boolean(task.is_all_members);
                  const hasMultiAssignees = isAll || (task.assignments && task.assignments.length > 1);
                  const myAssignment = currentUser ? task.assignments?.find((a) => a.member_id === currentUser.id) : null;
                  const myPersonalStatus = myAssignment?.status || task.status;
                  const isUserAssigned = Boolean(
                    isAll ||
                    myAssignment ||
                    (currentUser && task.assigned_to_id === currentUser.id) ||
                    (currentUser && task.assigned_member_ids?.includes(currentUser.id))
                  );

                  return (
                    <tr key={task.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold">{task.title}</div>
                        {task.description && (
                          <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className={`py-3.5 pr-4 text-xs font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        {task.milestone_title || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        {hasMultiAssignees ? (
                          <button
                            type="button"
                            onClick={() => setSelectedBreakdownTask(task)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              isDark
                                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                                : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                            }`}
                            title="Click to view progress breakdown"
                          >
                            <Users className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{isAll ? 'All Members' : `${task.assignments?.length || task.assigned_member_ids?.length || 0} Members`}</span>
                            <span className="font-mono text-[11px] font-bold">
                              ({task.completed_assignments_count || 0}/{task.total_assignments_count || (isAll ? team.length : (task.assignments?.length || 1))})
                            </span>
                          </button>
                        ) : task.assigned_to_name ? (
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
                        <div className="space-y-1.5">
                          {isUserAssigned && hasMultiAssignees && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-cyan-500 font-bold">Mine:</span>
                              <select
                                value={myPersonalStatus}
                                onChange={(e) => {
                                  if (onUpdateMemberStatus) {
                                    onUpdateMemberStatus(task.id, e.target.value);
                                  } else {
                                    onUpdateStatus(task.id, e.target.value as TaskItem['status']);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-md text-xs font-semibold border focus:outline-none ${getStatusBadge(myPersonalStatus)}`}
                              >
                                <option value="Not Started" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Not Started</option>
                                <option value="In Progress" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>In Progress</option>
                                <option value="Blocked" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Blocked</option>
                                <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Completed</option>
                              </select>
                            </div>
                          )}
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskItem['status'])}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border focus:outline-none ${getStatusBadge(task.status)}`}
                          >
                            <option value="Not Started" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Not Started</option>
                            <option value="In Progress" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>In Progress</option>
                            <option value="Blocked" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Blocked</option>
                            <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Completed</option>
                          </select>
                        </div>
                      </td>
                      <td className={`py-3.5 pr-4 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.due_date || '—'}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditTask(task)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => confirmDeleteTask(task)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Breakdown Modal */}
      {selectedBreakdownTask && (
        <AssignmentBreakdownModal
          isOpen={Boolean(selectedBreakdownTask)}
          onClose={() => setSelectedBreakdownTask(null)}
          title={selectedBreakdownTask.title}
          itemType="task"
          assignments={selectedBreakdownTask.assignments}
          isAllMembers={Boolean(selectedBreakdownTask.is_all_members)}
          team={team}
          theme={state.theme}
        />
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
