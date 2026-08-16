import React, { useState } from 'react';
import { X, FolderGit2, Upload } from 'lucide-react';
import type { TeamMember } from '../services/api';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<any>;
  team: TeamMember[];
  theme?: 'dark' | 'light';
}

export const DocModal: React.FC<DocModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  team,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('Datasheet');
  const [description, setDescription] = useState('');
  const [uploadedById, setUploadedById] = useState(team[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('uploaded_by_id', uploadedById);

      await onUpload(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `font-semibold text-xs tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Upload Project Document
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
          <div className={`space-y-2 p-4 rounded-xl border border-dashed text-center ${
            isDark
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
              : 'border-cyan-400 bg-cyan-50 text-cyan-900'
          }`}>
            <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto" />
            <div>
              <label className={`font-bold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {file ? file.name : 'Select File to Upload'}
              </label>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                PDFs, Gerbers, CAD models, schematics, CSV, images (Max 50MB)
              </p>
            </div>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>Document Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputClass}
              >
                <option value="Datasheet">Datasheet</option>
                <option value="Schematic">Schematic</option>
                <option value="PCB Layout">PCB Layout</option>
                <option value="Firmware">Firmware</option>
                <option value="CAD Model">CAD Model</option>
                <option value="Test Report">Test Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Uploaded By</label>
              <select
                value={uploadedById}
                onChange={(e) => setUploadedById(e.target.value)}
                className={inputClass}
              >
                <option value="">Select Member</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Texas Instruments DRV8301 datasheet with SPI configuration notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
