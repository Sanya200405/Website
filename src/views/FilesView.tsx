import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileBox,
} from 'lucide-react';
import type { AppState } from '../services/store';

interface FilesViewProps {
  state: AppState;
  onOpenUploadDoc: () => void;
  onDeleteDocument: (id: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  state,
  onOpenUploadDoc,
  onDeleteDocument,
}) => {
  const isDark = state.theme === 'dark';
  const { documents } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Datasheet':
      case 'Test Report':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'Firmware':
      case 'Schematic':
        return <FileCode className="w-5 h-5 text-sky-400" />;
      case 'CAD Model':
      case 'PCB Layout':
        return <FileBox className="w-5 h-5 text-purple-400" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-slate-100">Documents & Project Files</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Repository for motor datasheets, schematics, PCB Gerbers, CAD models, and test reports.
            </p>
          </div>
          <button
            onClick={onOpenUploadDoc}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none w-full sm:w-auto ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <option value="all">All Types</option>
          <option value="Datasheet">Datasheet</option>
          <option value="Schematic">Schematic</option>
          <option value="PCB Layout">PCB Layout</option>
          <option value="Firmware">Firmware</option>
          <option value="CAD Model">CAD Model</option>
          <option value="Test Report">Test Report</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {filteredDocs.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              {documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {documents.length === 0
                ? 'Upload motor datasheets, gate driver schematics, CAD step files, or test reports.'
                : 'Try adjusting your search terms.'}
            </p>
          </div>
          {documents.length === 0 && (
            <button
              onClick={onOpenUploadDoc}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                    {getFileIcon(doc.type)}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {doc.type}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100 break-words mb-1">
                  {doc.file_name}
                </h3>

                {doc.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {doc.file_size || '—'}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
