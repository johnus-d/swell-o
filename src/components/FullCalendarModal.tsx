import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { DayRecord } from '../types';
import { getSeverityHexColor } from '../utils/severity';

interface FullCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  dayRecords: DayRecord[];
}

export const FullCalendarModal: React.FC<FullCalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  dayRecords
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return selectedDate ? parseISO(selectedDate) : new Date();
  });

  if (!isOpen) return null;

  // Build map of date -> max severity
  const severityByDate = new Map<string, number>();
  for (const record of dayRecords) {
    severityByDate.set(record.date, record.maxSeverity);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const selectedDateObj = parseISO(selectedDate);
  const today = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-[#0c1322] border border-cyan-950/70 rounded-t-3xl sm:rounded-2xl p-5 pb-safe shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-950/60">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">Select Date</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between py-4">
          <h4 className="text-base font-semibold text-slate-200">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-xs font-semibold text-slate-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = isSameDay(day, selectedDateObj);
            const isToday = isSameDay(day, today);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const hasEntry = severityByDate.has(dateStr);
            const severity = severityByDate.get(dateStr);
            const indicatorColor = hasEntry && severity !== undefined ? getSeverityHexColor(severity) : undefined;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className={`
                  relative h-12 rounded-xl flex flex-col items-center justify-center transition-all
                  ${!inCurrentMonth ? 'text-slate-600' : 'text-slate-200'}
                  ${isSelected ? 'bg-gradient-to-b from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25' : 'hover:bg-slate-800/60 active:scale-95'}
                  ${isToday && !isSelected ? 'ring-1 ring-cyan-400/50 font-semibold' : ''}
                `}
              >
                <span className="text-sm leading-none">{format(day, 'd')}</span>
                
                {/* Entry Indicator Dot */}
                {hasEntry && (
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full transition-transform ${isSelected ? 'ring-1 ring-slate-950' : ''}`}
                    style={{
                      backgroundColor: indicatorColor,
                      boxShadow: indicatorColor ? `0 0 6px ${indicatorColor}` : undefined
                    }}
                    title={`Severity: ${severity}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> 0 Ok
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /> 2 Ache
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> 8 Severe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] border border-slate-600" /> 10 Total
          </span>
        </div>
      </div>
    </div>
  );
};
