export type SideType = 'left' | 'right' | 'both' | 'none';

export interface JointEntry {
  id: string;
  date: string; // YYYY-MM-DD
  joint: string;
  side: SideType;
  severity: number; // 0 - 10
  severityDescription: string;
  notes?: string;
  createdAt: number;
}

export interface DayRecord {
  date: string;
  entries: JointEntry[];
  notes: string;
  maxSeverity: number;
  totalSeverity: number;
  jointCount: number;
}

export interface JointStats {
  joint: string;
  count: number;
  avgSeverity: number;
  maxSeverity: number;
}

export type PlotMetric = 'max_severity' | 'joint_count' | 'severity_sum';
export type PlotSeriesMode = 'all' | 'joint' | 'side';
export type TimeRange = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';
