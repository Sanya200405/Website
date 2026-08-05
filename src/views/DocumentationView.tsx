import React, { useState } from 'react';
import { FileText, Plus, Search, BookOpen, Clock, User, ChevronRight } from 'lucide-react';
import type { AppState } from '../services/store';
import type { TechnicalDoc } from '../types';

export const DocumentationView: React.FC<{ state: AppState; onAddDoc: (doc: Omit<TechnicalDoc, 'id' | 'lastUpdated'>) => void }> = ({
  state,
  onAddDoc,
}) => {
  const isDark = state.theme === 'dark';
  const [selectedDoc, setSelectedDoc] = useState<TechnicalDoc>(state.docs[0]);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TechnicalDoc['category']>('FOC');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('FOC, Engineering');

  const filteredDocs = state.docs.filter(d =>
    d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddDoc({
      title: newTitle,
      category: newCategory,
      content: newContent,
      authorName: state.currentUser.name,
      tags: newTags.split(',').map(s => s.trim()).filter(Boolean)
    });

    setNewTitle('');
    setNewContent('');
    setShowNewDocModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Technical Documentation & Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Engineering wiki storing FOC vector control mathematics, Moteus study breakdown, inverter PCB notes, and planetary gear mechanics.
          </p>
        </div>

        <button
          onClick={() => setShowNewDocModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Main Notion-Style 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Document Tree & Navigation (1 col) */}
        <div className={`p-4 rounded-2xl border space-y-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Doc Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              placeholder="Filter wiki docs..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Wiki Pages ({filteredDocs.length})
            </span>
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                      : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{doc.title}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Markdown Document Reader / Editor (3 cols) */}
        {selectedDoc && (
          <div className={`lg:col-span-3 p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Metadata Header */}
            <div className="border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedDoc.category}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Last Updated: {selectedDoc.lastUpdated}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-100 mb-2">
                {selectedDoc.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Author: {selectedDoc.authorName}</span>
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedDoc.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Document Content Display */}
            <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
              {selectedDoc.content}
            </div>
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-sm font-bold mb-4">Create Technical Documentation Page</h3>
            <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SVPWM Duty Cycle Generation Math"
                  className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}
                  >
                    {['FOC', 'Motor', 'Moteus Study', 'Hardware', 'Firmware', 'Mechanical', 'Testing'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Markdown Content</label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write engineering documentation in markdown..."
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewDocModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
