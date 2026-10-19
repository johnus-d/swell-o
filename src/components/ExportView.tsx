import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Copy, Check, ShieldCheck, FileSpreadsheet, Table } from 'lucide-react';
import { JointEntry } from '../types';
import { downloadCSV, downloadXLSX, exportToCSV, formatEntriesForExport } from '../utils/exportImport';
import { recordExportTime, getLastExportTime } from '../utils/storage';
import { getSeverityHexColor } from '../utils/severity';

interface ExportViewProps {
  allEntries: JointEntry[];
  onExportDone?: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ allEntries, onExportDone }) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [lastExportTs, setLastExportTs] = useState<number | null>(getLastExportTime());

  const handleDownloadCSV = () => {
    downloadCSV(allEntries);
    recordExportTime();
    setLastExportTs(Date.now());
    setDownloadSuccess('CSV downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
    if (onExportDone) onExportDone();
  };

  const handleDownloadXLSX = () => {
    downloadXLSX(allEntries);
    recordExportTime();
    setLastExportTs(Date.now());
    setDownloadSuccess('Excel (.xlsx) downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
    if (onExportDone) onExportDone();
  };

  const handleCopyClipboard = async () => {
    try {
      const csv = exportToCSV(allEntries);
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      recordExportTime();
      setLastExportTs(Date.now());
      setTimeout(() => setCopied(false), 2500);
      if (onExportDone) onExportDone();
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const sampleRows = formatEntriesForExport(allEntries).slice(0, 5);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <span>💾</span>
          <span>Export & Backup</span>
        </h2>
        <p className="text-xs text-slate-400">
          Zero data lock-in. Full ownership of your arthritis and joint logs.
        </p>
      </div>

      {/* Backup Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-200">Local Storage Backup</span>
          </div>
          <span className="text-xs text-slate-400">
            {allEntries.length} {allEntries.length === 1 ? 'total record' : 'total records'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Swell-o stores your diary locally on this device. Regular exports safeguard your data against browser cache clears or device upgrades.
        </p>
        <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>Last exported:</span>
          <span className="text-amber-400 font-semibold">
            {lastExportTs ? format(new Date(lastExportTs), 'PPpp') : 'Never'}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-600/60 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={allEntries.length === 0}
          className="h-14 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 active:scale-[0.99] rounded-2xl p-3 flex items-center gap-3 text-left transition-all disabled:opacity-50 touch-manipulation shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">Export CSV</div>
            <div className="text-[11px] text-slate-400">Universal comma-separated file</div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleDownloadXLSX}
          disabled={allEntries.length === 0}
          className="h-14 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 active:scale-[0.99] rounded-2xl p-3 flex items-center gap-3 text-left transition-all disabled:opacity-50 touch-manipulation shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">Export Excel (.xlsx)</div>
            <div className="text-[11px] text-slate-400">Formatted spreadsheet for Excel/Sheets</div>
          </div>
        </button>
      </div>

      {/* Copy CSV to Clipboard (Mobile Friendly) */}
      <button
        type="button"
        onClick={handleCopyClipboard}
        disabled={allEntries.length === 0}
        className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 touch-manipulation"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">CSV Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Copy CSV Data to Clipboard</span>
          </>
        )}
      </button>

      {/* Data Format Schema Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Table className="w-4 h-4 text-amber-400" />
          <span>Export Schema & Sample Rows</span>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Joint</th>
                <th className="py-2 pr-3 font-semibold">Side</th>
                <th className="py-2 pr-3 font-semibold">Severity</th>
                <th className="py-2 pr-3 font-semibold">Severity description</th>
                <th className="py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sampleRows.map((row, idx) => (
                <tr key={idx} className="text-slate-200 hover:bg-slate-800/40">
                  <td className="py-2 pr-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {row.Date}
                  </td>
                  <td className="py-2 pr-3 font-semibold whitespace-nowrap">{row.Joint}</td>
                  <td className="py-2 pr-3 text-slate-400 capitalize whitespace-nowrap">
                    {row.Side || '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold text-white inline-block"
                      style={{ backgroundColor: getSeverityHexColor(row.Severity) }}
                    >
                      {row.Severity}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-300 text-[11px] whitespace-nowrap">
                    {row['Severity description']}
                  </td>
                  <td className="py-2 text-slate-400 text-[11px] max-w-xs truncate">
                    {row.Notes || '—'}
                  </td>
                </tr>
              ))}
              {allEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                    No records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
