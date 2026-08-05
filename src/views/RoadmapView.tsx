import React, { useState } from 'react';
import { Map, Sliders } from 'lucide-react';
import type { AppState } from '../services/store';
import type { Phase } from '../types';

export const RoadmapView: React.FC<{ state: AppState; onUpdatePhaseProgress: (id: string, progress: number) => void }> = ({
  state,
  onUpdatePhaseProgress,
}) => {
  const isDark = state.theme === 'dark';
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(state.phases[2] || state.phases[0]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            <span>Project Roadmap & Phase Progression</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured 8-phase engineering pipeline from Moteus study to final integrated FOC drive demonstration.
          </p>
        </div>
      </div>

      {/* Visual Gantt Phase Pipeline */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Gantt Phase Schedule
        </h3>

        <div className="space-y-3">
          {state.phases.map((phase) => {
            const isSelected = selectedPhase?.id === phase.id;
            return (
              <div
                key={phase.id}
                onClick={() => setSelectedPhase(phase)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                      phase.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      phase.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {phase.number}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{phase.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-md">{phase.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[10px] font-mono text-slate-400">{phase.startDate} → {phase.endDate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      phase.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      phase.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {phase.status}
                    </span>
                    <span className="font-extrabold text-cyan-400 text-xs w-10 text-right">
                      {phase.progressPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Timeline Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      phase.status === 'Completed' ? 'bg-emerald-400' :
                      phase.status === 'In Progress' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                      'bg-slate-600'
                    }`}
                    style={{ width: `${phase.progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detail Inspector */}
      {selectedPhase && (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                Phase Inspector #{selectedPhase.number}
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedPhase.title}</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Lead Engineer</span>
                <span className="text-xs font-semibold text-cyan-300">{selectedPhase.assigneeName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1">Phase Objectives & Scope</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedPhase.description}</p>
            </div>

            {/* Interactive Progress Slider */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Update Phase Progress (%)</span>
                </label>
                <span className="text-sm font-extrabold text-cyan-400">{selectedPhase.progressPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedPhase.progressPercentage}
                onChange={(e) => onUpdatePhaseProgress(selectedPhase.id, Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
