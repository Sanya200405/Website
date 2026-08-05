import React from 'react';
import {
  CheckCircle2, Clock, ShieldAlert, Award, Calendar as CalendarIcon,
  TrendingUp, Users, ArrowUpRight, ChevronRight, Activity, Plus
} from 'lucide-react';
import type { AppState } from '../services/store';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import type { NavSection } from '../components/Sidebar';

interface DashboardViewProps {
  state: AppState;
  onNavigate: (section: NavSection) => void;
  onOpenNewTask: () => void;
  onOpenNewMeeting: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onOpenNewTask,
  onOpenNewMeeting,
}) => {
  const isDark = state.theme === 'dark';

  const completedTasks = state.tasks.filter(t => t.status === 'Completed').length;
  const activeTasks = state.tasks.filter(t => t.status === 'In Progress' || t.status === 'Under Review').length;
  const blockedTasks = state.tasks.filter(t => t.status === 'Blocked').length;
  const openIssues = state.issues.filter(i => i.status !== 'Closed' && i.status !== 'Fixed').length;
  const currentMilestone = state.milestones.find(m => m.isCurrent) || state.milestones[0];
  const nextMeeting = state.meetings[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Project Title & Progress */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all shadow-xl ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-slate-700 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                BLDC FOC Drive + Planetary Reduction
              </span>
              <span className="text-xs text-slate-400">Team R&D Control Center</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Development of an FOC Drive for BLDC Motor
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Open-Source Moteus Motor Controller Architecture Study, Custom 4-Layer Inverter PCB Design, STM32G4 FOC Algorithm, and 10:1 Planetary Gearbox Actuator Integration.
            </p>
          </div>

          {/* Large Overall Progress Dial */}
          <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex-shrink-0">
            <div className="text-center">
              <span className="text-2xl font-black text-cyan-400">32%</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Overall Progress</span>
            </div>
            <div className="w-24 bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full w-[32%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Overall Progress */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Progress</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-base font-extrabold text-cyan-400">32%</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Phase 3 of 8</p>
        </div>

        {/* Active Tasks */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Active</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-base font-extrabold text-sky-400">{activeTasks}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Tasks in flight</p>
        </div>

        {/* Completed Tasks */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-extrabold text-emerald-400">{completedTasks}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Done this sprint</p>
        </div>

        {/* Blocked Tasks */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Blocked</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-base font-extrabold text-rose-400">{blockedTasks}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Needs unblocking</p>
        </div>

        {/* Open Issues */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Issues</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-base font-extrabold text-amber-400">{openIssues}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Open engineering bugs</p>
        </div>

        {/* Current Milestone */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Milestone</span>
            <Award className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-base font-extrabold text-purple-400">{currentMilestone?.progressPercentage}%</p>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">{currentMilestone?.title}</p>
        </div>

        {/* Next Meeting */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Meeting</span>
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xs font-bold text-indigo-300 truncate">{nextMeeting?.date || 'Friday'}</p>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">{nextMeeting?.startTime || '4:00 PM'}</p>
        </div>

        {/* Team Productivity */}
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Team Load</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-base font-extrabold text-cyan-400">76%</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Optimal capacity</p>
        </div>
      </div>

      {/* Middle Grid: Architecture Diagram & Current Milestone Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Diagram (2 cols) */}
        <div className="lg:col-span-2">
          <ArchitectureDiagram theme={state.theme} />
        </div>

        {/* Current Milestone Card Focus (1 col) */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Active Milestone
              </span>
              <span className="text-xs font-extrabold text-purple-400">
                {currentMilestone?.progressPercentage}%
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-100 mb-1">
              {currentMilestone?.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {currentMilestone?.description}
            </p>

            {/* Subtask Checklist */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subtask Checklist ({currentMilestone?.subtasks.filter(s => s.completed).length} / {currentMilestone?.subtasks.length})
              </span>
              {currentMilestone?.subtasks.slice(0, 6).map(sub => (
                <div key={sub.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${sub.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('milestones')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition-all"
          >
            <span>View Full Milestone Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Upcoming Tasks/Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Recent Activity Feed</span>
            </h3>
            <button onClick={() => onNavigate('activity')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>View Audit Log</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {state.activities.slice(0, 5).map(act => (
              <div key={act.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <img src={act.personAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt={act.personName} className="w-7 h-7 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-slate-200">
                      {act.personName} <span className="font-normal text-slate-400">{act.action}</span>
                    </p>
                    <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{act.targetName}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks & Deadlines */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Upcoming Deadlines & Work</span>
            </h3>
            <button onClick={onOpenNewTask} className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {state.tasks.filter(t => t.status !== 'Completed').slice(0, 4).map(t => (
              <div key={t.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      t.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      t.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Deadline: {t.deadline}</span>
                  </div>
                  <p className="font-semibold text-slate-200">{t.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-cyan-400 font-semibold">{t.assignedToName}</span>
                  <span className="block text-[9px] text-slate-500">{t.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
