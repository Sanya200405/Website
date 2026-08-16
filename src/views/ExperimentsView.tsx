import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { AppState } from '../services/store';
import { api, type TestMeasurement, type TestItem } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface TestingViewProps {
  state: AppState;
  onOpenNewTest: () => void;
  onDeleteTest: (id: string) => void;
}

export const ExperimentsView: React.FC<TestingViewProps> = ({
  state,
  onOpenNewTest,
  onDeleteTest,
}) => {
  const isDark = state.theme === 'dark';
  const { tests, stats } = state;

  const [selectedTestId, setSelectedTestId] = useState<string | null>(tests[0]?.id || null);
  const [measurements, setMeasurements] = useState<TestMeasurement[]>([]);
  const [activePlot, setActivePlot] = useState<'speed' | 'current' | 'torque' | 'temp' | 'voltage'>('speed');
  const [isLoadingPlot, setIsLoadingPlot] = useState(false);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!selectedTestId && tests.length > 0) {
      setSelectedTestId(tests[0].id);
    }
  }, [tests, selectedTestId]);

  useEffect(() => {
    if (selectedTestId) {
      setIsLoadingPlot(true);
      api
        .getTestMeasurements(selectedTestId)
        .then((data) => setMeasurements(data))
        .catch(() => setMeasurements([]))
        .finally(() => setIsLoadingPlot(false));
    } else {
      setMeasurements([]);
    }
  }, [selectedTestId]);

  const selectedTest = tests.find((t) => t.id === selectedTestId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Passed':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'Failed':
        return isDark
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold'
          : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'In Progress':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      case 'Inconclusive':
      default:
        return isDark
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold'
          : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const confirmDeleteTest = (test: TestItem) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Test Record to Trash?',
      message: `Are you sure you want to move test run "${test.test_name}" and its measurements to the Trash Vault? It can be recovered anytime.`,
      onConfirm: () => {
        onDeleteTest(test.id);
        if (selectedTestId === test.id) {
          setSelectedTestId(null);
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <FlaskConical className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Testing & Experimental Results
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Record experimental motor runs, dyno measurements, thermal tests, and upload CSV datasets for time-series visualization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewTest}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Test / Upload CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Tests Logged</span>
          <p className="text-2xl font-bold font-mono mt-1">{stats.totalTests}</p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Successful Passes</span>
          <p className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">{stats.completedTests}</p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pass Rate</span>
          <p className="text-2xl font-bold font-mono mt-1 text-cyan-600 dark:text-cyan-400">
            {stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0}%
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${cardBgClass}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Selection Datasets</span>
          <p className="text-2xl font-bold font-mono mt-1 text-purple-600 dark:text-purple-400">
            {measurements.length} pts
          </p>
        </div>
      </div>

      {/* Main Workspace: Left Test List & Right Dynamic Charts */}
      {tests.length === 0 ? (
        <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
          <FlaskConical className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No test runs recorded</h3>
          <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            Add manual test logs or upload hardware CSV data from dyno testing to graph speed, torque, current, and temperature curves.
          </p>
          <button
            onClick={onOpenNewTest}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Test</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Test Run List (1 Col) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Experimental Runs ({tests.length})
            </h3>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {tests.map((t) => {
                const isSelected = t.id === selectedTestId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTestId(t.id)}
                    className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-100 shadow-sm'
                          : 'bg-cyan-50 border-cyan-300 text-slate-900 shadow-sm'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.date}
                      </span>
                    </div>

                    <h4 className={`font-bold truncate mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {t.test_name}
                    </h4>

                    <div className={`flex items-center justify-between text-xs pt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>{t.test_type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{t.measurement_count || 0} pts</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteTest(t);
                          }}
                          className={`p-1 transition-colors ${isDark ? 'hover:text-rose-400 text-slate-500' : 'hover:text-rose-600 text-slate-400'}`}
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Test Details & Interactive Chart (2 Cols) */}
          <div className={`lg:col-span-2 p-6 md:p-7 rounded-2xl border flex flex-col justify-between ${cardBgClass}`}>
            {selectedTest ? (
              <div className="space-y-6">
                {/* Test Metadata Header */}
                <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                        {selectedTest.test_type}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusBadge(selectedTest.status)}`}>
                        {selectedTest.status}
                      </span>
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {selectedTest.test_name}
                    </h2>
                    <p className={`text-sm mt-1 max-w-xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {selectedTest.observations || selectedTest.result || 'No observation notes entered.'}
                    </p>
                  </div>

                  <div className={`text-right text-xs space-y-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div>Date: {selectedTest.date}</div>
                    {selectedTest.performed_by_name && (
                      <div>Conducted by: {selectedTest.performed_by_name}</div>
                    )}
                  </div>
                </div>

                {/* Operating Parameters */}
                {(selectedTest.supply_voltage_v || selectedTest.supply_current_a || selectedTest.pwm_freq_khz || selectedTest.hardware_setup) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {selectedTest.supply_voltage_v && (
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                        <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Supply Voltage</span>
                        <span className={`text-base font-bold font-mono mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {selectedTest.supply_voltage_v} V
                        </span>
                      </div>
                    )}
                    {selectedTest.supply_current_a && (
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                        <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Supply Current</span>
                        <span className={`text-base font-bold font-mono mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {selectedTest.supply_current_a} A
                        </span>
                      </div>
                    )}
                    {selectedTest.pwm_freq_khz && (
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                        <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>PWM Frequency</span>
                        <span className={`text-base font-bold font-mono mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {selectedTest.pwm_freq_khz} kHz
                        </span>
                      </div>
                    )}
                    {selectedTest.hardware_setup && (
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                        <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hardware Setup</span>
                        <span className={`text-sm font-semibold truncate mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={selectedTest.hardware_setup}>
                          {selectedTest.hardware_setup}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Plot Controls & Multi-Curve Graph */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      Measurement Response Curves
                    </h3>

                    {measurements.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setActivePlot('speed')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlot === 'speed'
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Speed (RPM)
                        </button>
                        <button
                          onClick={() => setActivePlot('current')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlot === 'current'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Current (A)
                        </button>
                        <button
                          onClick={() => setActivePlot('torque')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlot === 'torque'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Torque (Nm)
                        </button>
                        <button
                          onClick={() => setActivePlot('temp')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlot === 'temp'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Temp (°C)
                        </button>
                        <button
                          onClick={() => setActivePlot('voltage')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activePlot === 'voltage'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Voltage (V)
                        </button>
                      </div>
                    )}
                  </div>

                  {isLoadingPlot ? (
                    <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                      Loading high-frequency measurement data...
                    </div>
                  ) : measurements.length === 0 ? (
                    <div className={`h-72 flex flex-col items-center justify-center rounded-xl border text-center p-6 ${
                      isDark ? 'border-slate-800/80 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <p className="text-sm font-semibold">No raw time-series measurements recorded for this run.</p>
                      <p className="text-xs mt-1">Upload a CSV file during test creation to generate instant performance graphs.</p>
                    </div>
                  ) : (
                    <div className="h-80 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={measurements} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                          <XAxis
                            dataKey="time_ms"
                            unit="ms"
                            stroke={isDark ? '#94a3b8' : '#475569'}
                            fontSize={11}
                          />
                          <YAxis
                            stroke={isDark ? '#94a3b8' : '#475569'}
                            fontSize={11}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isDark ? '#334155' : '#cbd5e1',
                              borderRadius: '12px',
                              fontSize: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          {activePlot === 'speed' && (
                            <Line
                              type="monotone"
                              dataKey="speed_rpm"
                              name="Speed (RPM)"
                              stroke="#06b6d4"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          )}
                          {activePlot === 'current' && (
                            <Line
                              type="monotone"
                              dataKey="current_a"
                              name="Current (A)"
                              stroke="#0284c7"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          )}
                          {activePlot === 'torque' && (
                            <Line
                              type="monotone"
                              dataKey="torque_nm"
                              name="Torque (Nm)"
                              stroke="#d97706"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          )}
                          {activePlot === 'temp' && (
                            <Line
                              type="monotone"
                              dataKey="temp_c"
                              name="Temperature (°C)"
                              stroke="#e11d48"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          )}
                          {activePlot === 'voltage' && (
                            <Line
                              type="monotone"
                              dataKey="voltage_v"
                              name="Voltage (V)"
                              stroke="#9333ea"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                Select a test run to inspect measurement results.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Move to Trash"
        confirmVariant="danger"
        theme={state.theme}
      />
    </div>
  );
};
