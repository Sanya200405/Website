import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Bell,
  Search,
  Copy,
  Check,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { MeetingItem, EngineeringNote } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface MeetingsViewProps {
  state: AppState;
  onOpenNewMeeting: (initialDate?: string) => void;
  onEditMeeting: (meeting: MeetingItem) => void;
  onDeleteMeeting: (id: string) => Promise<void>;
  onAddEngineeringNote?: (data: Partial<EngineeringNote>) => Promise<any>;
}

type ViewMode = 'calendar_month' | 'calendar_week' | 'list';

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  state,
  onOpenNewMeeting,
  onEditMeeting,
  onDeleteMeeting,
  onAddEngineeringNote,
}) => {
  const isDark = state.theme === 'dark';
  const { meetings } = state;

  const [viewMode, setViewMode] = useState<ViewMode>('calendar_month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter meetings by search query
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const q = searchQuery.toLowerCase().trim();
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q))
    );
  }, [meetings, searchQuery]);

  // Separate into upcoming and past
  const { upcomingMeetings, pastMeetings, todayMeetings } = useMemo(() => {
    const upcoming: MeetingItem[] = [];
    const past: MeetingItem[] = [];
    const todayList: MeetingItem[] = [];

    const sorted = [...filteredMeetings].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.start_time.localeCompare(b.start_time);
    });

    for (const m of sorted) {
      if (m.date === todayStr) {
        todayList.push(m);
        upcoming.push(m);
      } else if (m.date > todayStr) {
        upcoming.push(m);
      } else {
        past.unshift(m); // past sorted descending (most recent first)
      }
    }

    return { upcomingMeetings: upcoming, pastMeetings: past, todayMeetings: todayList };
  }, [filteredMeetings, todayStr]);

  // Calendar calculations (Month View)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      meetings: MeetingItem[];
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        meetings: filteredMeetings.filter((m) => m.date === dateStr),
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= totalDaysInMonth; dNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        meetings: filteredMeetings.filter((m) => m.date === dateStr),
      });
    }

    // Next month padding days to make full grid of 35 or 42
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let dNum = 1; dNum <= remaining; dNum++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: dNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          meetings: filteredMeetings.filter((m) => m.date === dateStr),
        });
      }
    }

    return days;
  }, [currentDate, filteredMeetings, todayStr]);

  // Calendar calculations (Week View)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      dayName: string;
      monthName: string;
      isToday: boolean;
      meetings: MeetingItem[];
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateStr === todayStr,
        meetings: filteredMeetings.filter((m) => m.date === dateStr),
      });
    }

    return days;
  }, [currentDate, filteredMeetings, todayStr]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'calendar_month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'calendar_week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'calendar_month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'calendar_week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCopyLink = (meeting: MeetingItem) => {
    if (!meeting.meeting_link) return;
    navigator.clipboard.writeText(meeting.meeting_link);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Report integration: Save meeting to Engineering Notes
  const handleAddToReportNotes = async (meeting: MeetingItem) => {
    if (!onAddEngineeringNote) {
      showToast('Engineering Notes integration is not available.');
      return;
    }

    try {
      const noteTitle = `Meeting Notes: ${meeting.title} (${meeting.date})`;
      let content = `## ${meeting.title}\n\n`;
      content += `**Date:** ${meeting.date} | **Time:** ${meeting.start_time}${meeting.end_time ? ' - ' + meeting.end_time : ''}\n`;
      if (meeting.location) content += `**Location:** ${meeting.location}\n`;
      if (meeting.meeting_link) content += `**Meeting Link:** ${meeting.meeting_link}\n\n`;

      if (meeting.description) {
        content += `### Agenda & Discussion\n${meeting.description}\n\n`;
      }
      if (meeting.notes) {
        content += `### Key Decisions & Action Items\n${meeting.notes}\n\n`;
      }

      await onAddEngineeringNote({
        title: noteTitle,
        content: content.trim(),
        tags: 'Team Meeting, Discussion, Review',
      });

      showToast(`Saved "${meeting.title}" as an Engineering Note!`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save to Engineering Notes');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await onDeleteMeeting(confirmDeleteId);
      if (selectedMeeting?.id === confirmDeleteId) {
        setSelectedMeeting(null);
      }
      setConfirmDeleteId(null);
      showToast('Meeting removed successfully.');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete meeting');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes || '00'} ${ampm}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomStr) return 'Tomorrow';

    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatReminderLabel = (rem?: string) => {
    switch (rem) {
      case '10_mins':
        return '10 min before';
      case '30_mins':
        return '30 min before';
      case '1_hour':
        return '1 hr before';
      case '1_day':
        return '1 day before';
      default:
        return null;
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const monthYearTitle = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-600 text-white font-semibold text-sm shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-200 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Team Meetings
              </h1>
            </div>
            <p className={`text-sm max-w-2xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Schedule engineering syncs, join live video conferences, review team agendas, and archive meeting conclusions.
            </p>

            {/* Quick stats chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              <div
                className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {meetings.length} Total Meetings
              </div>
              <div
                className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                  todayMeetings.length > 0
                    ? isDark
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {todayMeetings.length} Today
              </div>
              <div
                className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                  upcomingMeetings.length > 0
                    ? isDark
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                      : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {upcomingMeetings.length} Upcoming
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenNewMeeting()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Meeting</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: View Tabs, Search, Date Navigation */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBgClass}`}>
        {/* Left: View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-slate-950/20 border-slate-800/40">
          <button
            onClick={() => setViewMode('calendar_month')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar_month'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Month View</span>
          </button>

          <button
            onClick={() => setViewMode('calendar_week')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar_week'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Week View</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Upcoming & Past</span>
          </button>
        </div>

        {/* Center/Right: Month Navigation & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode !== 'list' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous Period"
                className={`p-1.5 rounded-xl border transition-colors ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className={`text-sm font-bold min-w-[140px] text-center ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {viewMode === 'calendar_month'
                  ? monthYearTitle
                  : `${weekDays[0]?.monthName} ${weekDays[0]?.dayNumber} - ${weekDays[6]?.monthName} ${weekDays[6]?.dayNumber}, ${currentDate.getFullYear()}`}
              </span>

              <button
                onClick={handleNext}
                aria-label="Next Period"
                className={`p-1.5 rounded-xl border transition-colors ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-cyan-400' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-cyan-700'
                }`}
              >
                Today
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className={`w-3.5 h-3.5 absolute left-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 w-44 md:w-56 transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Body: Month View, Week View, or List View */}
      {viewMode === 'calendar_month' && (
        <div className={`p-4 md:p-6 rounded-2xl border overflow-hidden ${cardBgClass}`}>
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
              <div
                key={dayName}
                className={`text-xs font-bold uppercase tracking-wider py-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isPast = day.dateStr < todayStr;
              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => {
                    if (day.meetings.length === 0) {
                      onOpenNewMeeting(day.dateStr);
                    }
                  }}
                  className={`min-h-[96px] md:min-h-[115px] p-2 rounded-xl border flex flex-col justify-between transition-all group ${
                    day.isCurrentMonth
                      ? isDark
                        ? 'bg-slate-950/60 border-slate-800/90 hover:border-cyan-500/40'
                        : 'bg-slate-50/70 border-slate-200/90 hover:border-cyan-400'
                      : isDark
                      ? 'bg-slate-950/20 border-slate-900 text-slate-600'
                      : 'bg-slate-100/50 border-slate-200/50 text-slate-400'
                  } ${
                    day.isToday
                      ? isDark
                        ? 'ring-2 ring-cyan-500/50 bg-cyan-950/10 border-cyan-500/40'
                        : 'ring-2 ring-cyan-400/60 bg-cyan-50/50 border-cyan-300'
                      : ''
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        day.isToday
                          ? 'bg-cyan-600 text-white font-bold'
                          : day.isCurrentMonth
                          ? isDark
                            ? 'text-slate-200'
                            : 'text-slate-800'
                          : isDark
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Quick + Add Button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewMeeting(day.dateStr);
                      }}
                      title={`Schedule meeting on ${day.dateStr}`}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md text-xs transition-opacity ${
                        isDark ? 'hover:bg-slate-800 text-cyan-400' : 'hover:bg-slate-200 text-cyan-700'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Meeting Chips */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-20">
                    {day.meetings.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(m);
                        }}
                        title={`${m.title} (${formatTime(m.start_time)})`}
                        className={`px-1.5 py-0.5 rounded-lg text-xs font-medium truncate cursor-pointer transition-all border flex items-center gap-1 ${
                          isPast
                            ? isDark
                              ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            : day.isToday
                            ? isDark
                              ? 'bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30'
                              : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : isDark
                            ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/25'
                            : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                        }`}
                      >
                        {m.meeting_link ? (
                          <Video className="w-2.5 h-2.5 flex-shrink-0 text-cyan-400" />
                        ) : (
                          <Clock className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                        )}
                        <span className="font-semibold">{formatTime(m.start_time)}</span>
                        <span className="truncate">{m.title}</span>
                      </div>
                    ))}
                    {day.meetings.length > 3 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewMode('list');
                        }}
                        className="text-[10px] font-semibold text-cyan-500 dark:text-cyan-400 hover:underline px-1 cursor-pointer"
                      >
                        +{day.meetings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Body: Week View */}
      {viewMode === 'calendar_week' && (
        <div className={`p-4 md:p-6 rounded-2xl border overflow-x-auto ${cardBgClass}`}>
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((day) => {
              const isPast = day.dateStr < todayStr;
              return (
                <div
                  key={day.dateStr}
                  className={`p-3 rounded-2xl border flex flex-col min-h-[300px] transition-all ${
                    day.isToday
                      ? isDark
                        ? 'bg-cyan-950/15 border-cyan-500/50'
                        : 'bg-cyan-50/60 border-cyan-300'
                      : isDark
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/40">
                    <div>
                      <div className={`text-xs font-bold uppercase ${day.isToday ? 'text-cyan-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {day.dayName}
                      </div>
                      <div className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {day.monthName} {day.dayNumber}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenNewMeeting(day.dateStr)}
                      className={`p-1 rounded-lg text-xs transition-colors ${
                        isDark ? 'hover:bg-slate-800 text-cyan-400' : 'hover:bg-slate-200 text-cyan-700'
                      }`}
                      title={`Schedule meeting on ${day.dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day's Meetings */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {day.meetings.length === 0 ? (
                      <div className={`text-[11px] py-6 text-center italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        No syncs
                      </div>
                    ) : (
                      day.meetings.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMeeting(m)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] space-y-1.5 ${
                            isPast
                              ? isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-300'
                                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                              : day.isToday
                              ? isDark
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-sm'
                                : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                              : isDark
                              ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100 shadow-sm'
                              : 'bg-cyan-50/90 border-cyan-200 text-cyan-950 shadow-sm'
                          }`}
                        >
                          <div className="font-bold truncate">{m.title}</div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(m.start_time)}</span>
                          </div>
                          {m.meeting_link && (
                            <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                              <Video className="w-3 h-3" />
                              <span>Video Call</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming & Past Sections (Shown in List View or alongside Calendar) */}
      <div className="space-y-6">
        {/* Upcoming Meetings List Section */}
        <div className={`p-6 md:p-7 rounded-2xl border space-y-4 ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Upcoming Meetings ({upcomingMeetings.length})
              </h2>
            </div>
            {upcomingMeetings.length > 0 && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
              }`}>
                Chronological Order
              </span>
            )}
          </div>

          {upcomingMeetings.length === 0 ? (
            <div className={`p-8 rounded-xl border text-center space-y-3 ${
              isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
              }`}>
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  No upcoming meetings scheduled
                </h3>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Schedule your team syncs, review agendas with teammates, and share video conference links.
                </p>
              </div>
              <button
                onClick={() => onOpenNewMeeting()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMeetings.map((meeting) => {
                const isToday = meeting.date === todayStr;
                const remText = formatReminderLabel(meeting.reminder);

                return (
                  <div
                    key={meeting.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:border-cyan-500/50 ${
                      isToday
                        ? isDark
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : isDark
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-50/90 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                isToday
                                  ? isDark
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                  : isDark
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              }`}
                            >
                              {formatDateDisplay(meeting.date)}
                            </span>

                            {remText && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 border ${
                                  isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                                }`}
                              >
                                <Bell className="w-2.5 h-2.5 text-amber-400" />
                                <span>{remText}</span>
                              </span>
                            )}
                          </div>

                          <h3
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`text-base font-bold tracking-tight cursor-pointer hover:text-cyan-500 transition-colors ${
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}
                          >
                            {meeting.title}
                          </h3>
                        </div>

                        {/* Quick actions dropdown / edit */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditMeeting(meeting)}
                            title="Edit meeting"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(meeting.id)}
                            title="Delete meeting"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Time & Location */}
                      <div className={`flex flex-wrap items-center gap-3.5 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                          <span>
                            {formatTime(meeting.start_time)}
                            {meeting.end_time ? ` - ${formatTime(meeting.end_time)}` : ''}
                          </span>
                        </div>

                        {meeting.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{meeting.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Agenda / Description Preview */}
                      {meeting.description && (
                        <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {meeting.description}
                        </p>
                      )}

                      {/* Notes snippet if exists */}
                      {meeting.notes && (
                        <div className={`p-2.5 rounded-xl text-xs font-mono border ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <div className="font-bold text-[10px] uppercase text-violet-500 dark:text-violet-400 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Meeting Notes</span>
                          </div>
                          <p className="line-clamp-2">{meeting.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Strip: Join Meeting, Add to Report Notes */}
                    <div className={`pt-3.5 mt-3 border-t flex flex-wrap items-center justify-between gap-2.5 ${
                      isDark ? 'border-slate-800/80' : 'border-slate-200/80'
                    }`}>
                      <div className="flex items-center gap-2">
                        {meeting.meeting_link ? (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meeting</span>
                            <ExternalLink className="w-3 h-3 opacity-75" />
                          </a>
                        ) : (
                          <span className={`text-[11px] font-medium italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            No video link attached
                          </span>
                        )}

                        {meeting.meeting_link && (
                          <button
                            onClick={() => handleCopyLink(meeting)}
                            title="Copy meeting link"
                            className={`p-1.5 rounded-xl border text-xs transition-colors ${
                              copiedId === meeting.id
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isDark
                                ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                                : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {copiedId === meeting.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Add to Report Notes Button */}
                      {onAddEngineeringNote && (
                        <button
                          onClick={() => handleAddToReportNotes(meeting)}
                          title="Save this meeting's agenda and notes as an Engineering Note for the Report workspace"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:text-violet-300'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-violet-400 hover:text-violet-800'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-violet-500" />
                          <span>Add to Report Notes</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Meetings Section */}
        {pastMeetings.length > 0 && (
          <div className={`p-6 md:p-7 rounded-2xl border space-y-4 ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Past Meetings ({pastMeetings.length})
                </h2>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}>
                Archived Syncs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={`p-4.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
                      }`}>
                        {formatDateDisplay(meeting.date)} • {formatTime(meeting.start_time)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditMeeting(meeting)}
                          title="Edit meeting"
                          className={`p-1 rounded-lg transition-colors ${
                            isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(meeting.id)}
                          title="Delete meeting"
                          className={`p-1 rounded-lg transition-colors ${
                            isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`text-sm font-bold tracking-tight cursor-pointer hover:text-cyan-500 transition-colors ${
                        isDark ? 'text-slate-200' : 'text-slate-900'
                      }`}
                    >
                      {meeting.title}
                    </h4>

                    {meeting.notes ? (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {meeting.notes}
                      </p>
                    ) : meeting.description ? (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {meeting.description}
                      </p>
                    ) : null}
                  </div>

                  <div className={`pt-2.5 mt-2.5 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800/60' : 'border-slate-200'
                  }`}>
                    {onAddEngineeringNote && (
                      <button
                        onClick={() => handleAddToReportNotes(meeting)}
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-700 hover:text-violet-900'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>Add to Report Notes</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMeeting(meeting)}
                      className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline ml-auto"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meeting Details Modal Popup */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 md:p-7 space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selectedMeeting.date === todayStr
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                        : isDark
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    }`}
                  >
                    {formatDateDisplay(selectedMeeting.date)}
                  </span>
                  {selectedMeeting.reminder && selectedMeeting.reminder !== 'none' && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      <Bell className="w-2.5 h-2.5 inline mr-1 text-amber-400" />
                      {formatReminderLabel(selectedMeeting.reminder)}
                    </span>
                  )}
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {selectedMeeting.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Date, Time, Location Strip */}
            <div className={`p-4 rounded-xl border space-y-2 text-xs font-medium ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span className="font-semibold text-sm">
                  {formatTime(selectedMeeting.start_time)}
                  {selectedMeeting.end_time ? ` - ${formatTime(selectedMeeting.end_time)}` : ''}
                </span>
              </div>

              {selectedMeeting.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{selectedMeeting.location}</span>
                </div>
              )}
            </div>

            {/* Video Call Link Card */}
            {selectedMeeting.meeting_link ? (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
              }`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Video className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className={`text-xs font-bold ${isDark ? 'text-cyan-200' : 'text-cyan-900'}`}>
                      Video Conference Link
                    </div>
                    <div className={`text-xs truncate font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                      {selectedMeeting.meeting_link}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={selectedMeeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>

                  <button
                    onClick={() => handleCopyLink(selectedMeeting)}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      copiedId === selectedMeeting.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    {copiedId === selectedMeeting.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Agenda / Description */}
            {selectedMeeting.description && (
              <div className="space-y-1.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Agenda & Description
                </h4>
                <div className={`p-3.5 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap ${
                  isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {selectedMeeting.description}
                </div>
              </div>
            )}

            {/* Meeting Notes */}
            {selectedMeeting.notes && (
              <div className="space-y-1.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 flex items-center gap-1.5`}>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Decisions & Meeting Notes</span>
                </h4>
                <div className={`p-3.5 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-mono ${
                  isDark ? 'bg-slate-950/90 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}>
                  {selectedMeeting.notes}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                {onAddEngineeringNote && (
                  <button
                    onClick={() => {
                      handleAddToReportNotes(selectedMeeting);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-violet-300 hover:bg-slate-800'
                        : 'bg-slate-100 border-slate-300 text-violet-800 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-violet-500" />
                    <span>Add to Report Notes</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const m = selectedMeeting;
                    setSelectedMeeting(null);
                    onEditMeeting(m);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    const mId = selectedMeeting.id;
                    setSelectedMeeting(null);
                    setConfirmDeleteId(mId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/10 border border-rose-500/30 text-rose-500 hover:bg-rose-600 hover:text-white transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team Meeting"
        message="Are you sure you want to remove this meeting? It will be moved to the Trash and can be recovered if needed."
        confirmText="Delete Meeting"
        confirmVariant="danger"
        isLoading={isDeleting}
        theme={state.theme}
      />
    </div>
  );
};

export default MeetingsView;
