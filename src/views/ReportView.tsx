import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Download,
  Link2,
  CheckCircle2,
  Clock,
  User,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Search,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { ReportSection } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface ReportViewProps {
  state: AppState;
  onAddSection: (data: Partial<ReportSection>) => Promise<any>;
  onUpdateSection: (id: string, data: Partial<ReportSection>) => Promise<any>;
  onDeleteSection: (id: string) => Promise<any>;
  onOpenLinkModal: (sectionId: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  state,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onOpenLinkModal,
}) => {
  const isDark = state.theme === 'dark';
  const { reportSections, currentUser } = state;

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorStatus, setEditorStatus] = useState<'Draft' | 'In Review' | 'Completed'>('Draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set initial selected section
  useEffect(() => {
    if (reportSections.length > 0) {
      if (!selectedSectionId || !reportSections.find((s) => s.id === selectedSectionId)) {
        const first = reportSections[0];
        setSelectedSectionId(first.id);
        setEditorTitle(first.title);
        setEditorContent(first.content || '');
        setEditorStatus(first.status || 'Draft');
      }
    } else {
      setSelectedSectionId(null);
      setEditorTitle('');
      setEditorContent('');
    }
  }, [reportSections, selectedSectionId]);

  const currentSection = reportSections.find((s) => s.id === selectedSectionId);

  const handleSelectSection = (sec: ReportSection) => {
    setSelectedSectionId(sec.id);
    setEditorTitle(sec.title);
    setEditorContent(sec.content || '');
    setEditorStatus(sec.status || 'Draft');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;
    setIsSaving(true);
    try {
      await onUpdateSection(selectedSectionId, {
        title: editorTitle,
        content: editorContent,
        status: editorStatus,
        last_edited_by_id: currentUser?.id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save report section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewSection = async () => {
    const title = prompt('Enter new chapter/section title:');
    if (!title || title.trim().length === 0) return;

    try {
      const newSec = await onAddSection({
        title: title.trim(),
        content: '',
        status: 'Draft',
        last_edited_by_id: currentUser?.id,
      });
      if (newSec?.id) {
        setSelectedSectionId(newSec.id);
        setEditorTitle(newSec.title);
        setEditorContent('');
        setEditorStatus('Draft');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create new chapter');
    }
  };

  const handleExportDocx = async () => {
    if (reportSections.length === 0) {
      alert('Please add at least one report section before exporting.');
      return;
    }
    setIsExporting(true);
    try {
      const token = localStorage.getItem('foc_drive_token');
      const response = await fetch('/api/report/export-docx', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FOC_Drive_Project_Report_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Word (.DOCX) report export');
    } finally {
      setIsExporting(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const nextContent = text.substring(0, start) + replacement + text.substring(end);
    setEditorContent(nextContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const filteredSections = reportSections.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const confirmDeleteSection = (sec: ReportSection) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Chapter to Trash?',
      message: `Are you sure you want to move chapter "${sec.title}" to the Trash Vault? It can be restored at any time.`,
      onConfirm: async () => {
        await onDeleteSection(sec.id);
        if (selectedSectionId === sec.id) {
          setSelectedSectionId(null);
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Collaborative Project Report
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Distraction-free document workspace with native Microsoft Word (.DOCX) export.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleCreateNewSection}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>

            <button
              onClick={handleExportDocx}
              disabled={isExporting || reportSections.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
              title="Download full project report formatted as Microsoft Word .docx"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating .DOCX...' : 'Export Report (.DOCX)'}</span>
            </button>
          </div>
        </div>
      </div>

      {reportSections.length === 0 ? (
        <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-lg font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            No report chapters created yet
          </h3>
          <p className={`text-sm max-w-md mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            Create chapters such as Executive Summary, Motor & Gearing Requirements, Inverter Topology, FOC Firmware, and Dyno Test Results to begin writing your report.
          </p>
          <button
            onClick={handleCreateNewSection}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Chapter</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chapter Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className={`p-4 md:p-5 rounded-2xl border ${cardBgClass}`}>
              <div className="flex items-center justify-between mb-3.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  Chapters ({reportSections.length})
                </span>
                <button
                  onClick={handleCreateNewSection}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Add Section"
                >
                  <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Chapters List */}
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredSections.map((sec, idx) => {
                  const isSelected = sec.id === selectedSectionId;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleSelectSection(sec)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-cyan-50 text-cyan-900 border border-cyan-300'
                          : isDark
                          ? 'hover:bg-slate-800/60 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <span className="opacity-60 mr-1.5">{idx + 1}.</span>
                        <span className="truncate">{sec.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold flex-shrink-0 ${
                          sec.status === 'Completed'
                            ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                            : sec.status === 'In Review'
                            ? isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-800'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {sec.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Export Summary Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>DOCX Ready Format</span>
              </div>
              <p className="text-xs leading-relaxed">
                Markdown headings (`#`, `##`), bullet lists (`-`), tables, and linked project references are automatically parsed into Microsoft Word styles when exported.
              </p>
            </div>
          </div>

          {/* Main Word/Docs Editor Canvas */}
          <div className="lg:col-span-9 space-y-3">
            {currentSection && (
              <div className={`rounded-2xl border shadow-xl flex flex-col ${cardBgClass}`}>
                {/* Editor Header Bar */}
                <div className={`p-4 md:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className={`text-lg md:text-xl font-bold w-full bg-transparent border-b border-transparent hover:border-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                      placeholder="Chapter Title..."
                    />
                    <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Updated {new Date(currentSection.updated_at).toLocaleTimeString()}
                      </span>
                      {currentSection.last_edited_by_name && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          By {currentSection.last_edited_by_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={editorStatus}
                      onChange={(e) => setEditorStatus(e.target.value as any)}
                      className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none font-semibold ${
                        editorStatus === 'Completed'
                          ? isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      onClick={() => onOpenLinkModal(currentSection.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                        isDark ? 'border-slate-700 hover:bg-slate-800 text-cyan-400' : 'border-slate-300 hover:bg-slate-100 text-cyan-700'
                      }`}
                      title="Link Research Paper, Dyno Test, or Document to this Chapter"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link Evidence</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => confirmDeleteSection(currentSection)}
                      className={`p-2 rounded-xl transition-colors ${
                        isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                      }`}
                      title="Move Chapter to Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rich Formatting Toolbar */}
                <div className={`px-4 py-2.5 border-b flex flex-wrap items-center gap-1.5 text-xs ${
                  isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}>
                  <button
                    onClick={() => insertFormatting('# ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('## ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('### ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>

                  <div className={`w-[1px] h-4 mx-1.5 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

                  <button
                    onClick={() => insertFormatting('**', '**')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('*', '*')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <div className={`w-[1px] h-4 mx-1.5 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

                  <button
                    onClick={() => insertFormatting('- ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('1. ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('> ', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('| Parameter | Value |\n|---|---|\n| Supply Voltage | 24V |\n', '')}
                    className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-cyan-500/20 hover:text-cyan-400' : 'hover:bg-cyan-100 hover:text-cyan-800'}`}
                    title="Insert Markdown Table"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Text Area Canvas */}
                <div className="p-4 md:p-6 flex-1 min-h-[460px]">
                  <textarea
                    ref={textareaRef}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Write chapter content here using clean markdown or formatting toolbar..."
                    className={`w-full h-full min-h-[420px] p-4 font-mono text-sm leading-relaxed rounded-xl border focus:outline-none resize-y transition-colors ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-cyan-500/50'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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
