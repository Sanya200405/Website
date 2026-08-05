import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, Bell, ChevronDown, UserCheck } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onOpenSearch: () => void;
  onOpenNewTask: () => void;
  onOpenNewMeeting: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  users,
  onSelectUser,
  onOpenSearch,
  onOpenNewTask,
  onOpenNewMeeting,
}) => {
  const isDark = theme === 'dark';
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors ${
      isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      {/* Left: Quick Search Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSearch}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs transition-all border w-72 ${
            isDark
              ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search tasks, docs, components, test logs...</span>
          <kbd className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono border ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
          }`}>
            ⌘K
          </kbd>
        </button>

        {/* Project Tag */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
          isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>FOC Drive & Planetary Reduction</span>
        </div>
      </div>

      {/* Right: Quick Actions, Theme, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          <button
            onClick={onOpenNewMeeting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Meeting</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg border text-slate-400 hover:text-slate-200 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 ring-2 ring-slate-950" />
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-xl z-50 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold">Notifications</span>
                <span className="text-[10px] text-cyan-400 font-medium">3 New</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="font-semibold text-cyan-300">Phase 3 FOC Development</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Akanksha completed Clarke/Park transform module.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <p className="font-semibold">Experiment #03 Update</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Rohan logged current loop oscillation findings.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <p className="font-semibold">Upcoming Meeting</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Weekly FOC Sync on Friday at 4:00 PM.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-lg border transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Switcher / Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-slate-100 border-slate-200 hover:border-slate-300'
            }`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-500/50"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showUserDropdown && (
            <div className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl z-50 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="p-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold">Switch Team Account</p>
                <p className="text-[10px] text-slate-400">Select active user context</p>
              </div>

              <div className="space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      currentUser.id === u.id
                        ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700'
                        : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-md object-cover" />
                      <div className="text-left">
                        <p className="font-semibold leading-tight">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.role}</p>
                      </div>
                    </div>
                    {currentUser.id === u.id && <UserCheck className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
