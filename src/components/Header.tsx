import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  Award,
  CheckSquare,
  BookOpen,
  GraduationCap,
  FileCode2,
  LogIn,
  LogOut,
  ShieldCheck,
  Calendar,
  Cloud,
} from 'lucide-react';
import type { TeamMember, CloudSyncStatusInfo } from '../services/api';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: TeamMember | null;
  cloudSyncStatus?: CloudSyncStatusInfo | null;
  onTriggerCloudSync?: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenSearch: () => void;
  onOpenNewTask: () => void;
  onOpenNewMilestone: () => void;
  onOpenNewPaper: () => void;
  onOpenNewResource: () => void;
  onOpenNewNote: () => void;
  onOpenNewMeeting?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  cloudSyncStatus,
  onTriggerCloudSync,
  onOpenAuthModal,
  onLogout,
  onOpenSearch,
  onOpenNewTask,
  onOpenNewMilestone,
  onOpenNewPaper,
  onOpenNewResource,
  onOpenNewNote,
  onOpenNewMeeting,
}) => {
  const isDark = theme === 'dark';
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);

  return (
    <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors ${
      isDark ? 'bg-slate-950/85 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      {/* Left: Quick Search Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSearch}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all border w-72 md:w-80 ${
            isDark
              ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <span className="truncate">Search tasks, research, report...</span>
          <kbd className={`ml-auto px-2 py-0.5 rounded text-xs font-mono border ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-700 font-semibold'
          }`}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Theme, Auth / User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {showQuickAddDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQuickAddDropdown(false)}
              />
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <button
                  onClick={() => {
                    setShowQuickAddDropdown(false);
                    onOpenNewTask();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>New Project Task</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAddDropdown(false);
                    onOpenNewMilestone();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>New Milestone</span>
                </button>
                {onOpenNewMeeting && (
                  <button
                    onClick={() => {
                      setShowQuickAddDropdown(false);
                      onOpenNewMeeting();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Schedule Meeting</span>
                  </button>
                )}
                <div className={`my-1.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />
                <button
                  onClick={() => {
                    setShowQuickAddDropdown(false);
                    onOpenNewPaper();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Add Research Paper</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAddDropdown(false);
                    onOpenNewResource();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Add Learning Link</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAddDropdown(false);
                    onOpenNewNote();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors font-medium ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Create Engineering Note</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 24/7 Cloud Sync Badge */}
        <button
          onClick={onTriggerCloudSync}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            cloudSyncStatus?.lastSyncStatus === 'syncing'
              ? isDark
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-800'
              : cloudSyncStatus?.lastSyncStatus === 'failed'
              ? isDark
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-300 text-rose-800'
              : isDark
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
          }`}
          title={`24/7 Cloud Sync Vault: ${
            cloudSyncStatus?.lastSyncTime
              ? `Last synced at ${new Date(cloudSyncStatus.lastSyncTime).toLocaleTimeString()}`
              : 'Auto-backed up to persistent vault'
          } (Click to Sync Now)`}
        >
          <span className={`w-2 h-2 rounded-full ${
            cloudSyncStatus?.lastSyncStatus === 'syncing'
              ? 'bg-amber-500 animate-ping'
              : cloudSyncStatus?.lastSyncStatus === 'failed'
              ? 'bg-rose-500'
              : 'bg-emerald-500'
          }`} />
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">
            {cloudSyncStatus?.lastSyncStatus === 'syncing'
              ? 'Syncing to Cloud...'
              : cloudSyncStatus?.lastSyncStatus === 'failed'
              ? 'Cloud Sync Alert'
              : 'Cloud Synced'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Auth / Profile Dropdown */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
              }`}
            >
              <UserAvatar name={currentUser.name} size="sm" />
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    currentUser.role === 'admin'
                      ? isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      : isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <span className={`block text-xs leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser.email}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-xl py-2 z-50 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className={`px-4 py-3 border-b text-sm space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{currentUser.name}</span>
                      {currentUser.role === 'admin' && (
                        <ShieldCheck className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.email}</p>
                    <div className="pt-1">
                      <span className="text-xs text-cyan-600 dark:text-cyan-400 uppercase font-semibold">
                        Role: {currentUser.role === 'admin' ? 'Project Administrator' : 'Team Member'}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
