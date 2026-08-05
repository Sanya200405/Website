import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskPriority, TaskCategory, TaskStatus, User, Milestone } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdDate' | 'lastUpdated'>) => void;
  users: User[];
  milestones: Milestone[];
  isDark: boolean;
  currentUser: User;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users,
  milestones,
  isDark,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || 'u1');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('Hardware');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [milestoneId, setMilestoneId] = useState<string>(milestones[0]?.id || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['FOC', 'BLDC']);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = users.find(u => u.id === assignedToId) || users[0];
    const selectedMilestone = milestones.find(m => m.id === milestoneId);

    onSave({
      title,
      description,
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      assignedToAvatar: assignedUser.avatar,
      priority,
      status,
      category,
      startDate,
      deadline,
      estimatedEffortHours: Number(estimatedHours),
      actualEffortHours: 0,
      milestoneId: selectedMilestone?.id,
      milestoneTitle: selectedMilestone?.title,
      checklist: [],
      comments: [],
      dependencies: [],
      createdBy: currentUser.name,
      tags
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight">Create New Engineering Task</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design Gate Driver Isolation Filter circuit"
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold mb-1">Description & Requirements</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed technical steps, pinouts, or mathematical goals..."
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Row 1: Assignee & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Assign Member</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Subsystem Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {['Hardware', 'Firmware', 'FOC', 'Mechanical', 'Research', 'Testing', 'Documentation', 'Management'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {['Low', 'Medium', 'High', 'Critical'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {['Backlog', 'Not Started', 'In Progress', 'Blocked', 'Under Review', 'Completed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Dates & Effort */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Est. Effort (Hours)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label className="block font-semibold mb-1">Related Milestone</label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="">-- No Milestone --</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag and click +"
                className={`flex-1 px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/30"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 flex items-center gap-1 border border-slate-700">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
