import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays, subMonths, subYears, parseISO, isAfter } from 'date-fns';
import { Activity, Flame, ShieldAlert, BarChart3, TrendingUp, Layers, Repeat } from 'lucide-react';
import { DayRecord, JointEntry, PlotMetric, PlotSeriesMode, TimeRange } from '../types';
import { getSeverityDescription } from '../utils/severity';
import { getDailySeveritySeries, computeCycleLength } from '../utils/insights.ts';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InsightsViewProps {
  dayRecords?: DayRecord[];
  allEntries: JointEntry[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ allEntries }) => {
  // Zoomable range - default to 1 month
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');

  // Available plots - default to max severity
  const [plotMetric, setPlotMetric] = useState<PlotMetric>('max_severity');

  // Available series - default to 'all' or 'joint' or 'side'
  const [seriesMode, setSeriesMode] = useState<PlotSeriesMode>('all');
  const [selectedJoint, setSelectedJoint] = useState<string>('all');

  // Calculate cutoff date based on timeRange
  const now = new Date();
  const startDate = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return subDays(now, 7);
      case '1m':
        return subMonths(now, 1);
      case '3m':
        return subMonths(now, 3);
      case '6m':
        return subMonths(now, 6);
      case '1y':
        return subYears(now, 1);
      case 'all':
      default:
        return new Date(0);
    }
  }, [timeRange]);

  // Filter entries within time range
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      const d = parseISO(e.date);
      return isAfter(d, startDate) || format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd');
    });
  }, [allEntries, startDate]);

  // Unique list of dates in ascending order
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    filteredEntries.forEach((e) => set.add(e.date));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredEntries]);

  // List of unique joints in range
  const jointsInRange = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEntries.forEach((e) => {
      counts.set(e.joint, (counts.get(e.joint) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([j]) => j);
  }, [filteredEntries]);

  // Summary Metrics
  const summary = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        avgSeverity: '0',
        maxSeverity: 0,
        totalEntries: 0,
        mostAffectedJoint: 'None',
        flareDaysCount: 0,
        cycle: {
          hasCycle: false,
          value: '—',
          detail: 'No entries in timeframe'
        }
      };
    }

    let maxSev = 0;
    let sumSev = 0;
    const jointCountMap = new Map<string, number>();
    const flareDates = new Set<string>();

    for (const e of filteredEntries) {
      if (e.severity > maxSev) maxSev = e.severity;
      sumSev += e.severity;
      jointCountMap.set(e.joint, (jointCountMap.get(e.joint) || 0) + 1);
      if (e.severity >= 4) {
        flareDates.add(e.date);
      }
    }

    let topJoint = 'None';
    let topJointCount = 0;
    for (const [j, count] of jointCountMap.entries()) {
      if (count > topJointCount) {
        topJointCount = count;
        topJoint = j;
      }
    }

    // Calculate cycle length (tip to tip & trough to trough)
    const seriesToAnalyze =
      seriesMode === 'joint' && selectedJoint !== 'all'
        ? filteredEntries.filter((e) => e.joint.toLowerCase() === selectedJoint.toLowerCase())
        : filteredEntries;

    const currentSeries = getDailySeveritySeries(seriesToAnalyze);
    let cycleResult = computeCycleLength(currentSeries);

    // If current window is short and has insufficient cycles, check overall history
    if (!cycleResult.hasCycle && timeRange !== 'all') {
      const allTimeToAnalyze =
        seriesMode === 'joint' && selectedJoint !== 'all'
          ? allEntries.filter((e) => e.joint.toLowerCase() === selectedJoint.toLowerCase())
          : allEntries;
      const allTimeResult = computeCycleLength(getDailySeveritySeries(allTimeToAnalyze));
      if (allTimeResult.hasCycle) {
        cycleResult = {
          ...allTimeResult,
          detail: `${allTimeResult.detail} (all time)`
        };
      }
    }

    return {
      avgSeverity: (sumSev / filteredEntries.length).toFixed(1),
      maxSeverity: maxSev,
      totalEntries: filteredEntries.length,
      mostAffectedJoint: topJoint,
      flareDaysCount: flareDates.size,
      cycle: cycleResult
    };
  }, [filteredEntries, allEntries, seriesMode, selectedJoint, timeRange]);

  // Prepare Chart.js Dataset
  const chartData = useMemo<ChartData<'line'>>(() => {
    if (distinctDates.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Friendly date labels (e.g. "Oct 19" or "10/19")
    const labels = distinctDates.map((d) => format(parseISO(d), 'MMM d'));

    const colorPalette = [
      { border: '#22d3ee', bg: 'rgba(34, 211, 238, 0.18)' }, // Cyan
      { border: '#818cf8', bg: 'rgba(129, 140, 248, 0.18)' }, // Indigo
      { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' }, // Sky
      { border: '#a78bfa', bg: 'rgba(167, 139, 250, 0.18)' }, // Violet
      { border: '#34d399', bg: 'rgba(52, 211, 153, 0.18)' }, // Emerald
      { border: '#f472b6', bg: 'rgba(244, 114, 182, 0.18)' }  // Pink
    ];

    if (seriesMode === 'all') {
      // Single aggregate line across all joints
      const dataPoints = distinctDates.map((d) => {
        const forDate = filteredEntries.filter((e) => e.date === d);
        if (forDate.length === 0) return 0;
        if (plotMetric === 'max_severity') {
          return Math.max(...forDate.map((e) => e.severity));
        } else if (plotMetric === 'joint_count') {
          return forDate.length;
        } else {
          return forDate.reduce((acc, e) => acc + e.severity, 0);
        }
      });

      const metricLabel =
        plotMetric === 'max_severity'
          ? 'Max Severity'
          : plotMetric === 'joint_count'
          ? 'Joint Count'
          : 'Severity Sum';

      return {
        labels,
        datasets: [
          {
            label: metricLabel,
            data: dataPoints,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.18)',
            fill: true,
            tension: 0.35, // Smoothed timeline
            borderWidth: 3,
            pointBackgroundColor: '#22d3ee',
            pointBorderColor: '#070c18',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      };
    }

    if (seriesMode === 'joint') {
      // Breakdown by Joint
      const targetJoints =
        selectedJoint !== 'all' ? [selectedJoint] : jointsInRange.slice(0, 4);

      const datasets = targetJoints.map((jointName, idx) => {
        const pal = colorPalette[idx % colorPalette.length];
        const dataPoints = distinctDates.map((d) => {
          const jointEntries = filteredEntries.filter(
            (e) => e.date === d && e.joint.toLowerCase() === jointName.toLowerCase()
          );
          if (jointEntries.length === 0) return null;
          if (plotMetric === 'max_severity') {
            return Math.max(...jointEntries.map((e) => e.severity));
          } else if (plotMetric === 'joint_count') {
            return jointEntries.length;
          } else {
            return jointEntries.reduce((acc, e) => acc + e.severity, 0);
          }
        });

        return {
          label: jointName,
          data: dataPoints,
          borderColor: pal.border,
          backgroundColor: pal.bg,
          fill: false,
          tension: 0.35, // Smoothed
          borderWidth: 2.5,
          spanGaps: true,
          pointBackgroundColor: pal.border,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });

      return { labels, datasets };
    }

    // Breakdown by Side
    const sides = [
      { key: 'left', label: 'Left', color: '#38bdf8' },
      { key: 'right', label: 'Right', color: '#f59e0b' },
      { key: 'both', label: 'Both', color: '#a855f7' }
    ];

    const datasets = sides.map((s) => {
      const dataPoints = distinctDates.map((d) => {
        const sideEntries = filteredEntries.filter((e) => e.date === d && e.side === s.key);
        if (sideEntries.length === 0) return null;
        if (plotMetric === 'max_severity') {
          return Math.max(...sideEntries.map((e) => e.severity));
        } else if (plotMetric === 'joint_count') {
          return sideEntries.length;
        } else {
          return sideEntries.reduce((acc, e) => acc + e.severity, 0);
        }
      });

      return {
        label: s.label,
        data: dataPoints,
        borderColor: s.color,
        backgroundColor: `${s.color}20`,
        fill: false,
        tension: 0.35,
        borderWidth: 2.5,
        spanGaps: true,
        pointBackgroundColor: s.color,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    return { labels, datasets };
  }, [distinctDates, filteredEntries, plotMetric, seriesMode, selectedJoint, jointsInRange]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: seriesMode !== 'all',
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { size: 11, family: 'Plus Jakarta Sans' },
          boxWidth: 12,
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            if (val === null || val === undefined) return '';
            if (plotMetric === 'max_severity') {
              return ` ${context.dataset.label}: ${val} (${getSeverityDescription(val)})`;
            } else if (plotMetric === 'joint_count') {
              return ` ${context.dataset.label}: ${val} ${val === 1 ? 'joint' : 'joints'}`;
            } else {
              return ` ${context.dataset.label}: ${val} total score`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        min: 0,
        max: plotMetric === 'max_severity' ? 10 : undefined,
        grid: { color: 'rgba(51, 65, 85, 0.4)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          stepSize: plotMetric === 'max_severity' ? 2 : 1
        }
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Flare Trends & Insights</h2>
        <p className="text-xs text-slate-400">
          Smoothed timeline of joint swelling, patterns, and flares over time
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-1 shadow-md">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Peak Flare</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {summary.maxSeverity} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-[10px] text-cyan-200/70 truncate">
            {getSeverityDescription(summary.maxSeverity)}
          </div>
        </div>

        <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-1 shadow-md">
          <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Avg Severity</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {summary.avgSeverity}
          </div>
          <div className="text-[10px] text-slate-400">
            Across {summary.totalEntries} entries
          </div>
        </div>

        <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-1 shadow-md">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Flare Days</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {summary.flareDaysCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Severity ≥ 4 (Swelling)
          </div>
        </div>

        <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-1 shadow-md">
          <div className="flex items-center gap-1.5 text-violet-400 text-xs font-semibold">
            <Repeat className="w-4 h-4 text-violet-400" />
            <span>Typical Cycle</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {summary.cycle.value}
          </div>
          <div className="text-[10px] text-violet-200/70 truncate" title={summary.cycle.detail}>
            {summary.cycle.detail}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-1 shadow-md">
          <div className="flex items-center gap-1.5 text-teal-400 text-xs font-semibold">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <span>Top Joint</span>
          </div>
          <div className="text-base font-extrabold text-white truncate">
            {summary.mostAffectedJoint}
          </div>
          <div className="text-[10px] text-slate-400">
            Most frequent flare
          </div>
        </div>
      </div>

      {/* Zoom / Time Range Picker (Default: 1 Month) */}
      <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-3 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-200/70">
            Timeline Zoom
          </span>
          <span className="text-[11px] text-cyan-400 font-semibold">
            {timeRange === '1m' ? 'Default: 1 Month' : timeRange.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1 bg-[#070c18] p-1 rounded-xl border border-cyan-950/40">
          {(['7d', '1m', '3m', '6m', '1y', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all touch-manipulation ${
                timeRange === r
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Plot Metric Selector: max severity (default), joint count, severity sum */}
        <div className="space-y-1.5 pt-1 border-t border-cyan-950/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Available Plot Metric:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'max_severity' as PlotMetric, label: 'Max Severity' },
              { id: 'joint_count' as PlotMetric, label: 'Joint Count' },
              { id: 'severity_sum' as PlotMetric, label: 'Severity Sum' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPlotMetric(m.id)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all touch-manipulation ${
                  plotMetric === m.id
                    ? 'bg-[#070c18] border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-[#070c18]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Series Selector: All, Joint, Side */}
        <div className="space-y-1.5 pt-1 border-t border-cyan-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Available Series:</span>
            </div>
            {seriesMode === 'joint' && jointsInRange.length > 0 && (
              <select
                value={selectedJoint}
                onChange={(e) => setSelectedJoint(e.target.value)}
                className="bg-[#070c18] border border-slate-800 text-[11px] text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">Top Joints (Combined)</option>
                {jointsInRange.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'all' as PlotSeriesMode, label: 'All Joints' },
              { id: 'joint' as PlotSeriesMode, label: 'By Joint' },
              { id: 'side' as PlotSeriesMode, label: 'By Side' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSeriesMode(s.id)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all touch-manipulation ${
                  seriesMode === s.id
                    ? 'bg-[#070c18] border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-[#070c18]/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Chart Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="h-64 sm:h-72 w-full">
          {distinctDates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Activity className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No records in this time range</p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting &ldquo;All&rdquo; or logging entries for recent days.
              </p>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};
