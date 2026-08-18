import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Users, UserCheck } from 'lucide-react';
import type { TaskItem, TeamMember, MilestoneItem } from '../services/api';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TaskItem>) => Promise<any>;
  task?: TaskItem | null;
  team: TeamMember[];
  milestones: MilestoneItem[];
  theme?: 'dark' | 'light';
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  team,
  milestones,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAllMembers, setIsAllMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [milestoneId, setMilestoneId] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('Not Started');
  const [priority, setPriority] = useState<TaskItem['priority']>('Medium');
  const [category, setCategory] = useState('Hardware');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setIsAllMembers(Boolean(task.is_all_members));
      if (task.is_all_members) {
        setSelectedMemberIds(team.map((m) => m.id));
      } else if (task.assigned_member_ids && task.assigned_member_ids.length > 0) {
        setSelectedMemberIds(task.assigned_member_ids);
      } else if (task.assigned_to_id) {
        setSelectedMemberIds([task.assigned_to_id]);
      } else {
        setSelectedMemberIds([]);
      }
      setMilestoneId(task.milestone_id || '');
      setStatus(task.status || 'Not Started');
      setPriority(task.priority || 'Medium');
      setCategory(task.category || 'Hardware');
      setStartDate(task.start_date || '');
      setDueDate(task.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setIsAllMembers(false);
      setSelectedMemberIds(team[0] ? [team[0].id] : []);
      setMilestoneId(milestones[0]?.id || '');
      setStatus('Not Started');
      setPriority('Medium');
      setCategory('Hardware');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
    }
  }, [task, isOpen, team, milestones]);

  if (!isOpen) return null;

  const toggleMemberSelection = (memberId: string) => {
    if (isAllMembers) {
      setIsAllMembers(false);
      setSelectedMemberIds([memberId]);
      return;
    }
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAllMembersToggle = (checked: boolean) => {
    setIsAllMembers(checked);
    if (checked) {
      setSelectedMemberIds(team.map((m) => m.id));
    } else {
      setSelectedMemberIds(team[0] ? [team[0].id] : []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        is_all_members: isAllMembers,
        assigned_member_ids: isAllMembers ? team.map((m) => m.id) : selectedMemberIds,
        assigned_to_id: !isAllMembers && selectedMemberIds.length === 1 ? selectedMemberIds[0] : undefined,
        milestone_id: milestoneId || undefined,
        status,
        priority,
        category,
        start_date: startDate,
        due_date: dueDate,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 my-8 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className={labelClass}>Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Design 3-phase inverter MOSFET gate driver stage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              placeholder="Add engineering details, pinouts, test procedures, or specs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Member Assignment Section */}
          <div className={`p-3.5 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <input
                  type="checkbox"
                  id="task-assign-all"
                  checked={isAllMembers}
                  onChange={(e) => handleAllMembersToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <Users className="w-4 h-4 text-cyan-500" />
                <span>Assign to all team members</span>
              </label>

              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isAllMembers
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400'
              }`}>
                {isAllMembers ? `All (${team.length}) assigned` : `${selectedMemberIds.length} selected`}
              </span>
            </div>

            {/* Individual member selection pills */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-400">
                {isAllMembers
                  ? 'Every current member will track their own completion status independently.'
                  : 'Select one or more members to assign:'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {team.map((m) => {
                  const isSelected = isAllMembers || selectedMemberIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleMemberSelection(m.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                            : 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-sm'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <UserCheck className="w-3 h-3 text-cyan-500" />}
                      <span>{m.name}</span>
                      <span className="text-[10px] opacity-60">({m.role})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Milestone</label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className={inputClass}
            >
              <option value="">No Milestone Linked</option>
              {milestones.map((ms) => (
                <option key={ms.id} value={ms.id}>
                  {ms.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="Hardware">Hardware</option>
                <option value="Firmware">Firmware</option>
                <option value="FOC Control">FOC Control</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Testing">Testing</option>
                <option value="Documentation">Documentation</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskItem['status'])}
                className={inputClass}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className={`flex items-center justify-end gap-2.5 pt-3.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
