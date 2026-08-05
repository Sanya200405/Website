import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import type { AppState } from '../services/store';

export const MilestonesView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span>Project Milestones Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key project goals and subtask deliverables across Moteus analysis, hardware fabrication, and gear integration.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {state.milestones.map(m => (
          <div
            key={m.id}
            className={`p-6 rounded-2xl border ${
              m.isCurrent ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30' :
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  {m.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500 text-white">
                      CURRENT FOCUS
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-100">{m.title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-extrabold text-purple-400 block">{m.progressPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-mono">Deadline: {m.deadline}</span>
              </div>
            </div>

            {/* Subtask Checklist */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Subtasks ({m.subtasks.filter(s => s.completed).length} / {m.subtasks.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {m.subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <CheckCircle2 className={`w-4 h-4 ${sub.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
