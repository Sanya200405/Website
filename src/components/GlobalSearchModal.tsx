import React, { useState } from 'react';
import { Search, X, CheckSquare, FileText, Cpu, FlaskConical, ShieldAlert, GitCommit, Users2 } from 'lucide-react';
import type { AppState } from '../services/store';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSelectEntity: (type: string, id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectEntity,
}) => {
  if (!isOpen) return null;
  const [query, setQuery] = useState('');
  const isDark = state.theme === 'dark';

  const q = query.toLowerCase().trim();

  const results: { type: string; title: string; subtitle: string; icon: any; id: string; category: string }[] = [];

  if (q.length > 0) {
    // Tasks
    state.tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))) {
        results.push({ type: 'task', id: t.id, title: t.title, subtitle: `Task • ${t.category} • ${t.status}`, icon: CheckSquare, category: 'Task' });
      }
    });
    // Docs
    state.docs.forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some(tag => tag.toLowerCase().includes(q))) {
        results.push({ type: 'doc', id: d.id, title: d.title, subtitle: `Doc • ${d.category} • ${d.authorName}`, icon: FileText, category: 'Documentation' });
      }
    });
    // Components
    state.components.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.partNumber.toLowerCase().includes(q) || c.manufacturer.toLowerCase().includes(q) || c.purpose.toLowerCase().includes(q)) {
        results.push({ type: 'component', id: c.id, title: `${c.name} (${c.partNumber})`, subtitle: `Component • ${c.category} • ${c.status}`, icon: Cpu, category: 'Component' });
      }
    });
    // Experiments
    state.experiments.forEach(e => {
      if (e.title.toLowerCase().includes(q) || e.objective.toLowerCase().includes(q) || e.observations.toLowerCase().includes(q)) {
        results.push({ type: 'experiment', id: e.id, title: e.title, subtitle: `Experiment • ${e.motorUsed} • ${e.date}`, icon: FlaskConical, category: 'Experiment' });
      }
    });
    // Issues
    state.issues.forEach(iss => {
      if (iss.title.toLowerCase().includes(q) || iss.description.toLowerCase().includes(q)) {
        results.push({ type: 'issue', id: iss.id, title: iss.title, subtitle: `Issue • ${iss.severity} • ${iss.status}`, icon: ShieldAlert, category: 'Issue' });
      }
    });
    // Decisions
    state.decisions.forEach(dec => {
      if (dec.title.toLowerCase().includes(q) || dec.decision.toLowerCase().includes(q)) {
        results.push({ type: 'decision', id: dec.id, title: dec.title, subtitle: `ADR Decision • ${dec.date}`, icon: GitCommit, category: 'Decision' });
      }
    });
    // Meetings
    state.meetings.forEach(m => {
      if (m.title.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q)) {
        results.push({ type: 'meeting', id: m.id, title: m.title, subtitle: `Meeting • ${m.date}`, icon: Users2, category: 'Meeting' });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across Tasks, Docs, Components, Experiments, Meetings, Issues..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {q.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Type keywords to search across the entire project engineering memory...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            results.map((res, idx) => {
              const Icon = res.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectEntity(res.type, res.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isDark ? 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80' : 'bg-slate-50 border-slate-200 hover:border-cyan-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{res.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{res.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300">
                    {res.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
