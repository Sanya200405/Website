import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import type { IssueItem, TeamMember } from '../services/api';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issue: Partial<IssueItem>) => Promise<any>;
  issue?: IssueItem | null;
  team: TeamMember[];
  theme?: 'dark' | 'light';
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  issue,
  team,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportedById, setReportedById] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<IssueItem['priority']>('Medium');
  const [status, setStatus] = useState<IssueItem['status']>('Open');
  const [subsystem, setSubsystem] = useState('General');
  const [possibleCause, setPossibleCause] = useState('');
  const [solution, setSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '');
      setDescription(issue.description || '');
      setReportedById(issue.reported_by_id || '');
      setAssignedToId(issue.assigned_to_id || '');
      setPriority(issue.priority || 'Medium');
      setStatus(issue.status || 'Open');
      setSubsystem(issue.subsystem || 'General');
      setPossibleCause(issue.possible_cause || '');
      setSolution(issue.solution || '');
    } else {
      setTitle('');
      setDescription('');
      setReportedById(team[0]?.id || '');
      setAssignedToId('');
      setPriority('Medium');
      setStatus('Open');
      setSubsystem('Hardware');
      setPossibleCause('');
      setSolution('');
    }
  }, [issue, isOpen, team]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        reported_by_id: reportedById || undefined,
        assigned_to_id: assignedToId || undefined,
        priority,
        status,
        subsystem,
        possible_cause: possibleCause.trim(),
        solution: solution.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {issue ? 'Edit Blocker / Issue' : 'Report Project Blocker'}
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
            <label className={labelClass}>Issue Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Inverter Phase U shoot-through under inductive load"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Detailed Symptoms & Observations</label>
            <textarea
              rows={3}
              placeholder="What went wrong? Oscilloscope traces, thermal spikes, error codes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Subsystem</label>
              <select
                value={subsystem}
                onChange={(e) => setSubsystem(e.target.value)}
                className={inputClass}
              >
                <option value="Hardware">Hardware</option>
                <option value="Firmware">Firmware</option>
                <option value="FOC Control">FOC Control</option>
                <option value="Gate Driver">Gate Driver</option>
                <option value="Thermal">Thermal</option>
                <option value="Mechanical">Mechanical</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssueItem['priority'])}
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
                onChange={(e) => setStatus(e.target.value as IssueItem['status'])}
                className={inputClass}
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Blocked">Blocked</option>
                <option value="Fixed">Fixed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Reported By</label>
              <select
                value={reportedById}
                onChange={(e) => setReportedById(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Member</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Assigned Lead</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Root Cause Analysis</label>
            <input
              type="text"
              placeholder="e.g. Insufficient dead-time (currently 50ns, needs 150ns) or parasitic gate ringing"
              value={possibleCause}
              onChange={(e) => setPossibleCause(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Resolution / Fix Implemented</label>
            <textarea
              rows={2}
              placeholder="e.g. Increased dead-time register to 200ns and added 4.7 Ohm series gate resistors"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className={inputClass}
            />
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : issue ? 'Update Issue' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
