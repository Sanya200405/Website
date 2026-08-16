import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Save,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import type { SimulationModel, MilestoneItem, TestItem } from '../services/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SimulationModel> & { linked_test_ids?: string[] }) => Promise<void>;
  initialData?: SimulationModel | null;
  milestones: MilestoneItem[];
  tests: TestItem[];
  theme: 'dark' | 'light';
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  milestones,
  tests,
  theme,
}) => {
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [githubPath, setGithubPath] = useState('');
  const [status, setStatus] = useState<SimulationModel['status']>('In Development');
  const [milestoneId, setMilestoneId] = useState('');
  const [objective, setObjective] = useState('');
  const [parameters, setParameters] = useState('');
  const [inputs, setInputs] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [results, setResults] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'spec' | 'results' | 'experiments'>('details');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setPurpose(initialData.purpose || '');
      setGithubPath(initialData.github_path || '');
      setStatus(initialData.status || 'In Development');
      setMilestoneId(initialData.milestone_id || '');
      setObjective(initialData.objective || '');
      setParameters(initialData.parameters || '');
      setInputs(initialData.inputs || '');
      setExpectedOutput(initialData.expected_output || '');
      setResults(initialData.results || '');
      setConclusion(initialData.conclusion || '');
      setNotes(initialData.notes || '');
      setSelectedTestIds((initialData.linked_experiments || []).map((le) => le.test_id));
    } else {
      setName('');
      setDescription('');
      setPurpose('');
      setGithubPath('');
      setStatus('In Development');
      setMilestoneId('');
      setObjective('');
      setParameters('');
      setInputs('');
      setExpectedOutput('');
      setResults('');
      setConclusion('');
      setNotes('');
      setSelectedTestIds([]);
    }
    setActiveTab('details');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        github_path: githubPath.trim(),
        status,
        milestone_id: milestoneId || undefined,
        objective: objective.trim(),
        parameters: parameters.trim(),
        inputs: inputs.trim(),
        expected_output: expectedOutput.trim(),
        results: results.trim(),
        conclusion: conclusion.trim(),
        notes: notes.trim(),
        linked_test_ids: selectedTestIds,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save simulation model:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const inputClass = `w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-cyan-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
  }`;

  const labelClass = `block text-xs font-semibold mb-1.5 ${
    isDark ? 'text-slate-300' : 'text-slate-700'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {initialData ? 'Edit Simulation Model' : 'Document Simulink / Simulation Model'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Link MATLAB/Simulink models from GitHub with test objectives, parameters, and findings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`px-5 pt-3 border-b flex items-center gap-2 overflow-x-auto text-xs font-semibold ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            1. Model & GitHub Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spec')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'spec'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            2. Objectives & Inputs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'results'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            3. Results & Conclusions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experiments')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'experiments'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>4. Linked Experiments ({selectedTestIds.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Model Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FOC Dual PI Current & Speed Loop Model"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Development Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Development">In Development</option>
                    <option value="Validated">Validated</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Related Project Milestone / Phase</label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">None / Independent</option>
                    {milestones.map((ms) => (
                      <option key={ms.id} value={ms.id}>
                        {ms.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <div className="flex items-center gap-1.5">
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub File Path / Simulink URL</span>
                  </div>
                </label>
                <input
                  type="text"
                  placeholder="e.g. simulink/foc_bldc_model.slx or https://github.com/Ehna12/Field-Oriented-Control-of-BLDC-motor/blob/main/simulink/..."
                  value={githubPath}
                  onChange={(e) => setGithubPath(e.target.value)}
                  className={inputClass}
                />
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Relative file path within repository or full GitHub URL. GitHub remains the source of truth for the binary .slx file.
                </p>
              </div>

              <div>
                <label className={labelClass}>Model Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the model topology (e.g. Inverter modulation, Clark/Park transformations, SVM)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Primary Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Verify current loop stability and torque ripple suppression before hardware flash"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {activeTab === 'spec' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Simulation Objective</label>
                <textarea
                  rows={2}
                  placeholder="What specifically is this simulation intended to evaluate or prove?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Simulation Parameters</label>
                <textarea
                  rows={3}
                  placeholder="Key solver and motor parameters (e.g. Ode23t, Step: 1e-6s, Bus Voltage: 24V, Kv: 400, PWM: 20kHz)..."
                  value={parameters}
                  onChange={(e) => setParameters(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Input Conditions</label>
                  <textarea
                    rows={3}
                    placeholder="Input signals (e.g. Speed ref step 0 -> 2000 RPM at t=0.1s, Load step 0.5 Nm at t=0.3s)..."
                    value={inputs}
                    onChange={(e) => setInputs(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Expected Output</label>
                  <textarea
                    rows={3}
                    placeholder="What outputs/curves we expect to observe (e.g. Iq current response settling within 5ms, speed overshoot < 5%)..."
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Observed Results & Data</label>
                <textarea
                  rows={3}
                  placeholder="Enter observed simulation metrics, current ripple measurements, peak overshoot, or observations..."
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Conclusion & Technical Interpretation</label>
                <textarea
                  rows={3}
                  placeholder="Engineering conclusions drawn from this simulation run..."
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Additional Engineering Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional tuning insights, warnings, or required controller changes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {activeTab === 'experiments' && (
            <div className="space-y-3">
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-900'
              }`}>
                <p className="font-semibold mb-0.5">Simulation → Hardware Test Traceability</p>
                <p>Select the real physical test runs that validated or corresponded to this Simulink model.</p>
              </div>

              {tests.length === 0 ? (
                <div className={`p-8 text-center rounded-xl border border-dashed ${
                  isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-600'
                }`}>
                  No hardware test runs logged yet. You can link experiments later after testing.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {tests.map((test) => {
                    const isSelected = selectedTestIds.includes(test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleTestSelection(test.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-slate-100'
                              : 'bg-cyan-50 border-cyan-300 text-slate-900 font-medium'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-cyan-600 border-cyan-600 text-white'
                              : isDark ? 'border-slate-700' : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold">{test.test_name}</span>
                            <span className={`ml-2 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              ({test.test_type} • {test.date})
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          test.status === 'Passed'
                            ? isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                            : isDark ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className={`pt-4 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="text-xs text-slate-500">
              * Required fields
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Model' : 'Save Model'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
