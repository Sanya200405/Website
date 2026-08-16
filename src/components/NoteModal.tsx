import React, { useState, useEffect, useRef } from 'react';
import { X, FileCode2, Heading1, Heading2, Bold, Italic, List, Table as TableIcon } from 'lucide-react';
import type { EngineeringNote } from '../services/api';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<EngineeringNote>) => Promise<any>;
  note?: EngineeringNote | null;
  theme?: 'dark' | 'light';
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const nextContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(nextContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <FileCode2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {note ? 'Edit Engineering Note' : 'Create Engineering Note'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className={labelClass}>Note Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Current Sense Shunt Resistor & Op-Amp Gain Calculations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Quick Toolbar */}
          <div className={`flex items-center gap-1.5 p-2 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <button
              type="button"
              onClick={() => insertFormatting('# ', '')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ', '')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ', '')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('| Parameter | Value |\n|---|---|\n| R_shunt | 0.005 Ohm |\n')}
              className={`p-1.5 rounded text-xs transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-800'}`}
              title="Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Note Content (Markdown / Code / Formulas)</label>
            <textarea
              ref={textareaRef}
              rows={8}
              required
              placeholder="Write your calculations, pinout definitions, pseudocode, or design justifications..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full px-3.5 py-2.5 font-mono text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Shunt, OpAmp, ADC, STM32G4"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
