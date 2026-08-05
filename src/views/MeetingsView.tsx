import React from 'react';
import { Users2, Plus, Clock, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import type { AppState } from '../services/store';

interface MeetingsViewProps {
  state: AppState;
  onOpenNewMeeting: () => void;
  onConvertActionItemToTask: (meetingId: string, actionItemId: string, assignedToName: string, title: string) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  state,
  onOpenNewMeeting,
  onConvertActionItemToTask,
}) => {
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-cyan-400" />
            <span>Group Meetings & Action Item Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Schedule team meetings, manage agenda topics, record live notes, and auto-convert meeting action items directly into tasks!
          </p>
        </div>

        <button
          onClick={onOpenNewMeeting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Meetings Stack */}
      <div className="space-y-6">
        {state.meetings.map(m => (
          <div
            key={m.id}
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  Meeting • {m.date}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{m.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {m.startTime} - {m.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" /> {m.locationOrLink}
                </span>
              </div>
            </div>

            {/* Agenda & Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
              {/* Agenda Topics */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Pre-Meeting Agenda</span>
                <ul className="space-y-1.5 text-slate-300">
                  {m.agenda.map((ag, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{ag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Meeting Notes */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-2">Meeting Notes & Summary</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{m.notes}</p>
              </div>
            </div>

            {/* Action Items with Auto-Convert Button! */}
            {m.actionItems.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                  Action Items & Task Conversion
                </span>

                <div className="space-y-2">
                  {m.actionItems.map(ai => (
                    <div
                      key={ai.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${ai.convertedToTaskId ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div>
                          <span className="font-semibold text-slate-200">{ai.title}</span>
                          <span className="block text-[10px] text-cyan-400 font-mono">Assigned: {ai.assignedToName}</span>
                        </div>
                      </div>

                      {ai.convertedToTaskId ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Converted to Task
                        </span>
                      ) : (
                        <button
                          onClick={() => onConvertActionItemToTask(m.id, ai.id, ai.assignedToName, ai.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/30 transition-all text-xs"
                        >
                          <span>Convert to Task</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
