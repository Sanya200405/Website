import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import type { AppState } from '../services/store';
import type { User } from '../types';

export const IndividualProgressView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';
  const [selectedUser, setSelectedUser] = useState<User>(state.currentUser);

  const userTasks = state.tasks.filter(t => t.assignedToId === selectedUser.id);
  const completedTasks = userTasks.filter(t => t.status === 'Completed');
  const activeTasks = userTasks.filter(t => t.status === 'In Progress' || t.status === 'Under Review');
  const userDocs = state.docs.filter(d => d.authorName.includes(selectedUser.name.split(' ')[0]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Member Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Individual Progress & Workload Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personal workload insights, task completion metrics, and documentation contributions for team support.
          </p>
        </div>

        {/* Switch Member */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">View Member:</span>
          <select
            value={selectedUser.id}
            onChange={(e) => {
              const u = state.users.find(item => item.id === e.target.value);
              if (u) setSelectedUser(u);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {state.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Profile Overview Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">{selectedUser.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
            <p className="text-xs text-slate-300 mt-2 max-w-xl">{selectedUser.bio}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex-shrink-0">
          <div className="text-center">
            <span className="text-xl font-extrabold text-cyan-400">{userTasks.length}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Assigned</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-extrabold text-emerald-400">{completedTasks.length}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Completed</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-extrabold text-sky-400">{activeTasks.length}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">In Progress</span>
          </div>
        </div>
      </div>

      {/* Grid: Assigned Tasks & Documentation Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Assigned Tasks Checklist</span>
            <span className="text-xs text-cyan-400 font-mono">{userTasks.length} Tasks</span>
          </h3>

          <div className="space-y-3">
            {userTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No tasks assigned to {selectedUser.name}.</p>
            ) : (
              userTasks.map(t => (
                <div key={t.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] text-cyan-400 font-mono">{t.category}</span>
                    <p className="font-bold text-slate-200 mt-0.5">{t.title}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.status === 'Blocked' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-slate-800 text-cyan-300'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Documentation Contributions */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Documentation Written</span>
            <span className="text-xs text-purple-400 font-mono">{userDocs.length} Articles</span>
          </h3>

          <div className="space-y-3">
            {userDocs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No documentation authored yet.</p>
            ) : (
              userDocs.map(doc => (
                <div key={doc.id} className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-purple-400 font-bold">{doc.category}</span>
                    <span className="text-[10px] text-slate-500">{doc.lastUpdated}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{doc.title}</h4>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
