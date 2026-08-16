import React from 'react';
import { History, Clock } from 'lucide-react';
import type { AppState } from '../services/store';
import { UserAvatar } from '../components/UserAvatar';

interface ActivityViewProps {
  state: AppState;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ state }) => {
  const isDark = state.theme === 'dark';
  const { activities } = state;

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-1">
            <History className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Project Activity & Audit Log
            </h1>
          </div>
          <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Real-time chronological record of all team actions, task updates, test uploads, and milestone changes.
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-100 border border-amber-300 text-amber-800'
          }`}>
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>No activity recorded yet</h3>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Any tasks created, milestones completed, test logs uploaded, or issues reported will be permanently logged here.
            </p>
          </div>
        </div>
      ) : (
        <div className={`p-6 md:p-7 rounded-2xl border ${cardBgClass}`}>
          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className={`flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 text-sm ${
                  isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}
              >
                <UserAvatar name={act.user_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className={`leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <strong className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{act.user_name}</strong>{' '}
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{act.action}</span>{' '}
                      <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>"{act.entity_title}"</span>
                    </p>
                    <span className={`text-xs font-mono flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(act.timestamp).toLocaleDateString()} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase inline-block mt-2 border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {act.entity_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
