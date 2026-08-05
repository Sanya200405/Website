import React, { useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { AppState } from '../services/store';
import type { ExperimentLog } from '../types';

export const ExperimentsView: React.FC<{
  state: AppState;
  onAddExperiment: (exp: Omit<ExperimentLog, 'id'>) => void;
}> = ({ state, onAddExperiment }) => {
  const isDark = state.theme === 'dark';
  const [selectedExp, setSelectedExp] = useState<ExperimentLog>(state.experiments[0]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [motorUsed, setMotorUsed] = useState('MAD 5005 BLDC (350KV)');
  const [supplyVoltageV, setSupplyVoltageV] = useState(24);
  const [pwmFrequencyKhz, setPwmFrequencyKhz] = useState(20);
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [observations, setObservations] = useState('');
  const [nextAction, setNextAction] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newExp: Omit<ExperimentLog, 'id'> = {
      title,
      objective,
      date: new Date().toISOString().split('T')[0],
      conductedBy: state.currentUser.name,
      hardwareSetup: 'Custom 4-Layer Inverter v1.1 + STM32G4 Core',
      motorUsed,
      supplyVoltageV: Number(supplyVoltageV),
      supplyCurrentA: 5,
      pwmFrequencyKhz: Number(pwmFrequencyKhz),
      motorSpeedRpm: 1200,
      loadTorqueNm: 0.5,
      gearRatio: '10:1 Planetary Reducer',
      controllerSettings: '20kHz FOC, Ki=0.15, Kp=2.4',
      expectedResult,
      actualResult,
      observations,
      problemsEncountered: 'None reported.',
      conclusion: 'Test completed successfully.',
      nextAction,
      dataPoints: [
        { timeMs: 0, targetCurrentA: 0, measuredCurrentA: 0, tempC: 25 },
        { timeMs: 10, targetCurrentA: 5, measuredCurrentA: 4.8, tempC: 26 },
        { timeMs: 20, targetCurrentA: 5, measuredCurrentA: 5.1, tempC: 27 },
        { timeMs: 30, targetCurrentA: 5, measuredCurrentA: 5.0, tempC: 28 },
        { timeMs: 40, targetCurrentA: 0, measuredCurrentA: 0.2, tempC: 29 },
      ],
      tags: ['TestBench', 'FOC']
    };

    onAddExperiment(newExp);
    setTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <span>Experiments & Dynamometer Test Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record motor test bench runs, phase current step response, thermal rise, and planetary gearbox efficiency measurements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Experiment</span>
        </button>
      </div>

      {/* Main Grid: Experiment List & Waveform Plot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Test Run Selector (1 col) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Log Records ({state.experiments.length})
          </h3>

          {state.experiments.map(exp => {
            const isSelected = selectedExp?.id === exp.id;
            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                    : isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-cyan-400 font-mono">{exp.date}</span>
                  <span className="text-[10px] text-slate-400">{exp.motorUsed}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{exp.title}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{exp.objective}</p>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Experiment Detailed Report & Chart (2 cols) */}
        {selectedExp && (
          <div className={`lg:col-span-2 p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  Experiment Log #{selectedExp.id}
                </span>
                <span className="text-xs text-slate-400">Conducted By: {selectedExp.conductedBy}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{selectedExp.title}</h3>
            </div>

            {/* Test Setup Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Supply Voltage</span>
                <span className="font-mono font-bold text-cyan-400">{selectedExp.supplyVoltageV} V</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PWM Frequency</span>
                <span className="font-mono font-bold text-purple-400">{selectedExp.pwmFrequencyKhz} kHz</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Motor Speed</span>
                <span className="font-mono font-bold text-sky-400">{selectedExp.motorSpeedRpm} RPM</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gear Ratio</span>
                <span className="font-mono font-bold text-emerald-400">{selectedExp.gearRatio}</span>
              </div>
            </div>

            {/* Waveform Chart (if data points exist) */}
            {selectedExp.dataPoints && selectedExp.dataPoints.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span>Current / Telemetry Waveform Data</span>
                  <span className="text-[10px] font-mono text-cyan-400">Step Response</span>
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedExp.dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="timeMs" stroke="#94a3b8" fontSize={10} unit="ms" />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {selectedExp.dataPoints[0].targetCurrentA !== undefined && (
                        <Line type="monotone" dataKey="targetCurrentA" name="Target Current (A)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      )}
                      {selectedExp.dataPoints[0].measuredCurrentA !== undefined && (
                        <Line type="monotone" dataKey="measuredCurrentA" name="Measured Current (A)" stroke="#f43f5e" strokeWidth={2} />
                      )}
                      {selectedExp.dataPoints[0].tempC !== undefined && (
                        <Line type="monotone" dataKey="tempC" name="Temp (°C)" stroke="#fbbf24" strokeWidth={2} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Expected vs Actual & Observations */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Expected Result</span>
                <p className="text-slate-300">{selectedExp.expectedResult}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Actual Measured Result</span>
                <p className="text-slate-300">{selectedExp.actualResult}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Engineering Observations</span>
                <p className="text-slate-300">{selectedExp.observations}</p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <span className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">Next Action Required</span>
                <p className="text-cyan-200 font-semibold">{selectedExp.nextAction}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Experiment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white'}`}>
            <h3 className="text-sm font-bold mb-4">Record New Dynamometer Experiment Run</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Experiment Title *</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Phase Current Step Response Test" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Objective</label>
                <input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objective of test..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Motor Used</label>
                  <input type="text" value={motorUsed} onChange={(e) => setMotorUsed(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bus Voltage (V)</label>
                  <input type="number" value={supplyVoltageV} onChange={(e) => setSupplyVoltageV(Number(e.target.value))} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">PWM Freq (kHz)</label>
                  <input type="number" value={pwmFrequencyKhz} onChange={(e) => setPwmFrequencyKhz(Number(e.target.value))} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Expected vs Actual Results</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} placeholder="Expected..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                  <input type="text" value={actualResult} onChange={(e) => setActualResult(e.target.value)} placeholder="Actual..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Observations & Next Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observations..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                  <input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next step..." className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Record Experiment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
