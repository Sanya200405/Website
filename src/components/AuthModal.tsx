import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, UserPlus, LogIn, Sparkles } from 'lucide-react';
import type { TeamMember, AuthStatus } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authStatus: AuthStatus | null;
  theme?: 'dark' | 'light';
  onLogin: (data: { email: string; password: string }) => Promise<TeamMember>;
  onRegister: (data: { name: string; email: string; password: string; role?: 'admin' | 'member'; bio?: string }) => Promise<TeamMember>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authStatus,
  theme = 'dark',
  onLogin,
  onRegister,
}) => {
  const isDark = theme === 'dark';
  const isFirstTimeSetup = !authStatus || !authStatus.hasAdmin;
  const [mode, setMode] = useState<'login' | 'register'>(isFirstTimeSetup ? 'register' : 'login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus && !authStatus.hasAdmin) {
      setMode('register');
    }
  }, [authStatus]);

  if (!isOpen) return null;

  const isRegistering = isFirstTimeSetup || mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const finalName = name.trim() || email.split('@')[0];
        await onRegister({
          name: finalName,
          email: email.toLowerCase().trim(),
          password,
          role: isFirstTimeSetup ? 'admin' : 'member',
          bio: bio.trim(),
        });
      } else {
        await onLogin({
          email: email.toLowerCase().trim(),
          password,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            {isFirstTimeSetup ? (
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            ) : mode === 'login' ? (
              <LogIn className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            )}
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {isFirstTimeSetup
                ? 'Setup Project Administrator'
                : mode === 'login'
                ? 'Team Member Login'
                : 'Join Project Workspace'}
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

        {isFirstTimeSetup && (
          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            isDark
              ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
              : 'bg-cyan-50 border-cyan-200 text-cyan-900 font-medium'
          }`}>
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Welcome!</strong> No accounts exist yet. Creating your account now will establish you as the system <strong>Administrator</strong>.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className={`p-3.5 rounded-xl border text-xs font-medium ${
            isDark
              ? 'bg-rose-950/50 border-rose-800 text-rose-300'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className={`font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sanya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sanya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Password *
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1.5">
              <label className={`font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Role / Subsystem Focus (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Inverter Design & Gate Driver Circuitry"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          <div className={`flex items-center justify-between pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {!isFirstTimeSetup ? (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMsg(null);
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
              >
                {mode === 'login' ? "Don't have an account? Register" : 'Already registered? Log in'}
              </button>
            ) : <div />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing...'
                : isFirstTimeSetup
                ? 'Create Administrator Account'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
