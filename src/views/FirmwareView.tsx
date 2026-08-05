import React from 'react';
import { Code2, GitCommit, ExternalLink } from 'lucide-react';
import type { AppState } from '../services/store';

export const FirmwareView: React.FC<{ state: AppState }> = ({ state }) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <span>Firmware Architecture & FOC Execution Loop</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            STM32G4 bare-metal C codebase: 20kHz complementary PWM timer interrupt, ADC DMA current sampling, and CAN-FD stack.
          </p>
        </div>

        <a
          href="https://github.com/team-foc-drive/foc-firmware"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700"
        >
          <GitCommit className="w-4 h-4" />
          <span>GitHub Firmware Repo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Firmware Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.firmwareModules.map(mod => (
          <div
            key={mod.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {mod.loopFrequency}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  mod.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400' :
                  mod.status === 'Testing' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-800 text-cyan-300'
                }`}>
                  {mod.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-1">{mod.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{mod.description}</p>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1 font-mono text-slate-400 mb-4">
                <div>Lead Developer: <strong className="text-cyan-300">{mod.assignedMember}</strong></div>
                <div>Last Commit Hash: <strong className="text-purple-300">{mod.lastCommitHash}</strong></div>
                <div className="text-[10px] text-slate-500 truncate pt-1">{mod.notes}</div>
              </div>
            </div>

            <a
              href={mod.repositoryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 font-bold hover:underline"
            >
              <span>Inspect C Source File</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
