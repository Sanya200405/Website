import React from 'react';
import { History, User, Tag } from 'lucide-react';
import { AppState } from '../services/store';

export const ActivityView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Activity Log & Engineering Audit Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological project change history tracking task updates, doc publications, test logs, and meetings.
          </p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-3">
          {state.activities.map(act => (
            <div
              key={act.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={act.personAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-slate-100">
                    {act.personName} <span className="font-normal text-slate-400">{act.action}</span>
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{act.targetName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  {act.category}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
