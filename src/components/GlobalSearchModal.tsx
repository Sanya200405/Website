import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Award, FlaskConical, ShieldAlert, FolderGit2, BookOpen, GraduationCap, FileCode2, FileText } from 'lucide-react';
import type { AppState } from '../services/store';
import type { NavSection } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigate: (section: NavSection) => void;
  theme?: 'dark' | 'light';
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigate,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const { tasks, milestones, tests, issues, documents, researchPapers, learningResources, engineeringNotes, reportSections } = state;

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingTasks = q ? tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) : [];
  const matchingMilestones = q ? milestones.filter((m) => m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))) : [];
  const matchingPapers = q ? researchPapers.filter((p) => p.title.toLowerCase().includes(q) || (p.authors && p.authors.toLowerCase().includes(q)) || (p.topic && p.topic.toLowerCase().includes(q))) : [];
  const matchingResources = q ? learningResources.filter((r) => r.title.toLowerCase().includes(q) || (r.topic && r.topic.toLowerCase().includes(q))) : [];
  const matchingNotes = q ? engineeringNotes.filter((n) => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q))) : [];
  const matchingChapters = q ? reportSections.filter((s) => s.title.toLowerCase().includes(q) || (s.content && s.content.toLowerCase().includes(q))) : [];
  const matchingTests = q ? tests.filter((t) => t.test_name.toLowerCase().includes(q) || (t.observations && t.observations.toLowerCase().includes(q))) : [];
  const matchingIssues = q ? issues.filter((i) => i.title.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))) : [];
  const matchingDocs = q ? documents.filter((d) => d.file_name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q))) : [];

  const totalResults =
    matchingTasks.length +
    matchingMilestones.length +
    matchingPapers.length +
    matchingResources.length +
    matchingNotes.length +
    matchingChapters.length +
    matchingTests.length +
    matchingIssues.length +
    matchingDocs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-4 md:p-5 space-y-3.5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="relative flex items-center">
          <Search className={`w-4 h-4 absolute left-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, research papers, notes, report chapters, tests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors absolute right-2.5 ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto space-y-3 pt-1">
          {q && totalResults === 0 ? (
            <div className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No project records matching "{query}"
            </div>
          ) : !q ? (
            <div className={`py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Start typing to search your project database...
            </div>
          ) : (
            <>
              {matchingPapers.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-2 mb-1.5">
                    Research Papers ({matchingPapers.length})
                  </div>
                  {matchingPapers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onNavigate('knowledge');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                        <span className="font-semibold">{p.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.reading_status}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingResources.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 mb-1.5">
                    Learning Resources ({matchingResources.length})
                  </div>
                  {matchingResources.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onNavigate('knowledge');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold">{r.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.resource_type}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingChapters.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 mb-1.5">
                    Report Chapters ({matchingChapters.length})
                  </div>
                  {matchingChapters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onNavigate('report');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="font-semibold">{c.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingNotes.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 mb-1.5">
                    Engineering Notes ({matchingNotes.length})
                  </div>
                  {matchingNotes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        onNavigate('knowledge');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCode2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold">{n.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchingTasks.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-2 mb-1.5">
                    Tasks ({matchingTasks.length})
                  </div>
                  {matchingTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onNavigate('tasks');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                        <span className="font-semibold">{t.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingMilestones.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2 mb-1.5">
                    Milestones ({matchingMilestones.length})
                  </div>
                  {matchingMilestones.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onNavigate('roadmap');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span className="font-semibold">{m.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingTests.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-2 mb-1.5">
                    Testing ({matchingTests.length})
                  </div>
                  {matchingTests.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onNavigate('testing');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FlaskConical className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                        <span className="font-semibold">{t.test_name}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingIssues.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-2 mb-1.5">
                    Issues ({matchingIssues.length})
                  </div>
                  {matchingIssues.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        onNavigate('issues');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                        <span className="font-semibold">{i.title}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i.priority}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingDocs.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 mb-1.5">
                    Documents ({matchingDocs.length})
                  </div>
                  {matchingDocs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onNavigate('knowledge');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderGit2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="font-semibold">{d.file_name}</span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
