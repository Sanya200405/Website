import React from 'react';
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  FlaskConical,
  ShieldAlert,
  BookOpen,
  FileText,
  History,
  Settings,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import type { AppState } from '../services/store';

export type NavSection =
  | 'dashboard'
  | 'roadmap'
  | 'tasks'
  | 'development'
  | 'testing'
  | 'team'
  | 'issues'
  | 'knowledge'
  | 'report'
  | 'activity'
  | 'settings'
  | 'admin';

interface SidebarProps {
  currentNav: NavSection;
  onSelectNav: (section: NavSection) => void;
  state: AppState;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  state,
}) => {
  const isDark = state.theme === 'dark';
  const { stats, currentUser, researchPapers, reportSections, simulations } = state;
  const isAdmin = currentUser?.role === 'admin';

  const workspaceNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Project Progress', icon: Map, badge: stats.totalMilestones > 0 ? stats.totalMilestones : undefined },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: stats.activeTasks > 0 ? stats.activeTasks : undefined },
    { id: 'development', label: 'Development & Simulink', icon: Cpu, badge: simulations.length > 0 ? simulations.length : undefined },
    { id: 'testing', label: 'Testing & Results', icon: FlaskConical, badge: stats.totalTests > 0 ? stats.totalTests : undefined },
    { id: 'team', label: 'Team', icon: Users, badge: (stats.totalTeamMembers && stats.totalTeamMembers > 0) ? stats.totalTeamMembers : undefined },
    {
      id: 'issues',
      label: 'Issues / Blockers',
      icon: ShieldAlert,
      badge: stats.openIssues > 0 ? stats.openIssues : undefined,
      badgeColor: isDark
        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold'
        : 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
    },
  ];

  const knowledgeNav: NavItem[] = [
    {
      id: 'knowledge',
      label: 'Knowledge & Docs',
      icon: BookOpen,
      badge: (researchPapers.length + (stats.totalDocuments || 0)) > 0 ? (researchPapers.length + (stats.totalDocuments || 0)) : undefined,
    },
    {
      id: 'report',
      label: 'Report Workspace',
      icon: FileText,
      badge: reportSections.length > 0 ? reportSections.length : undefined,
    },
  ];

  const adminNav: NavItem[] = [
    { id: 'admin', label: 'Admin Console', icon: ShieldCheck, adminOnly: true },
    { id: 'activity', label: 'Activity Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (items: NavItem[]) => {
    return items.map((item) => {
      if (item.adminOnly && !isAdmin) return null;

      const Icon = item.icon;
      const isActive = currentNav === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onSelectNav(item.id)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive
              ? isDark
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 flex-shrink-0 ${
              isActive
                ? isDark ? 'text-cyan-400' : 'text-cyan-700'
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <span>{item.label}</span>
          </div>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              item.badgeColor || (
                isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-200 text-slate-800 border border-slate-300'
              )
            }`}>
              {item.badge}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <aside className={`w-64 flex-shrink-0 flex flex-col border-r transition-colors h-screen sticky top-0 ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 md:p-5 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-sm flex-shrink-0 ${
          isDark
            ? 'bg-slate-900 border border-slate-700 text-cyan-400'
            : 'bg-cyan-600 border border-cyan-700 text-white'
        }`}>
          FOC
        </div>
        <div className="overflow-hidden">
          <h1 className={`text-sm font-bold tracking-tight uppercase truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {state.project.name || 'FOC Drive Project'}
          </h1>
          <p className={`text-xs truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {state.project.status} • BLDC & Gearbox
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
        <div>
          <div className={`mb-1.5 px-3 text-xs font-bold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Project Tracking
          </div>
          <div className="space-y-1">
            {renderNavGroup(workspaceNav)}
          </div>
        </div>

        <div>
          <div className={`mb-1.5 px-3 text-xs font-bold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Research & Report
          </div>
          <div className="space-y-1">
            {renderNavGroup(knowledgeNav)}
          </div>
        </div>

        <div>
          <div className={`mb-1.5 px-3 text-xs font-bold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAdmin ? 'System & Admin' : 'System'}
          </div>
          <div className="space-y-1">
            {renderNavGroup(adminNav)}
          </div>
        </div>
      </div>

      {/* Overall Progress Footer */}
      <div className={`p-4 border-t text-sm ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-semibold text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Overall Progress</span>
          <span className={`font-bold text-xs ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{stats.overallProgress}%</span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden mb-2 border ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-200 border-slate-300'}`}>
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, stats.overallProgress))}%` }}
          />
        </div>
        <div className={`flex items-center justify-between text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>{stats.completedTasks} / {stats.totalTasks} Tasks</span>
          <span>{stats.completedMilestones} / {stats.totalMilestones} Phases</span>
        </div>
      </div>
    </aside>
  );
};
