import React, { useState, useEffect } from 'react';
import {
  Cpu,
  GitBranch,
  GitCommit,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  FolderGit2,
  FileCode,
  FileText,
  FlaskConical,
  Search,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import type { AppState } from '../services/store';
import { api, type SimulationModel, type GitHubTreeItem, type GitHubBranchData } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface DevelopmentViewProps {
  state: AppState;
  onOpenNewSimulation: () => void;
  onEditSimulation: (sim: SimulationModel) => void;
  onDeleteSimulation: (id: string) => void;
  onRefreshAll: () => Promise<void>;
}

export const DevelopmentView: React.FC<DevelopmentViewProps> = ({
  state,
  onOpenNewSimulation,
  onEditSimulation,
  onDeleteSimulation,
  onRefreshAll,
}) => {
  const isDark = state.theme === 'dark';
  const { gitHubRepo, gitHubCommits, simulations, tests } = state;

  const [activeTab, setActiveTab] = useState<'repo' | 'simulink' | 'activity' | 'files'>('repo');
  const [copiedClone, setCopiedClone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedModelIds, setExpandedModelIds] = useState<Record<string, boolean>>({});
  const [treeItems, setTreeItems] = useState<GitHubTreeItem[]>([]);
  const [branches, setBranches] = useState<GitHubBranchData[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const repoUrl = gitHubRepo?.htmlUrl || 'https://github.com/Ehna12/Field-Oriented-Control-of-BLDC-motor';
  const cloneCommand = `git clone ${repoUrl}.git`;

  useEffect(() => {
    if (activeTab === 'files') {
      setIsLoadingFiles(true);
      Promise.all([
        api.getGitHubBranches().catch(() => [{ name: 'main', commitSha: '' }]),
        api.getGitHubTree(selectedBranch).catch(() => []),
      ])
        .then(([bData, tData]) => {
          setBranches(bData);
          setTreeItems(tData);
        })
        .finally(() => setIsLoadingFiles(false));
    }
  }, [activeTab, selectedBranch]);

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshAll();
    setIsRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedModelIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const confirmDelete = (model: SimulationModel) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Simulation Model to Trash?',
      message: `Are you sure you want to move "${model.name}" to the Trash Vault? It can be restored anytime.`,
      onConfirm: () => {
        onDeleteSimulation(model.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const filteredSimulations = simulations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.purpose && s.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.github_path && s.github_path.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SimulationModel['status']) => {
    switch (status) {
      case 'Validated':
        return isDark
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'In Development':
        return isDark
          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
          : 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Planning':
        return isDark
          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Deprecated':
      default:
        return isDark
          ? 'bg-slate-800 text-slate-400 border-slate-700'
          : 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-slate-950/20 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                <GithubIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Technical Development & Simulink
                </h1>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                  <span>Ehna12/Field-Oriented-Control-of-BLDC-motor</span>
                </div>
              </div>
            </div>
            <p className={`text-sm max-w-2xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Centralized engineering hub linking our live GitHub repository, MATLAB/Simulink models, test objectives, and experimental verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl border transition-all ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title="Refresh GitHub and Simulation data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-500' : ''}`} />
            </button>

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white shadow-sm transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Open GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={onOpenNewSimulation}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Simulation Model</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('repo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'repo'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GithubIcon className="w-4 h-4" />
          <span>GitHub Repository</span>
        </button>

        <button
          onClick={() => setActiveTab('simulink')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'simulink'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Simulink & Models</span>
          {simulations.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
            }`}>
              {simulations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'activity'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Development Activity</span>
          {gitHubCommits.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {gitHubCommits.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'files'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Code & Model Files</span>
        </button>
      </div>

      {/* Tab 1: GitHub Repository Overview */}
      {activeTab === 'repo' && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className={`p-6 md:p-8 rounded-2xl border ${cardBgClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                    isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                  }`}>
                    Public Repository
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Default Branch: <strong>{gitHubRepo?.defaultBranch || 'main'}</strong>
                  </span>
                </div>

                <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {gitHubRepo?.name || 'Field-Oriented-Control-of-BLDC-motor'}
                </h2>

                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {gitHubRepo?.description || 'Field-Oriented Control (FOC) of BLDC Motor with Planetary Gearhead, MATLAB/Simulink simulation models, and embedded control firmware.'}
                </p>

                {/* Clone Command Box */}
                <div className="pt-2">
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    Clone Repository via HTTPS:
                  </label>
                  <div className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}>
                    <span className="truncate mr-3 select-all">{cloneCommand}</span>
                    <button
                      onClick={handleCopyClone}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        copiedClone
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {copiedClone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedClone ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3.5 sm:w-80 flex-shrink-0">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Commits Logged</span>
                  <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {gitHubCommits.length}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Simulink Models</span>
                  <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {simulations.length}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hardware Tests</span>
                  <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {tests.length}
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Linked Issues</span>
                  <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                    {state.stats.openIssues}
                  </span>
                </div>
              </div>
            </div>

            {/* Architecture Separation Principles */}
            <div className={`mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ${
              isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
            }`}>
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5 text-cyan-600 dark:text-cyan-400">
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub: Source of Truth for Code & Binary Models</span>
                </div>
                <p className="leading-relaxed text-slate-400 dark:text-slate-400">
                  MATLAB `.slx` model binaries, initialization `.m` scripts, C firmware, and version control branches reside on GitHub. No unnecessary duplicate binary copies are stored on the website.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5 text-purple-600 dark:text-purple-400">
                  <Layers className="w-4 h-4" />
                  <span>Website: Central Management & Experimental Traceability</span>
                </div>
                <p className="leading-relaxed text-slate-400 dark:text-slate-400">
                  The website records technical objectives, parameters, simulation observations, links models to hardware dyno test runs, and compiles evidence into final report chapters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Simulink Models Management */}
      {activeTab === 'simulink' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search documented models, objectives, or parameters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border focus:outline-none font-semibold ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Statuses</option>
                <option value="In Development">In Development</option>
                <option value="Validated">Validated</option>
                <option value="Planning">Planning</option>
                <option value="Deprecated">Deprecated</option>
              </select>
            </div>

            <button
              onClick={onOpenNewSimulation}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Simulation Model</span>
            </button>
          </div>

          {/* Simulation Models List */}
          {filteredSimulations.length === 0 ? (
            <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${
              isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'
            }`}>
              <Cpu className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {simulations.length === 0 ? 'No simulation models documented yet.' : 'No matching simulation models found.'}
              </h3>
              <p className={`text-sm max-w-md mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                {simulations.length === 0
                  ? 'Document your MATLAB/Simulink models, define control objectives and solver parameters, and connect them to real hardware dyno test runs.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {simulations.length === 0 && (
                <button
                  onClick={onOpenNewSimulation}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Simulation Model</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSimulations.map((model) => {
                const isExpanded = expandedModelIds[model.id] ?? false;
                const githubModelUrl = model.github_path?.startsWith('http')
                  ? model.github_path
                  : model.github_path
                  ? `${repoUrl}/blob/main/${model.github_path}`
                  : repoUrl;

                return (
                  <div
                    key={model.id}
                    className={`p-6 rounded-2xl border transition-all space-y-4 ${cardBgClass}`}
                  >
                    {/* Model Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadge(model.status)}`}>
                            {model.status}
                          </span>
                          {model.milestone_title && (
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                              isDark ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              ◈ {model.milestone_title}
                            </span>
                          )}
                          {model.github_path && (
                            <a
                              href={githubModelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded-lg border transition-colors ${
                                isDark
                                  ? 'bg-slate-950 border-slate-800 text-cyan-400 hover:border-cyan-500/50'
                                  : 'bg-slate-50 border-slate-300 text-cyan-700 hover:border-cyan-500'
                              }`}
                              title="Open model file on GitHub"
                            >
                              <GithubIcon className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{model.github_path}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          )}
                        </div>

                        <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {model.name}
                        </h3>

                        {model.description && (
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {model.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start flex-shrink-0">
                        {model.github_path && (
                          <a
                            href={githubModelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-xl border transition-colors ${
                              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                            }`}
                            title="Open in GitHub"
                          >
                            <GithubIcon className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => onEditSimulation(model)}
                          className={`p-2 rounded-xl border transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                          title="Edit Model Specification"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => confirmDelete(model)}
                          className={`p-2 rounded-xl border transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400' : 'border-slate-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                          }`}
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleExpand(model.id)}
                          className={`p-2 rounded-xl border transition-colors ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-cyan-400' : 'border-slate-300 hover:bg-slate-100 text-cyan-700'
                          }`}
                          title={isExpanded ? 'Collapse Spec' : 'Expand Full Specification'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Purpose / Objective Quick Line */}
                    {model.purpose && (
                      <div className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${
                        isDark ? 'bg-slate-950/50 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex-shrink-0">Purpose:</span>
                        <span>{model.purpose}</span>
                      </div>
                    )}

                    {/* Expandable Technical Specification */}
                    {isExpanded && (
                      <div className={`pt-4 border-t space-y-4 text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {model.objective && (
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-slate-400">Objective</span>
                              <p className="leading-relaxed">{model.objective}</p>
                            </div>
                          )}

                          {model.parameters && (
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-slate-400">Simulation Parameters</span>
                              <p className="leading-relaxed font-mono whitespace-pre-line">{model.parameters}</p>
                            </div>
                          )}

                          {model.inputs && (
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-slate-400">Input Conditions</span>
                              <p className="leading-relaxed">{model.inputs}</p>
                            </div>
                          )}

                          {model.expected_output && (
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-slate-400">Expected Outputs</span>
                              <p className="leading-relaxed">{model.expected_output}</p>
                            </div>
                          )}

                          {model.results && (
                            <div className={`p-3.5 rounded-xl border md:col-span-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-emerald-500">Observed Results</span>
                              <p className="leading-relaxed whitespace-pre-line">{model.results}</p>
                            </div>
                          )}

                          {model.conclusion && (
                            <div className={`p-3.5 rounded-xl border md:col-span-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="font-bold block mb-1 text-purple-400">Conclusion & Interpretation</span>
                              <p className="leading-relaxed whitespace-pre-line">{model.conclusion}</p>
                            </div>
                          )}
                        </div>

                        {/* Linked Experiments */}
                        {model.linked_experiments && model.linked_experiments.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 block">
                              Linked Hardware Dyno Tests ({model.linked_experiments.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {model.linked_experiments.map((exp) => (
                                <div
                                  key={exp.link_id}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className="w-3.5 h-3.5 text-cyan-500" />
                                    <span className="font-semibold">{exp.test_name}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    exp.test_status === 'Passed'
                                      ? isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                                      : isDark ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {exp.test_status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Development Activity / Recent Commits */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          <div className={`p-6 rounded-2xl border ${cardBgClass}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Recent Technical Development Timeline
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Recent commits directly from GitHub for <code>{gitHubRepo?.fullName || 'Ehna12/Field-Oriented-Control-of-BLDC-motor'}</code>.
                </p>
              </div>

              <a
                href={`${repoUrl}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Git History</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {gitHubCommits.length === 0 ? (
              <div className={`p-10 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                No recent commit data retrieved from GitHub API. Click "Open GitHub Repository" to view commit logs directly.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 dark:divide-slate-800 mt-2">
                {gitHubCommits.map((c) => (
                  <div key={c.sha} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={c.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          {c.shortSha}
                        </a>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.message}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>By <strong>{c.authorName}</strong></span>
                        <span>•</span>
                        <span>{new Date(c.authorDate).toLocaleDateString()} at {new Date(c.authorDate).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <a
                      href={c.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold self-start sm:self-auto transition-colors ${
                        isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>Inspect Commit</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Code & Model Files */}
      {activeTab === 'files' && (
        <div className="space-y-5">
          <div className={`p-6 rounded-2xl border ${cardBgClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Repository Structure & Model Files
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Simulink models, MATLAB scripts, and source code files from branch <code>{selectedBranch}</code>.
                </p>
              </div>

              {branches.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <GitBranch className="w-4 h-4 text-cyan-500" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none font-semibold ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isLoadingFiles ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading repository file structure from GitHub...
              </div>
            ) : treeItems.length === 0 ? (
              <div className={`p-10 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                No file tree retrieved. Visit the GitHub repository directly to view models and code.
              </div>
            ) : (
              <div className="space-y-1.5 mt-3 max-h-[500px] overflow-y-auto pr-1">
                {treeItems.map((item) => {
                  const isSimulink = item.path.endsWith('.slx') || item.path.endsWith('.mdl');
                  const isMatlab = item.path.endsWith('.m');
                  const isFirmware = item.path.endsWith('.c') || item.path.endsWith('.cpp') || item.path.endsWith('.h');

                  return (
                    <div
                      key={item.path}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {item.type === 'tree' ? (
                          <FolderGit2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : isSimulink ? (
                          <Cpu className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        ) : isMatlab ? (
                          <FileCode className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        ) : isFirmware ? (
                          <FileCode className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}

                        <span className="font-mono truncate">{item.path}</span>

                        {isSimulink && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            Simulink Model
                          </span>
                        )}
                        {isMatlab && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            MATLAB Script
                          </span>
                        )}
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-700'
                        }`}
                      >
                        <span>Open on GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
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
