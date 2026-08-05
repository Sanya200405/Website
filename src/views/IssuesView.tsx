import React, { useState } from 'react';
import { ShieldAlert, Plus } from 'lucide-react';
import type { AppState } from '../services/store';
import type { Issue, IssueSeverity } from '../types';

export const IssuesView: React.FC<{
  state: AppState;
  onAddIssue: (issue: Omit<Issue, 'id' | 'dateDiscovered'>) => void;
}> = ({ state, onAddIssue }) => {
  const isDark = state.theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('High');
  const [subsystem, setSubsystem] = useState<Issue['subsystem']>('FOC Algorithm');
  const [possibleCause, setPossibleCause] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddIssue({
      title,
      description,
      severity,
      status: 'Open',
      assignedToName: state.currentUser.name,
      subsystem,
      possibleCause,
      investigationNotes: 'Under investigation.',
      solution: '',
      testResult: '',
      finalConclusion: '',
      tags: [subsystem, severity]
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
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Engineering Issue & Errata Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log, investigate, and document solutions for hardware ringing, current loop oscillations, and SPI timing issues.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Issue</span>
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {state.issues.map(iss => (
          <div
            key={iss.id}
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  iss.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  iss.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {iss.severity} Severity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                  {iss.subsystem}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{iss.title}</h3>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-[10px] text-slate-400">Discovered: {iss.dateDiscovered}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  iss.status === 'Fixed' ? 'bg-emerald-500/20 text-emerald-400' :
                  iss.status === 'Investigating' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {iss.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">{iss.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Suspected Cause</span>
                <p className="text-slate-300">{iss.possibleCause}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Engineering Solution & Verification</span>
                <p className="text-slate-300">{iss.solution || 'Investigation in progress.'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Issue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <h3 className="text-sm font-bold text-slate-100 mb-4">Log Engineering Issue</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Issue Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                    {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subsystem</label>
                  <select value={subsystem} onChange={(e) => setSubsystem(e.target.value as any)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                    {['Hardware', 'Firmware', 'FOC Algorithm', 'Mechanical', 'Sensors', 'CAN-FD'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Possible Cause</label>
                <input type="text" value={possibleCause} onChange={(e) => setPossibleCause(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold">Submit Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
