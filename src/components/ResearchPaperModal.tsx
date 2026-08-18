import React, { useState, useEffect } from 'react';
import { X, BookOpen, Users, UserCheck, Upload } from 'lucide-react';
import type { ResearchPaper, TeamMember } from '../services/api';

interface ResearchPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveManual: (paper: Partial<ResearchPaper>) => Promise<any>;
  onUploadPdf: (formData: FormData) => Promise<any>;
  paper?: ResearchPaper | null;
  team?: TeamMember[];
  theme?: 'dark' | 'light';
}

export const ResearchPaperModal: React.FC<ResearchPaperModalProps> = ({
  isOpen,
  onClose,
  onSaveManual,
  onUploadPdf,
  paper,
  team = [],
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [journalConference, setJournalConference] = useState('');
  const [doi, setDoi] = useState('');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [readingStatus, setReadingStatus] = useState<'Unread' | 'Reading' | 'Completed'>('Unread');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isAllMembers, setIsAllMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (paper) {
      setTitle(paper.title || '');
      setAuthors(paper.authors || '');
      setYear(paper.year ? String(paper.year) : '');
      setJournalConference(paper.journal_conference || '');
      setDoi(paper.doi || '');
      setUrl(paper.url || '');
      setTopic(paper.topic || '');
      setTags(paper.tags || '');
      setSummary(paper.summary || '');
      setNotes(paper.notes || '');
      setReadingStatus(paper.reading_status || 'Unread');
      setIsAllMembers(Boolean(paper.is_all_members));
      if (paper.is_all_members) {
        setSelectedMemberIds(team.map((m) => m.id));
      } else if (paper.assigned_member_ids && paper.assigned_member_ids.length > 0) {
        setSelectedMemberIds(paper.assigned_member_ids);
      } else {
        setSelectedMemberIds([]);
      }
      setDueDate(paper.due_date || '');
      setInstructions(paper.instructions || '');
      setPdfFile(null);
    } else {
      setTitle('');
      setAuthors('');
      setYear(new Date().getFullYear().toString());
      setJournalConference('');
      setDoi('');
      setUrl('');
      setTopic('FOC Motor Control');
      setTags('');
      setSummary('');
      setNotes('');
      setReadingStatus('Unread');
      setIsAllMembers(false);
      setSelectedMemberIds([]);
      setDueDate('');
      setInstructions('');
      setPdfFile(null);
    }
  }, [paper, isOpen, team]);

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
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const assignedIds = isAllMembers ? team.map((m) => m.id) : selectedMemberIds;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
        if (paper?.id) {
          formData.append('id', paper.id);
        }
        formData.append('title', title.trim());
        formData.append('authors', authors.trim());
        formData.append('year', year);
        formData.append('journal_conference', journalConference.trim());
        formData.append('doi', doi.trim());
        formData.append('url', url.trim());
        formData.append('topic', topic.trim());
        formData.append('tags', tags.trim());
        formData.append('summary', summary.trim());
        formData.append('notes', notes.trim());
        formData.append('reading_status', readingStatus);
        formData.append('is_all_members', isAllMembers ? 'true' : 'false');
        formData.append('assigned_member_ids', JSON.stringify(assignedIds));
        formData.append('due_date', dueDate);
        formData.append('instructions', instructions.trim());
        await onUploadPdf(formData);
      } else {
        await onSaveManual({
          title: title.trim(),
          authors: authors.trim(),
          year: year ? parseInt(year) : null,
          journal_conference: journalConference.trim(),
          doi: doi.trim(),
          url: url.trim(),
          topic: topic.trim(),
          tags: tags.trim(),
          summary: summary.trim(),
          notes: notes.trim(),
          reading_status: readingStatus,
          is_all_members: isAllMembers,
          assigned_member_ids: assignedIds,
          due_date: dueDate,
          instructions: instructions.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save research paper');
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
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {paper ? 'Edit Research Paper' : 'Add Research Paper'}
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
            <label className={labelClass}>Paper Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Field Oriented Control of Permanent Magnet Synchronous Motors..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Authors</label>
              <input
                type="text"
                placeholder="e.g. J. Doe, A. Smith, R. Kumar"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className={labelClass}>Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Reading Status</label>
                <select
                  value={readingStatus}
                  onChange={(e) => setReadingStatus(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="Unread">Unread</option>
                  <option value="Reading">Reading</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Journal / Conference</label>
              <input
                type="text"
                placeholder="e.g. IEEE Transactions on Power Electronics"
                value={journalConference}
                onChange={(e) => setJournalConference(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Topic Area</label>
              <input
                type="text"
                placeholder="e.g. SVPWM Inverter, Sensorless Estimator, Thermal Design"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>DOI</label>
              <input
                type="text"
                placeholder="10.1109/TPEL.2023.1234567"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>URL / Link</label>
              <input
                type="url"
                placeholder="https://ieeexplore.ieee.org/document/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className={`space-y-2 p-4 rounded-xl border border-dashed text-center ${
            isDark
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
              : 'border-cyan-400 bg-cyan-50 text-cyan-900'
          }`}>
            <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
            <div>
              <label className={`font-bold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {pdfFile
                  ? `Selected PDF: ${pdfFile.name}`
                  : paper?.pdf_name
                  ? `Current PDF: ${paper.pdf_name} (Click below to replace)`
                  : 'Optional: Attach Paper PDF'}
              </label>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {paper?.pdf_name && !pdfFile
                  ? 'Attached PDF is active. Choose a new PDF to overwrite it.'
                  : 'PDF document will be saved directly to server storage and linked to this paper'}
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
            />
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
                  id="paper-assign-all"
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
                  ? 'Assigned to all members. Each member tracks their reading status independently.'
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
                <label className={labelClass}>Reading Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Reading Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Focus on Section III & IV for inverter topology"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Summary & Key Takeaways</label>
            <textarea
              rows={2}
              placeholder="Key insights, algorithmic contributions, or findings relevant to our planetary FOC drive..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. SVPWM, Dead-time, Current Sensing, DRV8301"
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : paper ? 'Save Changes' : 'Add Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
