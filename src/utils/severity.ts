export interface SeverityInfo {
  value: number;
  shortLabel: string;
  description: string;
  color: string;
  textColor: string;
  bgClass: string;
  borderClass: string;
}

export const SEVERITY_BASE_DESCRIPTIONS: Record<number, { short: string; full: string }> = {
  0: { short: 'ok', full: 'Ok' },
  2: { short: 'ache', full: 'Ache' },
  4: { short: 'mild', full: 'Mild swelling' },
  6: { short: 'med', full: 'Moderate swelling' },
  8: { short: 'severe', full: 'Severe swelling' },
  10: { short: 'total', full: 'Total loss of function' }
};

export function getSeverityDescription(severity: number): string {
  const rounded = Math.round(Math.max(0, Math.min(10, severity)));
  if (SEVERITY_BASE_DESCRIPTIONS[rounded]) {
    return SEVERITY_BASE_DESCRIPTIONS[rounded].full;
  }
  // In-between ratings are slash-joined
  const lower = rounded - 1;
  const upper = rounded + 1;
  const lowerDesc = SEVERITY_BASE_DESCRIPTIONS[lower]?.full || 'Ok';
  const upperDesc = SEVERITY_BASE_DESCRIPTIONS[upper]?.full || 'Total loss of function';

  // Specific canonical formats matching prompt examples:
  if (rounded === 3) return 'Ache / Mild swelling';
  if (rounded === 5) return 'Mild / Moderate swelling';
  if (rounded === 7) return 'Moderate / Severe swelling';
  if (rounded === 9) return 'Severe swelling / Total loss of function';
  if (rounded === 1) return 'Ok / Ache';

  return `${lowerDesc} / ${upperDesc}`;
}

export function getSeverityShortLabel(severity: number): string | null {
  return SEVERITY_BASE_DESCRIPTIONS[severity]?.short ?? null;
}

// Color interpolation:
// 0: Green (#22c55e)
// 2: Yellow (#eab308)
// 8: Red (#dc2626)
// 10: Black (#18181b)
export function getSeverityHexColor(severity: number): string {
  const s = Math.max(0, Math.min(10, severity));

  // Anchor points
  const anchors = [
    { s: 0, r: 34, g: 197, b: 94 },    // #22c55e (green)
    { s: 2, r: 234, g: 179, b: 8 },    // #eab308 (yellow)
    { s: 8, r: 220, g: 38, b: 38 },    // #dc2626 (red)
    { s: 10, r: 24, g: 24, b: 27 }     // #18181b (black)
  ];

  let lower = anchors[0];
  let upper = anchors[anchors.length - 1];

  for (let i = 0; i < anchors.length - 1; i++) {
    if (s >= anchors[i].s && s <= anchors[i + 1].s) {
      lower = anchors[i];
      upper = anchors[i + 1];
      break;
    }
  }

  const range = upper.s - lower.s;
  const t = range === 0 ? 0 : (s - lower.s) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * t);
  const g = Math.round(lower.g + (upper.g - lower.g) * t);
  const b = Math.round(lower.b + (upper.b - lower.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

export function getSeverityInfo(severity: number): SeverityInfo {
  const s = Math.max(0, Math.min(10, severity));
  const hex = getSeverityHexColor(s);
  const description = getSeverityDescription(s);
  const shortLabel = getSeverityShortLabel(s) || `${s}`;
  const textColor = s >= 9 ? '#ffffff' : s >= 2 && s <= 4 ? '#18181b' : '#ffffff';

  return {
    value: s,
    shortLabel,
    description,
    color: hex,
    textColor,
    bgClass: s === 0 ? 'bg-emerald-500' : s <= 2 ? 'bg-amber-400' : s <= 5 ? 'bg-orange-500' : s <= 8 ? 'bg-red-600' : 'bg-neutral-900 border border-red-900',
    borderClass: s === 0 ? 'border-emerald-500' : s <= 2 ? 'border-amber-400' : s <= 5 ? 'border-orange-500' : s <= 8 ? 'border-red-600' : 'border-neutral-700'
  };
}
