import React from 'react';
import { Settings, RefreshCw, Sun, Moon, Shield, Database } from 'lucide-react';
import { AppState } from '../services/store';

export const SettingsView: React.FC<{
  state: AppState;
  onToggleTheme: () => void;
  onResetDefault: () => void;
}> = ({ state, onToggleTheme, onResetDefault }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Workspace & System Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure project parameters, active roles, theme preferences, and data persistence options.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Info Card */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">
            Project Configuration
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Project Title</span>
              <p className="font-bold text-slate-100">Development of an FOC Drive for BLDC Motor</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Actuator Subsystem</span>
              <p className="font-semibold text-cyan-300">Dual-Stage 10:1 Planetary Gear Reduction</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Open-Source Reference</span>
              <p className="font-semibold text-purple-300">mjbots Moteus Motor Controller Architecture</p>
            </div>
          </div>
        </div>

        {/* Theme & Data Controls */}
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Preferences & Data Safety
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Visual Theme</span>
              <span className="text-[10px] text-slate-400">Toggle dark / light R&D interface</span>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 font-semibold text-xs border border-slate-700"
            >
              {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-rose-400 block">Reset Demo Data</span>
              <span className="text-[10px] text-slate-400">Restore factory sample seed data for FOC Drive</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all tasks, experiments, docs and decisions to default seed data?')) {
                  onResetDefault();
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
