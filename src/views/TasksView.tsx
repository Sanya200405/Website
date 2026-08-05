import React, { useState } from 'react';
import {
  CheckSquare, Plus, Filter, LayoutGrid, List, CheckCircle2, Trash2
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { Task, TaskStatus } from '../types';

interface TasksViewProps {
  state: AppState;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onOpenNewTask: () => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  onUpdateStatus,
  onOpenNewTask,
  onDeleteTask,
}) => {
  const isDark = state.theme === 'dark';
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'Backlog', title: 'Backlog', color: 'border-slate-700 text-slate-400' },
    { status: 'Not Started', title: 'To Do', color: 'border-sky-500 text-sky-400' },
    { status: 'In Progress', title: 'In Progress', color: 'border-cyan-500 text-cyan-400' },
    { status: 'Blocked', title: 'Blocked', color: 'border-rose-500 text-rose-400' },
    { status: 'Under Review', title: 'Review', color: 'border-amber-500 text-amber-400' },
    { status: 'Completed', title: 'Completed', color: 'border-emerald-500 text-emerald-400' },
  ];

  const filteredTasks = state.tasks.filter(t => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span>Engineering Task Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jira/Trello Kanban workflow tracking hardware, firmware, FOC math, and mechanical tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'kanban' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Category & Priority Filter Bar */}
      <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" /> Filter Category:
          </span>
          {['All', 'Hardware', 'Firmware', 'FOC', 'Mechanical', 'Research', 'Testing'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Priority:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                selectedPriority === p
                  ? 'bg-purple-500 text-white'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
          {columns.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`p-3 rounded-2xl border min-h-[500px] flex flex-col ${
                  isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-100/80 border-slate-200'
                }`}
              >
                {/* Column Header */}
                <div className={`pb-3 border-b border-slate-800 mb-3 flex items-center justify-between ${col.color}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          task.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[9px] text-cyan-400 font-mono">{task.category}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 mb-1 leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      <p className="text-[10px] text-slate-400 line-clamp-2 mb-3">
                        {task.description}
                      </p>

                      {/* Quick Status Advance Button */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <img src={task.assignedToAvatar} alt={task.assignedToName} className="w-4 h-4 rounded-full object-cover" />
                          <span className="truncate max-w-[80px]">{task.assignedToName}</span>
                        </div>
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className="bg-slate-800 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none"
                        >
                          {columns.map(c => (
                            <option key={c.status} value={c.status}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className={`p-4 rounded-2xl border overflow-x-auto ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="pb-3 px-2">Task Title</th>
                <th className="pb-3 px-2">Assignee</th>
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2">Priority</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Deadline</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-100">{task.title}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <img src={task.assignedToAvatar} alt="" className="w-5 h-5 rounded-full" />
                      <span>{task.assignedToName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-cyan-400 font-mono">{task.category}</td>
                  <td className="py-3 px-2 font-bold text-purple-400">{task.priority}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-400 font-mono">{task.deadline}</td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => onDeleteTask(task.id)} className="text-rose-400 hover:text-rose-300 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Drawer Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg h-full rounded-2xl border p-6 overflow-y-auto shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{selectedTask.category}</span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-300 mb-1">Description</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedTask.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] block">Assignee</span>
                  <span className="font-bold text-cyan-300">{selectedTask.assignedToName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Milestone</span>
                  <span className="font-bold text-purple-300">{selectedTask.milestoneTitle || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Est. Effort</span>
                  <span className="font-bold text-slate-200">{selectedTask.estimatedEffortHours} Hours</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Deadline</span>
                  <span className="font-bold text-amber-300">{selectedTask.deadline}</span>
                </div>
              </div>

              {/* Subtask Checklist */}
              {selectedTask.checklist.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-300 mb-2">Checklist Items</h4>
                  <div className="space-y-1.5">
                    {selectedTask.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${item.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
