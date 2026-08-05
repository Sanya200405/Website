import React from 'react';
import { Users, Mail, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import type { AppState } from '../services/store';

export const TeamView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Engineering Team & Workload Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Student engineering team members, domain roles, expertise skills, and active workload distribution.
          </p>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.users.map((user) => {
          const userTasks = state.tasks.filter(t => t.assignedToId === user.id);
          const completedCount = userTasks.filter(t => t.status === 'Completed').length;
          const activeCount = userTasks.filter(t => t.status === 'In Progress' || t.status === 'Under Review').length;
          const blockedCount = userTasks.filter(t => t.status === 'Blocked').length;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/30"
                />
                <div className="flex-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {user.role}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{user.name}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{user.email}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                {user.bio}
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {user.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Workload Indicator */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Capacity Load</span>
                  <span className="font-mono font-bold text-cyan-400">{user.workloadPercentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      user.workloadPercentage > 80 ? 'bg-rose-500' :
                      user.workloadPercentage > 60 ? 'bg-cyan-400' :
                      'bg-emerald-400'
                    }`}
                    style={{ width: `${user.workloadPercentage}%` }}
                  />
                </div>

                {/* Task Stats Row */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {completedCount} Done
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <Clock className="w-3.5 h-3.5" /> {activeCount} Active
                  </span>
                  {blockedCount > 0 && (
                    <span className="flex items-center gap-1 text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5" /> {blockedCount} Blocked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
