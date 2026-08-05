import React from 'react';
import { FolderGit2 } from 'lucide-react';
import type { AppState } from '../services/store';

export const HardwareView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-cyan-400" />
            <span>Hardware Development Workspace & PCB Revisions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            4-layer inverter power stage PCB layout, gate driver routing, copper pour thermal strategy, and revision history.
          </p>
        </div>
      </div>

      {/* Hardware Requirements & Inverter Specifications */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-sm font-bold text-slate-100 mb-3 uppercase tracking-wider">
          Target Hardware Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">DC Bus Voltage</span>
            <span className="font-extrabold text-cyan-400 text-sm">24V - 48V DC</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Continuous Current</span>
            <span className="font-extrabold text-emerald-400 text-sm">15A (30A Peak)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">PCB Layer Count</span>
            <span className="font-extrabold text-purple-400 text-sm">4-Layer FR4 (2oz Cu)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Form Factor</span>
            <span className="font-extrabold text-sky-400 text-sm">65mm x 65mm Round</span>
          </div>
        </div>
      </div>

      {/* Hardware Revision Log */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>Hardware PCB Revision Tracker</span>
          <span className="text-xs text-cyan-400 font-mono">3 Revisions Logged</span>
        </h3>

        <div className="space-y-4">
          {state.hardwareRevisions.map(rev => (
            <div
              key={rev.id}
              className={`p-4 rounded-xl border ${
                rev.status === 'Active Testing' ? 'bg-cyan-500/10 border-cyan-500/40' :
                rev.status === 'Planned Production' ? 'bg-purple-500/10 border-purple-500/30' :
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    rev.status === 'Active Testing' ? 'bg-cyan-500 text-slate-950' :
                    rev.status === 'Planned Production' ? 'bg-purple-500 text-white' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {rev.revName}
                  </span>
                  <span className="text-xs font-bold text-slate-100">{rev.changesSummary}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Lead: <strong className="text-cyan-300">{rev.personResponsible}</strong></span>
                  <span>Date: {rev.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Reason For Change</span>
                  <p className="text-slate-300">{rev.reasonForChange}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">Problems / Errata Found</span>
                  <p className="text-slate-300">{rev.problemsFound}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
