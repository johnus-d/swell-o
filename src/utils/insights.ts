import { parseISO, differenceInDays } from 'date-fns';
import type { JointEntry } from '../types/index.ts';

// Helper to calculate daily max severity series sorted by date ascending
export function getDailySeveritySeries(entries: JointEntry[]): { date: string; value: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const existing = map.get(e.date) ?? -1;
    if (e.severity > existing) {
      map.set(e.date, e.severity);
    }
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface FlareCycleResult {
  hasCycle: boolean;
  avgDays?: number;
  value: string;
  detail: string;
}

// Calculate typical flare cycle length (tip-to-tip and trough-to-trough)
export function computeCycleLength(datedSeverities: { date: string; value: number }[]): FlareCycleResult {
  if (!datedSeverities || datedSeverities.length < 3) {
    return {
      hasCycle: false,
      value: '—',
      detail: 'Needs ≥ 2 flare cycles'
    };
  }

  // Find local peaks (flare tips) and troughs (flare valleys / remission)
  const peaks: { date: string; value: number }[] = [];
  const troughs: { date: string; value: number }[] = [];

  for (let i = 0; i < datedSeverities.length; i++) {
    const curr = datedSeverities[i].value;
    const prev = i > 0 ? datedSeverities[i - 1].value : -1;
    const next = i < datedSeverities.length - 1 ? datedSeverities[i + 1].value : -1;

    // Peak: severity >= 3, local max higher than neighbor
    const isPeak =
      curr >= 3 &&
      (i === 0
        ? curr > next
        : i === datedSeverities.length - 1
        ? curr > prev
        : curr >= prev && curr >= next && (curr > prev || curr > next));

    // Trough: severity <= 4, local min lower than neighbor
    const isTrough =
      curr <= 4 &&
      (i === 0
        ? curr < next
        : i === datedSeverities.length - 1
        ? curr < prev
        : curr <= prev && curr <= next && (curr < prev || curr < next));

    if (isPeak) {
      if (peaks.length === 0 || peaks[peaks.length - 1].date !== datedSeverities[i].date) {
        peaks.push(datedSeverities[i]);
      }
    }
    if (isTrough) {
      if (troughs.length === 0 || troughs[troughs.length - 1].date !== datedSeverities[i].date) {
        troughs.push(datedSeverities[i]);
      }
    }
  }

  const tipIntervals: number[] = [];
  for (let i = 0; i < peaks.length - 1; i++) {
    const d = differenceInDays(parseISO(peaks[i + 1].date), parseISO(peaks[i].date));
    if (d > 0) tipIntervals.push(d);
  }

  const troughIntervals: number[] = [];
  for (let i = 0; i < troughs.length - 1; i++) {
    const d = differenceInDays(parseISO(troughs[i + 1].date), parseISO(troughs[i].date));
    if (d > 0) troughIntervals.push(d);
  }

  const combined = [...tipIntervals, ...troughIntervals];
  if (combined.length === 0) {
    return {
      hasCycle: false,
      value: '—',
      detail: peaks.length > 0 ? '1 flare observed' : 'Needs ≥ 2 flare cycles'
    };
  }

  const avgDays = Math.round(combined.reduce((a, b) => a + b, 0) / combined.length);
  const formattedVal = avgDays >= 14 ? `${(avgDays / 7).toFixed(1)} wks` : `${avgDays} days`;
  const detail =
    tipIntervals.length > 0 && troughIntervals.length > 0
      ? `${tipIntervals.length} tip & ${troughIntervals.length} trough cycles`
      : tipIntervals.length > 0
      ? `${tipIntervals.length} tip-to-tip interval${tipIntervals.length > 1 ? 's' : ''}`
      : `${troughIntervals.length} trough-to-trough interval${troughIntervals.length > 1 ? 's' : ''}`;

  return {
    hasCycle: true,
    avgDays,
    value: `~${formattedVal}`,
    detail
  };
}
