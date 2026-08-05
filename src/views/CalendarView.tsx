import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { AppState } from '../services/store';

export const CalendarView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  const events = [
    ...state.meetings.map(m => ({ id: m.id, title: `Meeting: ${m.title}`, date: m.date, type: 'meeting', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' })),
    ...state.tasks.map(t => ({ id: t.id, title: `Deadline: ${t.title}`, date: t.deadline, type: 'deadline', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' })),
    ...state.milestones.map(m => ({ id: m.id, title: `Milestone: ${m.title}`, date: m.deadline, type: 'milestone', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' })),
    ...state.experiments.map(e => ({ id: e.id, title: `Experiment: ${e.title}`, date: e.date, type: 'experiment', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }))
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <span>Team Engineering Calendar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrated schedule of meetings, task deadlines, milestones, and dynamometer test sessions.
          </p>
        </div>
      </div>

      {/* Events Agenda Feed */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">
          Scheduled Timeline Events ({events.length})
        </h3>

        <div className="space-y-3">
          {events.map(ev => (
            <div
              key={ev.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${ev.color}`}>
                  {ev.type.toUpperCase()}
                </span>
                <span className="font-bold text-slate-100">{ev.title}</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{ev.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
