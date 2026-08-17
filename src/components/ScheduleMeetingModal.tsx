import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Link2, MapPin, AlignLeft, FileText, Bell } from 'lucide-react';
import type { MeetingItem } from '../services/api';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MeetingItem>) => Promise<any>;
  meeting?: MeetingItem | null;
  initialDate?: string;
  theme?: 'dark' | 'light';
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  meeting,
  initialDate,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState<'none' | '10_mins' | '30_mins' | '1_hour' | '1_day'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || '');
      setDate(meeting.date || '');
      setStartTime(meeting.start_time || '10:00');
      setEndTime(meeting.end_time || '');
      setMeetingLink(meeting.meeting_link || '');
      setLocation(meeting.location || '');
      setDescription(meeting.description || '');
      setNotes(meeting.notes || '');
      setReminder(meeting.reminder || 'none');
    } else {
      const today = initialDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDate(today);
      setStartTime('10:00');
      setEndTime('11:00');
      setMeetingLink('');
      setLocation('');
      setDescription('');
      setNotes('');
      setReminder('none');
    }
    setErrorMsg(null);
  }, [meeting, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Meeting title is required.');
      return;
    }
    if (!date.trim()) {
      setErrorMsg('Meeting date is required.');
      return;
    }
    if (!startTime.trim()) {
      setErrorMsg('Start time is required.');
      return;
    }

    let cleanLink = meetingLink.trim();
    if (cleanLink) {
      if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
        cleanLink = 'https://' + cleanLink;
      }
      try {
        new URL(cleanLink);
      } catch {
        setErrorMsg('Please enter a valid meeting URL (e.g. Google Meet, Zoom, MS Teams).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        date: date.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        meeting_link: cleanLink,
        location: location.trim(),
        description: description.trim(),
        notes: notes.trim(),
        reminder,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save meeting:', err);
      setErrorMsg(err.message || 'Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `font-semibold text-xs tracking-wide flex items-center gap-1.5 ${
    isDark ? 'text-slate-300' : 'text-slate-700'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {meeting ? 'Edit Team Meeting' : 'Schedule Team Meeting'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Coordinate agendas, assign sync dates, and link video calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border ${
              isDark
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Title */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <span>Meeting Title</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FOC Inverter Stage Review / Sprint Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Date, Start Time, End Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Start Time</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Meeting Link & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className={labelClass}>
                <Link2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>Meeting Link (Google Meet, Zoom, Teams)</span>
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hardware Lab 3 / Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Reminder Preference */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Reminder Setting</span>
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value as any)}
              className={inputClass}
            >
              <option value="none">None</option>
              <option value="10_mins">10 minutes before</option>
              <option value="30_mins">30 minutes before</option>
              <option value="1_hour">1 hour before</option>
              <option value="1_day">1 day before</option>
            </select>
          </div>

          {/* Description / Agenda */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
              <span>Agenda / Description</span>
            </label>
            <textarea
              rows={3}
              placeholder="Outline key discussion items, dyno test reviews, hardware schematics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Meeting Notes */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <FileText className="w-3.5 h-3.5 text-violet-500" />
              <span>Meeting Notes (Decisions, Action Items)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Key conclusions, action items decided during the meeting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{meeting ? 'Save Changes' : 'Schedule Meeting'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
