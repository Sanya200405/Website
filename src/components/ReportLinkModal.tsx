import React, { useState, useEffect } from 'react';
import { X, Link2, BookOpen, FlaskConical, FileCode2, FolderGit2, Trash2 } from 'lucide-react';
import type { AppState } from '../services/store';
import { api, type ReportLink } from '../services/api';

interface ReportLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string | null;
  state: AppState;
  onAddLink: (data: { report_section_id: string; entity_type: string; entity_id: string; entity_title: string }) => Promise<any>;
  onDeleteLink: (id: string) => Promise<any>;
  theme?: 'dark' | 'light';
}

export const ReportLinkModal: React.FC<ReportLinkModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  state,
  onAddLink,
  onDeleteLink,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [selectedType, setSelectedType] = useState<'paper' | 'test' | 'simulation' | 'note' | 'document'>('paper');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [existingLinks, setExistingLinks] = useState<ReportLink[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const loadLinks = async () => {
    if (!sectionId) return;
    setIsLoadingLinks(true);
    try {
      const data = await api.getReportLinks(sectionId);
      setExistingLinks(data || []);
    } catch {
      setExistingLinks([]);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (isOpen && sectionId) {
      loadLinks();
    }
  }, [isOpen, sectionId]);

  if (!isOpen || !sectionId) return null;

  const currentSection = state.reportSections.find((s) => s.id === sectionId);

  const getAvailableItems = () => {
    switch (selectedType) {
      case 'paper':
        return state.researchPapers.map((p) => ({ id: p.id, title: p.title }));
      case 'simulation':
        return state.simulations.map((s) => ({ id: s.id, title: `${s.name} (${s.status})` }));
      case 'test':
        return state.tests.map((t) => ({ id: t.id, title: `${t.test_name} (${t.status})` }));
      case 'note':
        return state.engineeringNotes.map((n) => ({ id: n.id, title: n.title }));
      case 'document':
        return state.documents.map((d) => ({ id: d.id, title: `${d.file_name} (${d.type})` }));
      default:
        return [];
    }
  };

  const availableItems = getAvailableItems();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;

    const item = availableItems.find((i) => i.id === selectedEntityId);
    if (!item) return;

    setIsSubmitting(true);
    try {
      await onAddLink({
        report_section_id: sectionId,
        entity_type: selectedType,
        entity_id: item.id,
        entity_title: item.title,
      });
      setSelectedEntityId('');
      await loadLinks();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to attach entity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await onDeleteLink(linkId);
      await loadLinks();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to remove link');
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
            <Link2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Link Project Evidence to Chapter
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentSection?.title || 'Report Section'}
              </p>
            </div>
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

        {/* Existing Attached Links */}
        <div className="space-y-2">
          <label className={labelClass}>
            Currently Attached Evidence ({existingLinks.length})
          </label>
          {isLoadingLinks ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading attached items...</div>
          ) : existingLinks.length === 0 ? (
            <div className={`p-4 rounded-xl border text-center text-xs ${
              isDark ? 'bg-slate-950/50 border-slate-800/80 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              No project items linked to this chapter yet. Attach research, test logs, or notes below.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {existingLinks.map((link: ReportLink) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {link.entity_type === 'research_paper' || (link.entity_type as any) === 'paper' ? (
                      <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    ) : link.entity_type === 'simulation_model' || (link.entity_type as any) === 'simulation' ? (
                      <FileCode2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    ) : link.entity_type === 'test' ? (
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : link.entity_type === 'engineering_note' || (link.entity_type as any) === 'note' ? (
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    ) : (
                      <FolderGit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">{link.entity_title}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className={`p-1 rounded text-rose-500 transition-colors ${
                      isDark ? 'hover:bg-rose-950/50 hover:text-rose-400' : 'hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Link */}
        <form onSubmit={handleAdd} className={`space-y-4 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Type of Item</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as any);
                  setSelectedEntityId('');
                }}
                className={inputClass}
              >
                <option value="paper">Research Paper</option>
                <option value="simulation">Simulink / Model</option>
                <option value="test">Dyno / Test Run</option>
                <option value="note">Engineering Note</option>
                <option value="document">Project Document</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Select Existing Record</label>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose item...</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
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
              Done
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedEntityId}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Linking...' : 'Attach to Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
