import React, { useState } from 'react';
import { FolderGit2, Plus, ExternalLink, Download, FileText } from 'lucide-react';
import { AppState } from '../services/store';
import { ProjectFile } from '../types';

export const FilesView: React.FC<{
  state: AppState;
  onAddFile: (file: Omit<ProjectFile, 'id' | 'uploadedDate'>) => void;
}> = ({ state, onAddFile }) => {
  const isDark = state.theme === 'dark';

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
    </div>
  );
};
