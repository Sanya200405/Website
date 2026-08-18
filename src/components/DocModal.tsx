import React, { useState } from 'react';
import { X, FolderGit2, Upload, Users, UserCheck } from 'lucide-react';
import type { TeamMember } from '../services/api';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<any>;
  team: TeamMember[];
  theme?: 'dark' | 'light';
}

export const DocModal: React.FC<DocModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  team,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('Datasheet');
  const [description, setDescription] = useState('');
  const [uploadedById, setUploadedById] = useState(team[0]?.id || '');
  const [isAllMembers, setIsAllMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedIds = isAllMembers ? team.map((m) => m.id) : selectedMemberIds;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('uploaded_by_id', uploadedById);
      formData.append('is_all_members', isAllMembers ? 'true' : 'false');
      formData.append('assigned_member_ids', JSON.stringify(assignedIds));
      formData.append('due_date', dueDate);
      formData.append('instructions', instructions.trim());

      await onUpload(formData);
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
            <FolderGit2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Upload Project Document
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
          <div className={`space-y-2 p-4 rounded-xl border border-dashed text-center ${
            isDark
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
              : 'border-cyan-400 bg-cyan-50 text-cyan-900'
          }`}>
            <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
            <div>
              <label className={`font-bold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {file ? file.name : 'Select File to Upload'}
              </label>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                PDFs, Gerbers, CAD models, schematics, CSV, images (Max 50MB)
              </p>
            </div>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Document Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClass}
              >
                <option value="Datasheet">Datasheet</option>
                <option value="Schematic">Schematic</option>
                <option value="PCB Layout">PCB Layout</option>
                <option value="Firmware">Firmware</option>
                <option value="CAD Model">CAD Model</option>
                <option value="Test Report">Test Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Uploaded By</label>
              <select
                value={uploadedById}
                onChange={(e) => setUploadedById(e.target.value)}
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
                  id="doc-assign-all"
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
                  ? 'Assigned to all members. Each member tracks their reading/review status independently.'
                  : 'Select specific members to assign for review (optional):'}
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
                  placeholder="e.g. Verify pinout against MCU datasheet"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Texas Instruments DRV8301 datasheet with SPI configuration notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
