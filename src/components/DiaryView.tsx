import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Edit2, Search, FileText, Activity, Calendar } from 'lucide-react';
import { DayRecord } from '../types';
import { getSeverityHexColor, getSeverityDescription } from '../utils/severity';

interface DiaryViewProps {
  dayRecords: DayRecord[];
  onSelectDateToEdit: (date: string) => void;
  onNewEntryClick: () => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  dayRecords,
  onSelectDateToEdit,
  onNewEntryClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJointFilter, setSelectedJointFilter] = useState<string>('all');

  // Extract all unique joint names across records for filtering
  const allJoints = useMemo(() => {
    const set = new Set<string>();
    dayRecords.forEach((dr) => dr.entries.forEach((e) => set.add(e.joint)));
    return Array.from(set).sort();
  }, [dayRecords]);

  // Filter day records
  const filteredRecords = useMemo(() => {
    return dayRecords.filter((record) => {
      // Joint filter
      if (
        selectedJointFilter !== 'all' &&
        !record.entries.some((e) => e.joint.toLowerCase() === selectedJointFilter.toLowerCase())
      ) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const dateMatch = record.date.includes(query);
        const notesMatch = record.notes && record.notes.toLowerCase().includes(query);
        const jointMatch = record.entries.some((e) => e.joint.toLowerCase().includes(query));
        return dateMatch || notesMatch || jointMatch;
      }

      return true;
    });
  }, [dayRecords, searchTerm, selectedJointFilter]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">Flare Diary</h2>
            <p className="text-xs text-slate-400">
              {dayRecords.length} {dayRecords.length === 1 ? 'daily entry' : 'daily entries'} recorded
            </p>
          </div>
          <button
            type="button"
            onClick={onNewEntryClick}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 active:scale-95"
          >
            <span>➕ Track Entry</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes, joints, dates..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedJointFilter}
            onChange={(e) => setSelectedJointFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Joints</option>
            {allJoints.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Collapsed Day Records */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No entries found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {searchTerm || selectedJointFilter !== 'all'
              ? 'Try adjusting your search terms or filter.'
              : 'Start logging your joints to build your flare history.'}
          </p>
          {!searchTerm && selectedJointFilter === 'all' && (
            <button
              onClick={onNewEntryClick}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Add First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const dateObj = parseISO(record.date);
            const maxColor = getSeverityHexColor(record.maxSeverity);
            const maxDesc = getSeverityDescription(record.maxSeverity);

            return (
              <div
                key={record.date}
                onClick={() => onSelectDateToEdit(record.date)}
                className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg space-y-3"
              >
                {/* Header: Date and Max Severity Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      <Calendar className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {format(dateObj, 'EEE, MMMM d, yyyy')}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {record.entries.length} {record.entries.length === 1 ? 'joint logged' : 'joints logged'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Max Severity Badge */}
                    <div
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                      style={{
                        backgroundColor: maxColor,
                        boxShadow: `0 0 8px ${maxColor}40`
                      }}
                      title={`Max severity: ${record.maxSeverity} (${maxDesc})`}
                    >
                      <span>Max {record.maxSeverity}</span>
                    </div>

                    <div className="p-1.5 rounded-lg text-slate-500 group-hover:text-amber-400 group-hover:bg-slate-800 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Collapsed Joints list: sorted descending by severity (stable sort) */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {record.entries.map((entry, idx) => {
                    const jointColor = getSeverityHexColor(entry.severity);
                    const sideLabel =
                      entry.side === 'both'
                        ? 'Both'
                        : entry.side === 'left'
                        ? 'L'
                        : entry.side === 'right'
                        ? 'R'
                        : '';

                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-medium text-slate-200"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: jointColor }}
                        />
                        <span className="font-semibold text-slate-100">{entry.joint}</span>
                        {sideLabel && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {sideLabel}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">
                          ({entry.severity})
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Notes Snippet */}
                {record.notes && (
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-800/60 text-xs text-slate-400 italic">
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed">
                      &ldquo;{record.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
