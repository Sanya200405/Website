import React, { useState } from 'react';
import { Cpu, Zap, Activity, Radio, Cog, BatteryCharging, ShieldAlert } from 'lucide-react';

export const ArchitectureDiagram: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [selectedNode, setSelectedNode] = useState<string | null>('MCU');

  const nodeDetails: Record<string, { title: string; desc: string; specs: string[]; category: string }> = {
    MCU: {
      title: 'STM32G431 Microcontroller',
      desc: 'Executes 20kHz Field-Oriented Control (FOC) loop, CORDIC trig acceleration, ADC current sampling, and CAN-FD communication.',
      specs: ['170 MHz Cortex-M4F', 'Hardware CORDIC', 'Dual 5Msps 12-bit ADC', 'FDCAN Controller'],
      category: 'Embedded Control'
    },
    FOC: {
      title: 'FOC Vector Algorithm',
      desc: 'Clarke & Park transformations, PI current loop regulators ($i_d^*=0, i_q^*$), Space Vector PWM (SVPWM) duty cycle synthesis.',
      specs: ['20 kHz Loop Rate', 'Clarke & Park Transforms', 'SVPWM Sector Gen', 'Field Weakening Ready'],
      category: 'Algorithm'
    },
    PWM: {
      title: 'TIM1 3-Phase Complementary PWM',
      desc: '6 PWM gate drive channels with hardware dead-time insertion and synchronized ADC sampling trigger at zero transition.',
      specs: ['20 kHz Center-Aligned', '100 ns Dead Time', 'ADC Trigger Sync', 'Hardware Break Input'],
      category: 'Signal Processing'
    },
    GateDriver: {
      title: 'DRV8323RS Gate Driver',
      desc: 'Texas Instruments 3-phase gate driver with smart gate drive current control (100mA-1A) and SPI telemetry configuration.',
      specs: ['6V to 60V Max Bus', '1A Source / 2A Sink', '3 Internal PGAs (20x)', 'SPI Interface'],
      category: 'Power Driver'
    },
    Inverter: {
      title: '6-MOSFET Inverter Bridge',
      desc: 'Infineon BSC014N04LS 40V 100A MOSFET power stage converting DC bus voltage into 3-phase AC stator currents.',
      specs: ['40 V Max Voltage', '1.4 mΩ Rds(on)', '30 A Continuous', 'Low ESR Cap Array'],
      category: 'Power Stage'
    },
    Motor: {
      title: 'MAD 5005 BLDC / PMSM Motor',
      desc: '350KV Surface permanent magnet BLDC motor providing high torque density and smooth sinusoidal back-EMF.',
      specs: ['350 KV Rating', '14 Pole Pairs (28 Magnets)', '0.45 Nm Cont. Torque', 'Phase Resistance 0.12 Ω'],
      category: 'Actuator'
    },
    Gearbox: {
      title: '10:1 Dual-Stage Planetary Reducer',
      desc: 'In-house CNC machined 7075 aluminum planetary gearbox multiplying motor torque by 10x with <15 arcmin backlash.',
      specs: ['10:1 Reduction Ratio', '15 Nm Peak Torque', '88% Mechanical Efficiency', '7075-T6 Housing'],
      category: 'Mechanical Output'
    },
    Sensors: {
      title: 'Current Shunts & AS5047D Magnetic Encoder',
      desc: 'Low-side 0.5mΩ shunt resistors for phase current feedback and 14-bit magnetic encoder for rotor electrical angle $\\theta_e$.',
      specs: ['0.5 mΩ 3W Precision Shunts', '14-Bit AS5047D SPI Encoder', '20kHz Differential Sample', '<0.1° Angle Accuracy'],
      category: 'Feedback Sensors'
    },
    CAN: {
      title: 'CAN-FD Fieldbus Transceiver',
      desc: 'High speed TCAN1042 bus interface providing real-time telemetry (position, velocity, currents, temperature) at 1Mbps/5Mbps.',
      specs: ['1 Mbps Arbitration', '5 Mbps Data Phase', 'SocketCAN Compatible', 'Fault Diagnostic Flags'],
      category: 'Communication'
    }
  };

  const details = selectedNode ? nodeDetails[selectedNode] : null;

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>FOC Drive & Planetary Gearbox Architecture</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any subsystem node to inspect signal parameters and hardware specs.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-semibold">
          Interactive Diagram
        </span>
      </div>

      {/* Visual System Architecture Diagram Flow */}
      <div className="space-y-4">
        {/* Layer 1: Control & Signal Flow */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Electrical & Firmware Execution Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
            {/* MCU Node */}
            <button
              onClick={() => setSelectedNode('MCU')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedNode === 'MCU'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30 scale-[1.02]'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">MCU</span>
              </div>
              <p className="text-[10px] text-slate-400">STM32G431 (170MHz)</p>
            </button>

            {/* FOC Algorithm Node */}
            <button
              onClick={() => setSelectedNode('FOC')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedNode === 'FOC'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30 scale-[1.02]'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">FOC Loop</span>
              </div>
              <p className="text-[10px] text-slate-400">Clarke/Park & SVPWM</p>
            </button>

            {/* PWM Generation Node */}
            <button
              onClick={() => setSelectedNode('PWM')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedNode === 'PWM'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30 scale-[1.02]'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">PWM Timers</span>
              </div>
              <p className="text-[10px] text-slate-400">20kHz Center-Aligned</p>
            </button>

            {/* Gate Driver Node */}
            <button
              onClick={() => setSelectedNode('GateDriver')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedNode === 'GateDriver'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30 scale-[1.02]'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">Gate Driver</span>
              </div>
              <p className="text-[10px] text-slate-400">DRV8323RS (SPI)</p>
            </button>

            {/* Inverter Node */}
            <button
              onClick={() => setSelectedNode('Inverter')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedNode === 'Inverter'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30 scale-[1.02]'
                  : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BatteryCharging className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold">MOSFET Inverter</span>
              </div>
              <p className="text-[10px] text-slate-400">40V 100A Bridge</p>
            </button>
          </div>
        </div>

        {/* Layer 2: Mechanical & Feedback Loop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Actuator & Planetary Gearhead */}
          <button
            onClick={() => setSelectedNode('Motor')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedNode === 'Motor'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold">BLDC / PMSM Motor</span>
            </div>
            <p className="text-[10px] text-slate-400">MAD 5005 (350KV, 14pp)</p>
          </button>

          <button
            onClick={() => setSelectedNode('Gearbox')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedNode === 'Gearbox'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Cog className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Planetary Reducer</span>
            </div>
            <p className="text-[10px] text-slate-400">10:1 Ratio (15 Nm Peak)</p>
          </button>

          <button
            onClick={() => setSelectedNode('Sensors')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedNode === 'Sensors'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Sensors (Shunts + Encoder)</span>
            </div>
            <p className="text-[10px] text-slate-400">0.5mΩ Shunts & AS5047D SPI</p>
          </button>
        </div>
      </div>

      {/* Selected Node Details Box */}
      {details && (
        <div className={`mt-4 p-4 rounded-xl border transition-all ${
          isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              Subsystem Inspector: {details.category}
            </span>
            <span className="text-[10px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">
              Active Focus
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-100">{details.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{details.desc}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {details.specs.map((spec, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md text-[10px] font-mono bg-slate-900/80 border border-cyan-500/20 text-cyan-300"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
