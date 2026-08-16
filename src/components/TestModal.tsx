import React, { useState } from 'react';
import { X, FlaskConical, Upload, FileSpreadsheet } from 'lucide-react';
import type { TeamMember } from '../services/api';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveManual: (test: any) => Promise<any>;
  onUploadCsv: (formData: FormData) => Promise<any>;
  team: TeamMember[];
  theme?: 'dark' | 'light';
}

export const TestModal: React.FC<TestModalProps> = ({
  isOpen,
  onClose,
  onSaveManual,
  onUploadCsv,
  team,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'csv' | 'manual'>('csv');
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('Dyno Test');
  const [performedById, setPerformedById] = useState(team[0]?.id || '');
  const [status, setStatus] = useState('Passed');
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState('');
  const [hardwareSetup, setHardwareSetup] = useState('');
  const [supplyVoltageV, setSupplyVoltageV] = useState('');
  const [supplyCurrentA, setSupplyCurrentA] = useState('');
  const [pwmFreqKhz, setPwmFreqKhz] = useState('20');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      alert('Please enter a test run name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'csv') {
        if (!csvFile) {
          alert('Please select a CSV file to upload.');
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('csv_file', csvFile);
        formData.append('test_name', testName.trim());
        formData.append('test_type', testType);
        formData.append('performed_by_id', performedById);
        formData.append('observations', observations.trim());
        formData.append('result', result.trim());
        formData.append('hardware_setup', hardwareSetup.trim());

        await onUploadCsv(formData);
      } else {
        await onSaveManual({
          test_name: testName.trim(),
          test_type: testType,
          performed_by_id: performedById || undefined,
          status,
          observations: observations.trim(),
          result: result.trim(),
          hardware_setup: hardwareSetup.trim(),
          supply_voltage_v: supplyVoltageV ? parseFloat(supplyVoltageV) : null,
          supply_current_a: supplyCurrentA ? parseFloat(supplyCurrentA) : null,
          pwm_freq_khz: pwmFreqKhz ? parseFloat(pwmFreqKhz) : null,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save test record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Log Hardware Test / Upload CSV
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setTab('csv')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'csv'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Test CSV Data</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'manual'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Manual Test Entry</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className={labelClass}>Test Run Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 24V Dyno Torque Step Test @ 2000 RPM"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className={inputClass}
              >
                <option value="Dyno Test">Dyno Test</option>
                <option value="Thermal Test">Thermal Test</option>
                <option value="Current Step Response">Current Step Response</option>
                <option value="Efficiency Curve">Efficiency Curve</option>
                <option value="CAN-FD Protocol">CAN-FD Protocol</option>
                <option value="Encoder Calibration">Encoder Calibration</option>
                <option value="General Validation">General Validation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Conducted By</label>
              <select
                value={performedById}
                onChange={(e) => setPerformedById(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Member</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tab === 'csv' ? (
            <div className={`space-y-2 p-4 rounded-xl border border-dashed text-center ${
              isDark
                ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
                : 'border-cyan-400 bg-cyan-50 text-cyan-900'
            }`}>
              <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
              <div>
                <label className={`font-bold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {csvFile ? csvFile.name : 'Select CSV Measurement File'}
                </label>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Headers supported: time_ms, speed_rpm, current_a, torque_nm, temp_c, voltage_v
                </p>
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="24.0"
                  value={supplyVoltageV}
                  onChange={(e) => setSupplyVoltageV(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Current (A)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="15.0"
                  value={supplyCurrentA}
                  onChange={(e) => setSupplyCurrentA(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>PWM (kHz)</label>
                <input
                  type="number"
                  placeholder="20"
                  value={pwmFreqKhz}
                  onChange={(e) => setPwmFreqKhz(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Test Outcome / Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="In Progress">In Progress</option>
                <option value="Inconclusive">Inconclusive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Hardware Setup Rig</label>
              <input
                type="text"
                placeholder="e.g. Dyno Bench A, Tektronix MSO 4-Ch, STM32G431"
                value={hardwareSetup}
                onChange={(e) => setHardwareSetup(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Observations & Key Findings</label>
            <textarea
              rows={2}
              placeholder="e.g. Current ripple below 2%, MOSFET thermal steady-state at 48°C after 15 min..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Test Result Summary</label>
            <input
              type="text"
              placeholder="e.g. Verified 94.2% inverter efficiency at rated 15A load"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className={`flex items-center justify-end gap-2.5 pt-3.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : tab === 'csv' ? 'Upload & Parse CSV' : 'Save Test Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
