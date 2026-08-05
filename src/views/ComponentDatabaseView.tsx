import React, { useState } from 'react';
import { Cpu, Plus, ExternalLink } from 'lucide-react';
import type { AppState } from '../services/store';
import type { Component, ComponentStatus, ComponentCategory } from '../types';

export const ComponentDatabaseView: React.FC<{
  state: AppState;
  onAddComponent: (comp: Omit<Component, 'id'>) => void;
}> = ({ state, onAddComponent }) => {
  const isDark = state.theme === 'dark';
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('MCU');
  const [manufacturer, setManufacturer] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [voltageRating, setVoltageRating] = useState('');
  const [currentRating, setCurrentRating] = useState('');
  const [costUsd, setCostUsd] = useState(0);
  const [status, setStatus] = useState<ComponentStatus>('Selected');
  const [reasonForSelection, setReasonForSelection] = useState('');
  const [schematicSection, setSchematicSection] = useState('');
  const [pcbLocation, setPcbLocation] = useState('');

  const filteredComponents = state.components.filter(c => {
    if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    return true;
  });

  const handleCreateComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddComponent({
      name,
      category,
      manufacturer,
      partNumber,
      datasheetUrl: '',
      purpose,
      specs: { voltageRating, currentRating },
      costUsd: Number(costUsd),
      availabilityStatus: 'In Stock',
      status,
      reasonForSelection,
      schematicSection,
      pcbLocation,
      notes: '',
      tags: [category, status]
    });

    setName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Engineering Component Database</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Component inventory for FOC inverter power stage, MCU, gate driver, current shunts, position encoder, and planetary gearbox.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Component</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Status:</span>
          {['All', 'Selected', 'Candidate', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedStatus === s
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Category:</span>
          {['All', 'MCU', 'MOSFET', 'Gate Driver', 'Current Sensor', 'Encoder', 'Gearbox'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                selectedCategory === c
                  ? 'bg-purple-500 text-white'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredComponents.map(comp => (
          <div
            key={comp.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {comp.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  comp.status === 'Selected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  comp.status === 'Candidate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {comp.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-0.5">{comp.name}</h3>
              <p className="text-[11px] font-mono text-cyan-400 mb-2">{comp.manufacturer} • {comp.partNumber}</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{comp.purpose}</p>

              {/* Specs Box */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-[11px] mb-4">
                {comp.specs.voltageRating && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voltage Rating:</span>
                    <span className="font-mono text-slate-200">{comp.specs.voltageRating}</span>
                  </div>
                )}
                {comp.specs.currentRating && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Rating:</span>
                    <span className="font-mono text-slate-200">{comp.specs.currentRating}</span>
                  </div>
                )}
                {comp.specs.package && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Package:</span>
                    <span className="font-mono text-slate-200">{comp.specs.package}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Unit Cost:</span>
                  <span className="font-mono font-bold text-emerald-400">${comp.costUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>PCB Location: <strong className="text-cyan-300 font-mono">{comp.pcbLocation}</strong></span>
                <span>Section: <strong className="text-slate-200">{comp.schematicSection}</strong></span>
              </div>
              {comp.datasheetUrl && (
                <a
                  href={comp.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 font-semibold hover:underline pt-1"
                >
                  <span>Open Datasheet PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Component Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className={`w-full max-w-xl rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <h3 className="text-sm font-bold text-slate-100 mb-4">Add Engineering Component</h3>
            <form onSubmit={handleCreateComponent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Component Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TCAN1042 CAN Transceiver" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Manufacturer</label>
                  <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Part Number</label>
                  <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Purpose / Role</label>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Voltage Rating</label>
                  <input type="text" value={voltageRating} onChange={(e) => setVoltageRating(e.target.value)} placeholder="e.g. 60V" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Current Rating</label>
                  <input type="text" value={currentRating} onChange={(e) => setCurrentRating(e.target.value)} placeholder="e.g. 30A" className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit Cost ($)</label>
                  <input type="number" step="0.01" value={costUsd} onChange={(e) => setCostUsd(Number(e.target.value))} className={`w-full p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">Add Component</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
