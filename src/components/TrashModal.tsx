import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  BookOpen,
  FileCode2,
  GraduationCap,
  FlaskConical,
  FolderGit2,
  CheckSquare,
  Milestone,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import type { TrashItem, TeamMember } from '../services/api';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  currentUser: TeamMember | null;
  onRestore: (entity_type: string, id: string) => Promise<any>;
  onPurge: (entity_type: string, id: string) => Promise<any>;
  theme?: 'dark' | 'light';
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  currentUser,
  onRestore,
  onPurge,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = trashItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.entity_type === filterType;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'research_paper':
        return <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'engineering_note':
        return <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'learning_resource':
        return <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'test':
        return <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'document':
        return <FolderGit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'milestone':
        return <Milestone className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'issue':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'report_section':
      default:
        return <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const handleRestoreItem = async (entity_type: string, id: string) => {
    setActionLoadingId(id);
    try {
      await onRestore(entity_type, id);
    } catch (err: any) {
      alert(err.message || 'Failed to restore item');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePurgeItem = async (entity_type: string, id: string) => {
    if (!confirm('Permanently purge this item from the database? This action CANNOT be undone.')) {
      return;
    }
    setActionLoadingId(id);
    try {
      await onPurge(entity_type, id);
    } catch (err: any) {
      alert(err.message || 'Failed to purge item');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Trash & Recovery Vault</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Soft-deleted project items are safely kept here and can be restored at any time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-cyan-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({trashItems.length})
            </button>
            <button
              onClick={() => setFilterType('research_paper')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'research_paper'
                  ? 'bg-cyan-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Papers ({trashItems.filter((i) => i.entity_type === 'research_paper').length})
            </button>
            <button
              onClick={() => setFilterType('engineering_note')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'engineering_note'
                  ? 'bg-cyan-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Notes ({trashItems.filter((i) => i.entity_type === 'engineering_note').length})
            </button>
            <button
              onClick={() => setFilterType('test')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'test'
                  ? 'bg-cyan-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tests ({trashItems.filter((i) => i.entity_type === 'test').length})
            </button>
            <button
              onClick={() => setFilterType('document')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'document'
                  ? 'bg-cyan-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Docs ({trashItems.filter((i) => i.entity_type === 'document').length})
            </button>
          </div>
        </div>

        {/* Content List */}
        {filtered.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">Trash is empty</p>
            <p className="text-xs mt-0.5">No deleted items match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map((item) => {
              const isLoading = actionLoadingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getItemIcon(item.entity_type)}
                    <div className="truncate">
                      <p className="font-semibold truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs opacity-70 mt-0.5">
                        <span className="capitalize">{item.entity_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Deleted {new Date(item.deleted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestoreItem(item.entity_type, item.id)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
                      title="Restore item back into active view"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handlePurgeItem(item.entity_type, item.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all disabled:opacity-50"
                        title="Permanently purge from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`flex justify-end pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
