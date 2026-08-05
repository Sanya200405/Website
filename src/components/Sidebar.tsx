import React from 'react';
import {
  LayoutDashboard, Map, CheckSquare, Users, FileText,
  Search, Cpu, Code2, FlaskConical, Users2, Calendar as CalendarIcon,
  Award, GitCommit, FolderGit2, History, Settings, UserCheck, ShieldAlert
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'roadmap'
  | 'tasks'
  | 'team'
  | 'my-progress'
  | 'documentation'
  | 'components'
  | 'hardware'
  | 'firmware'
  | 'research'
  | 'experiments'
  | 'issues'
  | 'decisions'
  | 'meetings'
  | 'calendar'
  | 'milestones'
  | 'files'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentNav: NavSection;
  onSelectNav: (section: NavSection) => void;
  theme: 'dark' | 'light';
  taskCount: number;
  issueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  theme,
  taskCount,
  issueCount,
}) => {
  const isDark = theme === 'dark';

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Project Roadmap', icon: Map },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: taskCount },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'my-progress', label: 'My Workload', icon: UserCheck },
    { id: 'documentation', label: 'Documentation', icon: FileText },
  ];

  const engineeringNav = [
    { id: 'components', label: 'Component DB', icon: Cpu },
    { id: 'hardware', label: 'Hardware Stage', icon: FolderGit2 },
    { id: 'firmware', label: 'Firmware & Code', icon: Code2 },
    { id: 'research', label: 'Research & Papers', icon: Search },
    { id: 'experiments', label: 'Experiments & Testing', icon: FlaskConical },
    { id: 'issues', label: 'Issue Tracker', icon: ShieldAlert, badge: issueCount, badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
    { id: 'decisions', label: 'Decision Log (ADR)', icon: GitCommit },
  ];

  const workflowNav = [
    { id: 'meetings', label: 'Meetings', icon: Users2 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'files', label: 'Project Files', icon: FolderGit2 },
    { id: 'activity', label: 'Activity & Audit', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (title: string, items: typeof mainNav) => (
    <div className="mb-5">
      <h3 className={`px-3 mb-2 text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id as NavSection)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  item.badgeColor || (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-200 text-slate-700')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className={`w-64 flex-shrink-0 flex flex-col border-r transition-colors h-screen sticky top-0 ${
      isDark ? 'bg-slate-950/90 border-slate-800/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-sm">
          FOC
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            FOC DRIVE HUB
          </h1>
          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            BLDC + Planetary Reducer
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {renderNavGroup('Core Workspace', mainNav)}
        {renderNavGroup('Engineering & R&D', engineeringNav)}
        {renderNavGroup('Project Management', workflowNav)}
      </div>

      {/* Project Status Footer */}
      <div className={`p-3 border-t text-[11px] ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Phase</span>
          <span className="text-cyan-400 font-bold text-[10px]">Phase 3 / 8</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full w-[32%]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Overall: 32%</span>
          <span>Moteus Study: 65%</span>
        </div>
      </div>
    </aside>
  );
};
