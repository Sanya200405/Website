import React, { useState } from 'react';
import { FolderGit2, Plus, Download, FileText } from 'lucide-react';
import type { AppState } from '../services/store';
import type { ProjectFile } from '../types';

export const FilesView: React.FC<{
  state: AppState;
  onAddFile: (file: Omit<ProjectFile, 'id' | 'uploadedDate'>) => void;
}> = ({ state, onAddFile }) => {
  const isDark = state.theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectFile['category']>('Schematics');
  const [size, setSize] = useState('2.4 MB');
  const [url, setUrl] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddFile({
      name,
      category,
      size,
      uploadedBy: state.currentUser.name,
      url: url || '#',
      tags: [category]
    });

    setName('');
    setUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-cyan-400" />
            <span>Central Project File Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Datasheets, Altium schematics, PCB Gerber files, SolidWorks CAD STEP models, and test reports.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project File</span>
        </button>
      </div>

      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-3">
          {state.files.map(file => (
            <div
              key={file.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{file.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {file.category} • {file.size} • Uploaded by {file.uploadedBy} on {file.uploadedDate}
                  </p>
                </div>
              </div>

              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white'}`}>
            <h3 className="text-sm font-bold mb-4">Add File to Central Vault</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">File Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FOC_Inverter_Rev1_Schematic.pdf" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                    {['Datasheets', 'Schematics', 'PCB', 'CAD', 'Firmware', 'Research Papers', 'Test Results', 'Images', 'Meeting Documents', 'Reports'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">File Size</label>
                  <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 4.2 MB" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Download URL / Storage Link</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Add File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
