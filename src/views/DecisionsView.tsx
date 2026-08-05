import React, { useState } from 'react';
import { GitCommit, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { AppState } from '../services/store';
import { DecisionRecord } from '../types';

export const DecisionsView: React.FC<{
  state: AppState;
  onAddDecision: (dec: Omit<DecisionRecord, 'id' | 'date'>) => void;
}> = ({ state, onAddDecision }) => {
  const isDark = state.theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [decision, setDecision] = useState('');
  const [reasonForChoice, setReasonForChoice] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddDecision({
      title,
      decision,
      alternativesConsidered: [],
      advantages: [],
      disadvantages: [],
      reasonForChoice,
      peopleInvolved: [state.currentUser.name],
      tags: ['ADR', 'Decision']
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
            <GitCommit className="w-5 h-5 text-cyan-400" />
            <span>Architecture Decision Log (ADR)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal records of engineering trade-offs, design choices, component selection rationale, and architectural decisions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Decision</span>
        </button>
      </div>

      {/* Decision Records Stack */}
      <div className="space-y-5">
        {state.decisions.map(dec => (
          <div
            key={dec.id}
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">ADR Record #{dec.id}</span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{dec.title}</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Date: {dec.date}</span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Final Decision Chosen</span>
              <p className="text-xs font-semibold text-cyan-200">{dec.decision}</p>
            </div>

            {/* Alternatives & Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {dec.alternativesConsidered.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Alternatives Evaluated</span>
                  <ul className="space-y-1 text-slate-300">
                    {dec.alternativesConsidered.map((alt, idx) => (
                      <li key={idx}>• {alt}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-2">Why We Chose This (Rationale)</span>
                <p className="text-slate-300 leading-relaxed">{dec.reasonForChoice}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <h3 className="text-sm font-bold text-slate-100 mb-4">Record Architectural Decision</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Decision Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Select current sensing topology" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Final Choice Selected</label>
                <input type="text" required value={decision} onChange={(e) => setDecision(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reason & Engineering Rationale</label>
                <textarea rows={3} required value={reasonForChoice} onChange={(e) => setReasonForChoice(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Record Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
