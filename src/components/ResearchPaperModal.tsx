import React, { useState, useEffect } from 'react';
import { X, BookOpen, Upload } from 'lucide-react';
import type { ResearchPaper } from '../services/api';

interface ResearchPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveManual: (paper: Partial<ResearchPaper>) => Promise<any>;
  onUploadPdf: (formData: FormData) => Promise<any>;
  paper?: ResearchPaper | null;
  theme?: 'dark' | 'light';
}

export const ResearchPaperModal: React.FC<ResearchPaperModalProps> = ({
  isOpen,
  onClose,
  onSaveManual,
  onUploadPdf,
  paper,
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
      setPdfFile(null);
    }
  }, [paper, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (pdfFile && !paper) {
        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
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

          {!paper && (
            <div className={`space-y-2 p-4 rounded-xl border border-dashed text-center ${
              isDark
                ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
                : 'border-cyan-400 bg-cyan-50 text-cyan-900'
            }`}>
              <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
              <div>
                <label className={`font-bold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {pdfFile ? pdfFile.name : 'Optional: Attach Paper PDF'}
                </label>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  PDF document will be saved directly to server storage
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
              />
            </div>
          )}

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
