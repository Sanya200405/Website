import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  requireTypedConfirmation?: string; // e.g. "RESTORE" for high-risk actions
  theme?: 'dark' | 'light';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Delete',
  confirmVariant = 'danger',
  requireTypedConfirmation,
  theme = 'dark',
  isLoading = false,
}) => {
  const isDark = theme === 'dark';
  const [typedValue, setTypedValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTypedValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = isLoading || (requireTypedConfirmation ? typedValue !== requireTypedConfirmation : false);

  const buttonStyle =
    confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : confirmVariant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-500 text-white'
      : 'bg-cyan-600 hover:bg-cyan-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              confirmVariant === 'danger'
                ? isDark ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-rose-100 text-rose-800 border border-rose-300'
                : isDark ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {message}
        </p>

        {requireTypedConfirmation && (
          <div className="space-y-2 pt-1">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Type <span className="font-mono font-bold text-rose-500">{requireTypedConfirmation}</span> to proceed:
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTypedConfirmation}
              className={`w-full px-3.5 py-2 text-sm font-mono rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        )}

        <div className={`flex items-center justify-end gap-2.5 pt-3.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 ${buttonStyle}`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : confirmVariant === 'danger' ? (
              <Trash2 className="w-4 h-4" />
            ) : null}
            <span>{isLoading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
