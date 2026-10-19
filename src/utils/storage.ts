import type { DayRecord, JointEntry, SideType } from '../types/index.ts';
import { getSeverityDescription } from './severity.ts';

export const COMMON_JOINTS = [
  'Knee',
  'Ankle',
  'Foot',
  'Toe',
  'Hip',
  'Shoulder',
  'Elbow',
  'Wrist',
  'Hand',
  'Finger',
  'Jaw'
] as const;

const STORAGE_KEY = 'swello_entries_v1';
const LAST_EXPORT_KEY = 'swello_last_export_ts';

export function getAllEntries(): JointEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load entries from localStorage', e);
    return [];
  }
}

export function saveAllEntries(entries: JointEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save entries to localStorage', e);
  }
}

/**
 * Returns collapsed day records.
 * Entries on the same date are collapsed into a single DayRecord,
 * with joints sorted by descending severity (stable sort preserving entry order for ties).
 */
export function getCollapsedDayRecords(entries: JointEntry[] = getAllEntries()): DayRecord[] {
  const map = new Map<string, JointEntry[]>();

  for (const entry of entries) {
    if (!map.has(entry.date)) {
      map.set(entry.date, []);
    }
    map.get(entry.date)!.push(entry);
  }

  const dayRecords: DayRecord[] = [];

  for (const [date, dayEntries] of map.entries()) {
    // Stable sort by descending severity
    // We attach original index to ensure stable tie-breaking
    const indexed = dayEntries.map((item, idx) => ({ item, idx }));
    indexed.sort((a, b) => {
      const diff = b.item.severity - a.item.severity;
      if (diff !== 0) return diff;
      return a.idx - b.idx;
    });

    const sortedEntries = indexed.map((x) => x.item);
    
    // Notes: prompt says "Only able to be set on the first entry for that date"
    // We search for the first non-empty note if any exists
    const note = sortedEntries.find((e) => e.notes && e.notes.trim().length > 0)?.notes || '';
    const maxSeverity = Math.max(...sortedEntries.map((e) => e.severity), 0);
    const totalSeverity = sortedEntries.reduce((acc, e) => acc + e.severity, 0);

    dayRecords.push({
      date,
      entries: sortedEntries,
      notes: note,
      maxSeverity,
      totalSeverity,
      jointCount: sortedEntries.length
    });
  }

  // Sort day records chronologically descending (newest date first)
  dayRecords.sort((a, b) => b.date.localeCompare(a.date));

  return dayRecords;
}

/**
 * Get sorted joint options:
 * "options sorted by most-to-least commonly entered (then by average severity)"
 * Pre-filled with common joints plus any custom entered joints.
 */
export function getSortedJointOptions(entries: JointEntry[] = getAllEntries()): {
  sortedJoints: string[];
  mostCommonJoint: string;
} {
  const statsMap = new Map<string, { count: number; totalSeverity: number }>();

  // Pre-seed common joints with 0 count
  for (const joint of COMMON_JOINTS) {
    statsMap.set(joint, { count: 0, totalSeverity: 0 });
  }

  // Count occurrences and severities in history
  for (const entry of entries) {
    const j = entry.joint.trim();
    if (!j) continue;
    const existing = statsMap.get(j) || { count: 0, totalSeverity: 0 };
    existing.count += 1;
    existing.totalSeverity += entry.severity;
    statsMap.set(j, existing);
  }

  const list: { joint: string; count: number; avgSeverity: number }[] = [];
  for (const [joint, stats] of statsMap.entries()) {
    list.push({
      joint,
      count: stats.count,
      avgSeverity: stats.count > 0 ? stats.totalSeverity / stats.count : 0
    });
  }

  // Sort by most-to-least commonly entered, then by average severity descending, then alphabetical
  list.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.avgSeverity !== a.avgSeverity) return b.avgSeverity - a.avgSeverity;
    return a.joint.localeCompare(b.joint);
  });

  const sortedJoints = list.map((x) => x.joint);
  const mostCommonJoint = sortedJoints[0] || 'Knee';

  return {
    sortedJoints,
    mostCommonJoint
  };
}

/**
 * Save or update entries for a specific date.
 * Replaces existing records for that date with the newly configured joints and notes.
 * Joints are sorted by descending severity (stable sort).
 */
export function saveEntriesForDate(
  date: string,
  rawJoints: { joint: string; severity: number; side: SideType }[],
  notes: string
): void {
  const all = getAllEntries();
  const filtered = all.filter((e) => e.date !== date);

  // Filter out any invalid items
  const validJoints = rawJoints.filter((j) => j.joint.trim().length > 0);

  // Stable sort by descending severity
  const indexed = validJoints.map((j, idx) => ({ ...j, idx }));
  indexed.sort((a, b) => {
    const diff = b.severity - a.severity;
    if (diff !== 0) return diff;
    return a.idx - b.idx;
  });

  const newEntries: JointEntry[] = indexed.map((item, idx) => ({
    id: `entry_${date}_${Date.now()}_${idx}`,
    date,
    joint: item.joint.trim(),
    side: item.side,
    severity: item.severity,
    severityDescription: getSeverityDescription(item.severity),
    // Notes only stored on the first entry for that date
    notes: idx === 0 ? notes.trim() : '',
    createdAt: Date.now() + idx
  }));

  const updated = [...filtered, ...newEntries];
  saveAllEntries(updated);
}

/**
 * Delete all entries for a specific date
 */
export function deleteEntriesForDate(date: string): void {
  const all = getAllEntries();
  const updated = all.filter((e) => e.date !== date);
  saveAllEntries(updated);
}

/**
 * Export backup tracking
 */
export function recordExportTime(): void {
  localStorage.setItem(LAST_EXPORT_KEY, Date.now().toString());
}

export function getLastExportTime(): number | null {
  const raw = localStorage.getItem(LAST_EXPORT_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export function shouldShowExportReminder(entriesCount: number): boolean {
  if (entriesCount === 0) return false;
  const lastExport = getLastExportTime();
  if (!lastExport) {
    // If user has 3 or more entries and hasn't exported yet
    return entriesCount >= 3;
  }
  // If more than 7 days since last export
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - lastExport > sevenDaysMs;
}

/**
 * Sample demo data to quickly preview or test
 */
export function loadSampleDataIfEmpty(): boolean {
  const existing = getAllEntries();
  if (existing.length > 0) return false;

  const today = new Date();
  const formatDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const sampleEntries: JointEntry[] = [
    {
      id: 'demo_1',
      date: formatDate(0),
      joint: 'Knee',
      side: 'right',
      severity: 6,
      severityDescription: 'Moderate swelling',
      notes: 'Morning stiffness lasted ~45 mins. Ice pack helped a bit.',
      createdAt: Date.now() - 1000
    },
    {
      id: 'demo_2',
      date: formatDate(0),
      joint: 'Wrist',
      side: 'left',
      severity: 3,
      severityDescription: 'Ache / Mild swelling',
      notes: '',
      createdAt: Date.now() - 900
    },
    {
      id: 'demo_3',
      date: formatDate(1),
      joint: 'Knee',
      side: 'right',
      severity: 8,
      severityDescription: 'Severe swelling',
      notes: 'Difficult walking stairs. Started after yard work.',
      createdAt: Date.now() - 86400000
    },
    {
      id: 'demo_4',
      date: formatDate(1),
      joint: 'Ankle',
      side: 'both',
      severity: 4,
      severityDescription: 'Mild swelling',
      notes: '',
      createdAt: Date.now() - 86390000
    },
    {
      id: 'demo_5',
      date: formatDate(3),
      joint: 'Knee',
      side: 'right',
      severity: 4,
      severityDescription: 'Mild swelling',
      notes: 'Felt better today, swelling decreasing.',
      createdAt: Date.now() - 3 * 86400000
    },
    {
      id: 'demo_6',
      date: formatDate(5),
      joint: 'Finger',
      side: 'both',
      severity: 2,
      severityDescription: 'Ache',
      notes: 'Knuckles clicking in cold weather.',
      createdAt: Date.now() - 5 * 86400000
    },
    {
      id: 'demo_7',
      date: formatDate(8),
      joint: 'Shoulder',
      side: 'left',
      severity: 5,
      severityDescription: 'Mild / Moderate swelling',
      notes: 'Shoulder flare began yesterday evening.',
      createdAt: Date.now() - 8 * 86400000
    },
    {
      id: 'demo_8',
      date: formatDate(12),
      joint: 'Knee',
      side: 'both',
      severity: 2,
      severityDescription: 'Ache',
      notes: 'Light ache after walking 5km.',
      createdAt: Date.now() - 12 * 86400000
    },
    {
      id: 'demo_9',
      date: formatDate(15),
      joint: 'Wrist',
      side: 'right',
      severity: 7,
      severityDescription: 'Moderate / Severe swelling',
      notes: 'Typing difficult at work.',
      createdAt: Date.now() - 15 * 86400000
    },
    {
      id: 'demo_10',
      date: formatDate(20),
      joint: 'Knee',
      side: 'right',
      severity: 0,
      severityDescription: 'Ok',
      notes: 'Full recovery, feeling great!',
      createdAt: Date.now() - 20 * 86400000
    }
  ];

  saveAllEntries(sampleEntries);
  return true;
}
