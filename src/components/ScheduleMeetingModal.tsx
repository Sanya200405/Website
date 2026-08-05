import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Meeting, User } from '../types';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meeting: Omit<Meeting, 'id'>) => void;
  users: User[];
  isDark: boolean;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users,
  isDark,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [locationOrLink, setLocationOrLink] = useState('Robotics Lab Room 304 / Zoom Link');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(users.map(u => u.name));
  const [agendaItems, setAgendaItems] = useState<string[]>([
    'Review current iteration progress',
    'Discuss pending hardware / firmware issues'
  ]);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const toggleParticipant = (name: string) => {
    if (selectedParticipants.includes(name)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== name));
    } else {
      setSelectedParticipants([...selectedParticipants, name]);
    }
  };

  const handleAddAgenda = () => {
    if (newAgendaItem.trim()) {
      setAgendaItems([...agendaItems, newAgendaItem.trim()]);
      setNewAgendaItem('');
    }
  };

  const handleRemoveAgenda = (idx: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      date,
      startTime,
      endTime,
      locationOrLink,
      participants: selectedParticipants,
      agenda: agendaItems,
      notes: 'Meeting scheduled.',
      decisions: [],
      actionItems: [],
      isRecurring
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-8 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight">Schedule Team Engineering Meeting</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Meeting Title */}
          <div>
            <label className="block font-semibold mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly FOC Development & Moteus Firmware Sync"
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Row 1: Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Location / Meeting Link */}
          <div>
            <label className="block font-semibold mb-1">Location / Video Link</label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="Room number or Zoom/Google Meet URL"
              className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block font-semibold mb-1">Select Participants</label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => {
                const isSelected = selectedParticipants.includes(u.name);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleParticipant(u.name)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-800/50 text-slate-400 border-slate-800'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pre-Meeting Agenda Builder */}
          <div>
            <label className="block font-semibold mb-1">Agenda Items</label>
            <div className="space-y-1.5 mb-2">
              {agendaItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                  <span className="text-slate-200">• {item}</span>
                  <button type="button" onClick={() => handleRemoveAgenda(idx)} className="text-rose-400 hover:text-rose-300 p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAgendaItem}
                onChange={(e) => setNewAgendaItem(e.target.value)}
                placeholder="Add agenda topic..."
                className={`flex-1 px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={handleAddAgenda}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/30"
              >
                + Add Topic
              </button>
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="recurring" className="text-slate-300 font-medium cursor-pointer">
              Set as recurring weekly meeting
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
