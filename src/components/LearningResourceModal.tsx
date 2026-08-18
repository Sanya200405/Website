import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Users, UserCheck } from 'lucide-react';
import type { LearningResource, TeamMember } from '../services/api';

interface LearningResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Partial<LearningResource>) => Promise<any>;
  resource?: LearningResource | null;
  team?: TeamMember[];
  theme?: 'dark' | 'light';
}

export const LearningResourceModal: React.FC<LearningResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resource,
  team = [],
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState<LearningResource['resource_type']>('Video');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [isAllMembers, setIsAllMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '');
      setUrl(resource.url || '');
      setResourceType(resource.resource_type || 'Video');
      setTopic(resource.topic || '');
      setDescription(resource.description || '');
      setTags(resource.tags || '');
      setNotes(resource.notes || '');
      setIsAllMembers(Boolean(resource.is_all_members));
      if (resource.is_all_members) {
        setSelectedMemberIds(team.map((m) => m.id));
      } else if (resource.assigned_member_ids && resource.assigned_member_ids.length > 0) {
        setSelectedMemberIds(resource.assigned_member_ids);
      } else {
        setSelectedMemberIds([]);
      }
      setDueDate(resource.due_date || '');
      setInstructions(resource.instructions || '');
    } else {
      setTitle('');
      setUrl('');
      setResourceType('Video');
      setTopic('');
      setDescription('');
      setTags('');
      setNotes('');
      setIsAllMembers(false);
      setSelectedMemberIds([]);
      setDueDate('');
      setInstructions('');
    }
  }, [resource, isOpen, team]);

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
      setSelectedMemberIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const assignedIds = isAllMembers ? team.map((m) => m.id) : selectedMemberIds;
      await onSave({
        title: title.trim(),
        url: url.trim(),
        resource_type: resourceType,
        topic: topic.trim(),
        description: description.trim(),
        tags: tags.trim(),
        notes: notes.trim(),
        is_all_members: isAllMembers,
        assigned_member_ids: assignedIds,
        due_date: dueDate,
        instructions: instructions.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save resource');
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
            <GraduationCap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {resource ? 'Edit Learning Resource' : 'Add Learning Resource'}
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
            <label className={labelClass}>Resource Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. TI Precision Labs: Motor Drivers & Gate Drivers Series"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Resource Link / URL *</label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... or https://ti.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as any)}
                className={inputClass}
              >
                <option value="Video">Video</option>
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Course">Course</option>
                <option value="Article">Article</option>
                <option value="Book">Book</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Topic</label>
              <input
                type="text"
                placeholder="e.g. Inverter Layout, FOC Math"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Assignment Section */}
          <div className={`p-3.5 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <input
                  type="checkbox"
                  id="res-assign-all"
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
                {isAllMembers ? `All (${team.length}) assigned` : `${selectedMemberIds.length} assigned`}
              </span>
            </div>

            {/* Member selection pills */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-400">
                {isAllMembers
                  ? 'Assigned to all members. Each member tracks their reading/watching status independently.'
                  : 'Select specific members to assign (optional):'}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
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
                            ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-sm'
                            : 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-sm'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <UserCheck className="w-3 h-3 text-cyan-500" />}
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className={labelClass}>Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Watch videos 3-5 before next sprint"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Description / Overview</label>
            <textarea
              rows={2}
              placeholder="Brief summary of the course or lecture contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Gate Driver, Bootstrap, Thermal"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : resource ? 'Save Changes' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
