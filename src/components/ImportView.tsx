import React, { useState, useRef } from 'react';
import { Upload, Check, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { JointEntry } from '../types';
import { parseSpreadsheetData, ParsedImportResult } from '../utils/exportImport';
import { getAllEntries, saveAllEntries } from '../utils/storage';
import { getSeverityHexColor } from '../utils/severity';

interface ImportViewProps {
  onImportComplete: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onImportComplete }) => {
  const [importResult, setImportResult] = useState<ParsedImportResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [rawText, setRawText] = useState<string>('');
  const [isPastingText, setIsPastingText] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const res = parseSpreadsheetData(buffer);
      setImportResult(res);
      setSuccessMessage(null);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    setFileName('Pasted CSV text');
    const res = parseSpreadsheetData(rawText);
    setImportResult(res);
    setSuccessMessage(null);
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.validEntries.length === 0) return;

    const currentEntries = getAllEntries();

    let finalEntries: JointEntry[];
    if (importMode === 'replace') {
      finalEntries = importResult.validEntries;
    } else {
      // Merge mode:
      // Index existing entries by `date_joint`
      const map = new Map<string, JointEntry>();
      for (const e of currentEntries) {
        map.set(`${e.date}_${e.joint.toLowerCase()}`, e);
      }
      for (const e of importResult.validEntries) {
        map.set(`${e.date}_${e.joint.toLowerCase()}`, e);
      }
      finalEntries = Array.from(map.values());
    }

    saveAllEntries(finalEntries);
    setSuccessMessage(
      `Successfully imported ${importResult.validEntries.length} entries (${importMode === 'merge' ? 'merged' : 'replaced'})!`
    );
    setImportResult(null);
    setRawText('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    onImportComplete();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <span>📥</span>
          <span>Import Data</span>
        </h2>
        <p className="text-xs text-slate-400">
          Restore from backup or migrate records from CSV / Excel (.xlsx)
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-600/60 rounded-2xl flex items-center gap-2.5 text-emerald-200 text-sm font-semibold animate-fade-in shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
              Tap to browse CSV or Excel (.xlsx) file
            </span>
            <p className="text-xs text-slate-500 mt-0.5">Supports CSV, XLSX, XLS spreadsheets</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Alternative: Paste CSV text */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsPastingText(!isPastingText)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isPastingText ? 'Hide paste text field' : 'Or paste raw CSV text'}</span>
          </button>

          {isPastingText && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Date,Joint,Side,Severity,Severity description,Notes&#10;2026-10-19,Knee,right,4,Mild swelling,Sample note..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleParseRawText}
                disabled={!rawText.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 disabled:opacity-50 transition-colors"
              >
                Parse Text
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {importResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">File Preview: {fileName}</h3>
              <p className="text-xs text-slate-400">
                {importResult.validEntries.length} valid entries across {importResult.datesCount} dates
              </p>
            </div>
          </div>

          {/* Warnings / Errors */}
          {importResult.errors.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-700/50 rounded-xl space-y-1 text-xs text-amber-200">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importResult.errors.length} formatting warnings:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-amber-200/90 max-h-24 overflow-y-auto">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>...and {importResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Sample Table */}
          {importResult.validEntries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                First few records to import:
              </span>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5 pr-2">Date</th>
                      <th className="py-1.5 pr-2">Joint</th>
                      <th className="py-1.5 pr-2">Side</th>
                      <th className="py-1.5 pr-2">Severity</th>
                      <th className="py-1.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {importResult.validEntries.slice(0, 4).map((row, idx) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-1.5 pr-2 font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                        <td className="py-1.5 pr-2 font-medium whitespace-nowrap">{row.joint}</td>
                        <td className="py-1.5 pr-2 capitalize whitespace-nowrap">{row.side || 'none'}</td>
                        <td className="py-1.5 pr-2 whitespace-nowrap">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: getSeverityHexColor(row.severity) }}
                          >
                            {row.severity}
                          </span>
                        </td>
                        <td className="py-1.5 text-slate-400 text-[11px] truncate max-w-[120px]">
                          {row.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Mode Options */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Choose Import Mode:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'merge'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">Merge with Existing</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Keeps current entries, updates overlaps</div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'replace'
                    ? 'bg-red-500/10 border-red-500 text-red-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-red-300">Replace All Data</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Overwrites all local entries</div>
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={importResult.validEntries.length === 0}
            className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <span>Confirm & Import {importResult.validEntries.length} Records</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
