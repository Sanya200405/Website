import React, { useState } from 'react';
import { Settings, Save, Database, Download, Archive } from 'lucide-react';
import type { AppState } from '../services/store';

interface SettingsViewProps {
  state: AppState;
  onToggleTheme: () => void;
  onUpdateProject: (data: { name: string; description: string; status: 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold'; target_date: string }) => Promise<any>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateProject,
}) => {
  const isDark = state.theme === 'dark';
  const { project } = state;

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [targetDate, setTargetDate] = useState(project.target_date || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProject({
        name,
        description,
        status,
        target_date: targetDate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-1">
            <Settings className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Project Settings & Configuration
            </h1>
          </div>
          <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Configure project parameters, database persistence, and download disaster recovery project archives.
          </p>
        </div>
      </div>

      {/* Project Details Form */}
      <form onSubmit={handleSave} className={`p-6 md:p-7 rounded-2xl border space-y-4 ${cardBgClass}`}>
        <h3 className={`text-base font-bold pb-3 border-b ${isDark ? 'text-slate-100 border-slate-800' : 'text-slate-900 border-slate-200'}`}>
          General Project Details
        </h3>

        <div className="space-y-1.5">
          <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Scope & Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors leading-relaxed ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Testing">Testing</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Completion Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {saveSuccess ? (
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Project settings updated successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Database & Backup Section */}
      <div className={`p-6 md:p-7 rounded-2xl border space-y-4 ${cardBgClass}`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Database & Data Persistence</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
            isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            Persistent SQLite with Daily Automated Snapshots
          </span>
        </div>

        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          All research papers, notes, experiments, measurements, documents, tasks, and report sections are persistently stored in SQLite at <code className={`px-2 py-0.5 rounded font-mono text-xs ${
            isDark ? 'bg-slate-950 text-cyan-300' : 'bg-slate-100 text-cyan-800 border border-slate-200'
          }`}>data/project.db</code> and attachments at <code className={`px-2 py-0.5 rounded font-mono text-xs ${
            isDark ? 'bg-slate-950 text-cyan-300' : 'bg-slate-100 text-cyan-800 border border-slate-200'
          }`}>uploads/</code>.
        </p>

        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Disaster Recovery & Independent Archive:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/api/admin/export-full-json"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Dump</span>
            </a>

            <a
              href="/api/admin/export-complete-zip"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>Download Complete ZIP Archive</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
