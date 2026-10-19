import React from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayRecord } from '../types';
import { getSeverityHexColor } from '../utils/severity';

interface SevenDayStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenCalendar: () => void;
  dayRecords: DayRecord[];
}

export const SevenDayStrip: React.FC<SevenDayStripProps> = ({
  selectedDate,
  onSelectDate,
  onOpenCalendar,
  dayRecords
}) => {
  const today = new Date();
  const selectedDateObj = parseISO(selectedDate);

  // Generate 7 days: from 6-days ago (left) to today (right)
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(subDays(today, i));
  }

  // Map date -> max severity
  const severityByDate = new Map<string, number>();
  for (const record of dayRecords) {
    severityByDate.set(record.date, record.maxSeverity);
  }

  // Check if selectedDate is outside the 7-day window
  const isSelectedOutside7Days = !days.some((d) => isSameDay(d, selectedDateObj));

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Date
        </span>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
          title="Open full month calendar"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Calendar</span>
          {isSelectedOutside7Days && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">
              {format(selectedDateObj, 'MMM d')}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDateObj);
          const isDayToday = isSameDay(day, today);
          const hasEntry = severityByDate.has(dateStr);
          const severity = severityByDate.get(dateStr);
          const indicatorColor = hasEntry && severity !== undefined ? getSeverityHexColor(severity) : undefined;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`
                relative flex flex-col items-center justify-between py-2 rounded-xl transition-all duration-150
                touch-manipulation select-none
                ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 active:scale-95'
                }
                ${isDayToday && !isSelected ? 'ring-1 ring-amber-400/40' : ''}
              `}
            >
              {/* Day of Week (3 letters) */}
              <span className={`text-[11px] uppercase tracking-wider ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                {format(day, 'EEE')}
              </span>

              {/* Day of Month */}
              <span className={`text-base font-extrabold my-0.5 ${isSelected ? 'text-slate-950' : 'text-slate-100'}`}>
                {format(day, 'd')}
              </span>

              {/* Severity Entry Indicator */}
              <div className="h-2 flex items-center justify-center">
                {hasEntry ? (
                  <span
                    className={`w-2 h-2 rounded-full transition-transform ${isSelected ? 'ring-1 ring-slate-950 scale-110' : ''}`}
                    style={{
                      backgroundColor: indicatorColor,
                      boxShadow: indicatorColor ? `0 0 5px ${indicatorColor}` : undefined
                    }}
                    title={`Max severity: ${severity}`}
                  />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
