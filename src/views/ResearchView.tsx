import React, { useState } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import type { AppState } from '../services/store';
import type { ResearchEntry } from '../types';

export const ResearchView: React.FC<{
  state: AppState;
  onAddResearch: (res: Omit<ResearchEntry, 'id' | 'addedDate'>) => void;
}> = ({ state, onAddResearch }) => {
  const isDark = state.theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);

  const [topic, setTopic] = useState('FOC Current Control');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('TI App Note');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [importantFindings, setImportantFindings] = useState('');
  const [applicationToProject, setApplicationToProject] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddResearch({
      topic,
      title,
      source,
      url,
      summary,
      importantFindings,
      equations: [],
      relevantComponents: [],
      applicationToProject,
      addedBy: state.currentUser.name,
      tags: [topic, source]
    });

    setTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <span>Research Database & Literature Archive</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Technical papers, datasheets, GitHub repositories, and application notes studying FOC algorithms & Moteus architecture.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Research Paper</span>
        </button>
      </div>

      {/* Research Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.researchEntries.map(item => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.topic}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{item.addedDate}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-1">{item.title}</h3>
              <p className="text-[10px] text-cyan-400 font-mono mb-3">{item.source}</p>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.summary}</p>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs mb-4">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">Key Finding</span>
                  <p className="text-slate-300 text-[11px]">{item.importantFindings}</p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Application to FOC Drive</span>
                  <p className="text-slate-300 text-[11px]">{item.applicationToProject}</p>
                </div>
              </div>
            </div>

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline"
              >
                <span>Read Full Reference Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <h3 className="text-sm font-bold text-slate-100 mb-4">Add Technical Research Entry</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Paper / Reference Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Topic</label>
                  <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Source / Publication</label>
                  <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">URL / Link</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Summary</label>
                <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Important Findings & Application</label>
                <textarea rows={2} value={importantFindings} onChange={(e) => {
                  setImportantFindings(e.target.value);
                  setApplicationToProject(e.target.value);
                }} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Add Research Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
