import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Plus, Check, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { DayRecord, JointEntry } from '../types';
import { SevenDayStrip } from './SevenDayStrip';
import { FullCalendarModal } from './FullCalendarModal';
import { JointEntryCard, JointDraftItem } from './JointEntryCard';
import { HomescreenBanner } from './HomescreenBanner';
import {
  getSortedJointOptions,
  saveEntriesForDate,
  deleteEntriesForDate
} from '../utils/storage';

interface EntryFormProps {
  initialDate?: string;
  dayRecords: DayRecord[];
  allEntries: JointEntry[];
  onSaved: (date: string) => void;
  onDeleted?: (date: string) => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  initialDate,
  dayRecords,
  allEntries,
  onSaved,
  onDeleted
}) => {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sorted joints by frequency and severity
  const { sortedJoints, mostCommonJoint } = useMemo(
    () => getSortedJointOptions(allEntries),
    [allEntries]
  );

  // Form state
  const [joints, setJoints] = useState<JointDraftItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [savedSuccessDate, setSavedSuccessDate] = useState<string | null>(null);

  // Baseline state to detect dirty / unsaved changes
  const initialSnapshotRef = useRef<string>('');

  // Pending date target when user tries to switch dates with unsaved changes
  const [pendingDateTarget, setPendingDateTarget] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Existing day record for selectedDate if any
  const existingDayRecord = useMemo(
    () => dayRecords.find((r) => r.date === selectedDate),
    [dayRecords, selectedDate]
  );

  // Helper to construct a fresh default draft
  const createDefaultDraft = (commonJoint: string): JointDraftItem[] => [
    {
      id: `draft_${Date.now()}_0`,
      joint: commonJoint,
      side: 'none',
      severity: null
    }
  ];

  // Load entry for date or reset to defaults
  const loadDateData = (date: string) => {
    const existing = dayRecords.find((r) => r.date === date);
    if (existing && existing.entries.length > 0) {
      // Load saved entries for this date
      // Note: "sort order unchanged while editing"
      const loadedJoints: JointDraftItem[] = existing.entries.map((e, idx) => ({
        id: `existing_${e.id || idx}`,
        joint: e.joint,
        side: e.side,
        severity: e.severity
      }));
      setJoints(loadedJoints);
      setNotes(existing.notes || '');
      initialSnapshotRef.current = JSON.stringify({
        date,
        isNew: false,
        joints: loadedJoints.map((j) => ({ joint: j.joint, side: j.side, severity: j.severity })),
        notes: existing.notes || ''
      });
    } else {
      // New entry with sensible defaults:
      // Joint: pre-selected with most commonly entered joint
      // Severity: not pre-selected. Required.
      // Side: none
      const newDrafts = createDefaultDraft(mostCommonJoint);
      setJoints(newDrafts);
      setNotes('');
      initialSnapshotRef.current = JSON.stringify({
        date,
        isNew: true,
        joints: newDrafts.map((j) => ({ joint: j.joint, side: j.side, severity: j.severity })),
        notes: ''
      });
    }
    setShowValidationErrors(false);
  };

  // Sync when selectedDate changes or initialDate changes
  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate]);

  // When initialDate prop changes from parent
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  // Determine if form has unsaved changes (excluding defaults)
  const hasUnsavedChanges = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    try {
      const initial = JSON.parse(initialSnapshotRef.current);
      if (initial.isNew) {
        // For a new entry, check if user changed anything from blank defaults:
        const firstJoint = joints[0];
        if (!firstJoint) return false;
        const alteredJoint = firstJoint.joint !== mostCommonJoint;
        const alteredSide = firstJoint.side !== 'none';
        const alteredSeverity = firstJoint.severity !== null;
        const hasNotes = notes.trim().length > 0;
        const extraJoints = joints.length > 1;
        return alteredJoint || alteredSide || alteredSeverity || hasNotes || extraJoints;
      } else {
        // For existing entry, check if changed from loaded data
        const currentData = {
          date: selectedDate,
          isNew: false,
          joints: joints.map((j) => ({ joint: j.joint, side: j.side, severity: j.severity })),
          notes: notes.trim()
        };
        return JSON.stringify(currentData) !== initialSnapshotRef.current;
      }
    } catch {
      return false;
    }
  }, [joints, notes, selectedDate, mostCommonJoint]);

  // Intercept date selection to confirm discard if dirty
  const handleRequestDateChange = (newDate: string) => {
    if (newDate === selectedDate) return;

    if (hasUnsavedChanges) {
      setPendingDateTarget(newDate);
      setShowDiscardConfirm(true);
    } else {
      setSelectedDate(newDate);
    }
  };

  const handleConfirmDiscard = () => {
    if (pendingDateTarget) {
      setSelectedDate(pendingDateTarget);
      setPendingDateTarget(null);
    }
    setShowDiscardConfirm(false);
  };

  // Add another joint:
  // "shares date and notes with the first entry. upon save, joints are sorted by descending severity; sort order unchanged while editing."
  const handleAddJoint = () => {
    // Pick the next most common joint not already in form, or default to most common
    const existingJointNames = new Set(joints.map((j) => j.joint));
    const nextJoint = sortedJoints.find((j) => !existingJointNames.has(j)) || mostCommonJoint;

    setJoints((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}_${prev.length}`,
        joint: nextJoint,
        side: 'none',
        severity: null
      }
    ]);

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleUpdateJoint = (index: number, updated: JointDraftItem) => {
    setJoints((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveJoint = (index: number) => {
    if (joints.length <= 1) return;
    setJoints((prev) => prev.filter((_, i) => i !== index));
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that each joint has a valid joint name and a chosen severity (0-10)
    let hasError = false;
    for (const j of joints) {
      if (!j.joint.trim() || j.severity === null) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      setShowValidationErrors(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
      return;
    }

    // Prepare items for saving
    // Upon save: joints sorted by descending severity (stable sort in storage.ts)
    const rawItems = joints.map((j) => ({
      joint: j.joint.trim(),
      severity: j.severity as number,
      side: j.side
    }));

    saveEntriesForDate(selectedDate, rawItems, notes);

    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    setSavedSuccessDate(selectedDate);
    setTimeout(() => setSavedSuccessDate(null), 2500);

    // Refresh snapshot so form is no longer dirty
    loadDateData(selectedDate);
    onSaved(selectedDate);
  };

  // Delete handler for existing record
  const handleDeleteEntry = () => {
    deleteEntriesForDate(selectedDate);
    setShowDeleteConfirm(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    loadDateData(selectedDate);
    if (onDeleted) onDeleted(selectedDate);
  };

  const isEditingExisting = !!existingDayRecord && existingDayRecord.entries.length > 0;
  const entriesToday = dayRecords.find((r) => r.date === todayStr)?.entries.length || 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Homescreen Brand Banner */}
      <HomescreenBanner entriesTodayCount={entriesToday} />

      {/* 7-Day Quick Strip & Calendar Trigger */}
      <SevenDayStrip
        selectedDate={selectedDate}
        onSelectDate={handleRequestDateChange}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        dayRecords={dayRecords}
      />

      {/* Date Header & Existing Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold text-white">
            {selectedDate === todayStr ? 'Today’s Log' : format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </h2>
          {isEditingExisting && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
              Editing Prior
            </span>
          )}
        </div>

        {isEditingExisting && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Success Banner */}
      {savedSuccessDate && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-600/60 rounded-2xl flex items-center gap-2 text-emerald-200 text-sm font-semibold animate-fade-in shadow-lg shadow-emerald-900/20">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Saved successfully for {savedSuccessDate}!</span>
        </div>
      )}

      {/* Primary Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Joint Cards */}
        <div className="space-y-3">
          {joints.map((item, idx) => (
            <JointEntryCard
              key={item.id}
              index={idx}
              item={item}
              sortedJointOptions={sortedJoints}
              onChange={(updated) => handleUpdateJoint(idx, updated)}
              onRemove={() => handleRemoveJoint(idx)}
              canRemove={joints.length > 1}
              showErrors={showValidationErrors}
            />
          ))}
        </div>

        {/* Add Another Joint Button */}
        <button
          type="button"
          onClick={handleAddJoint}
          className="w-full py-3 px-4 rounded-2xl border border-dashed border-cyan-800/60 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] touch-manipulation shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Another Joint</span>
        </button>

        {/* Notes Field (Shared across date) */}
        <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-4 shadow-md space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Daily Notes <span className="text-slate-500 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling overall? Triggers, medication, weather, activities..."
            className="w-full bg-[#070c18] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors resize-none"
          />
          <div className="text-[11px] text-slate-500">
            One shared notes field per date, attached to the primary joint entry.
          </div>
        </div>

        {/* Validation Errors Notice */}
        {showValidationErrors && (
          <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl flex items-center gap-2 text-red-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Please select a joint and severity (0–10) for all entries before saving.</span>
          </div>
        )}

        {/* Primary Save CTA Button */}
        <button
          type="submit"
          className="w-full h-14 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all touch-manipulation cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-slate-900" />
          <span>{isEditingExisting ? 'Update Record' : 'Save Joint Entry'}</span>
        </button>
      </form>

      {/* Full Month Calendar Modal */}
      <FullCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={handleRequestDateChange}
        dayRecords={dayRecords}
      />

      {/* Unsaved Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Discard Changes?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              You have unsaved updates for {selectedDate}. Switching dates will discard these changes.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingDateTarget(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/30"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Delete Day Entry?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete all joint records for <span className="font-semibold text-white">{selectedDate}</span>? This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEntry}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/30"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
