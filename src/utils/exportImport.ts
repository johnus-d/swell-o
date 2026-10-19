import * as XLSX from 'xlsx';
import type { JointEntry, SideType } from '../types/index.ts';
import { getSeverityDescription } from './severity.ts';

export interface ExportRow {
  Date: string;
  Joint: string;
  Side: string;
  Severity: number;
  'Severity description': string;
  Notes: string;
}

export function formatEntriesForExport(entries: JointEntry[]): ExportRow[] {
  // Sort by date descending, then severity descending
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.severity - a.severity;
  });

  return sorted.map((e) => ({
    Date: e.date,
    Joint: e.joint,
    Side: e.side === 'none' ? '' : e.side,
    Severity: e.severity,
    'Severity description': e.severityDescription || getSeverityDescription(e.severity),
    Notes: e.notes || ''
  }));
}

export function exportToCSV(entries: JointEntry[]): string {
  const rows = formatEntriesForExport(entries);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Date', 'Joint', 'Side', 'Severity', 'Severity description', 'Notes']
  });
  return XLSX.utils.sheet_to_csv(worksheet);
}

export function downloadCSV(entries: JointEntry[], filename?: string): void {
  const csvContent = exportToCSV(entries);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `swell-o-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadXLSX(entries: JointEntry[], filename?: string): void {
  const rows = formatEntriesForExport(entries);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Date', 'Joint', 'Side', 'Severity', 'Severity description', 'Notes']
  });
  
  // Set column widths for nice viewing in Excel
  worksheet['!cols'] = [
    { wch: 14 }, // Date
    { wch: 16 }, // Joint
    { wch: 10 }, // Side
    { wch: 10 }, // Severity
    { wch: 32 }, // Severity description
    { wch: 45 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Swell-o Diary');
  XLSX.writeFile(workbook, filename || `swell-o-export-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export interface ParsedImportResult {
  validEntries: JointEntry[];
  errors: string[];
  totalRows: number;
  datesCount: number;
}

export function parseSpreadsheetData(data: ArrayBuffer | string): ParsedImportResult {
  const errors: string[] = [];
  const validEntries: JointEntry[] = [];

  let workbook: XLSX.WorkBook;
  try {
    if (typeof data === 'string') {
      workbook = XLSX.read(data, { type: 'string', raw: true });
    } else {
      workbook = XLSX.read(data, { type: 'array', cellDates: false });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      validEntries: [],
      errors: [`Unable to parse file: ${message}`],
      totalRows: 0,
      datesCount: 0
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      validEntries: [],
      errors: ['The workbook does not contain any sheets.'],
      totalRows: 0,
      datesCount: 0
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  if (rawRows.length === 0) {
    return {
      validEntries: [],
      errors: ['File is empty or contains no records.'],
      totalRows: 0,
      datesCount: 0
    };
  }

  const distinctDates = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
    // Find keys case-insensitively
    const keys = Object.keys(row);
    const findKey = (prefix: string) =>
      keys.find((k) => k.trim().toLowerCase().startsWith(prefix.toLowerCase()));

    const dateKey = findKey('date');
    const jointKey = findKey('joint');
    const severityKey = findKey('severity');
    const sideKey = findKey('side');
    const notesKey = findKey('note');

    const rawDate = dateKey ? String(row[dateKey]).trim() : '';
    const rawJoint = jointKey ? String(row[jointKey]).trim() : '';
    const rawSev = severityKey !== undefined ? row[severityKey] : '';
    const rawSide = sideKey ? String(row[sideKey]).trim().toLowerCase() : '';
    const rawNotes = notesKey ? String(row[notesKey]).trim() : '';

    if (!rawDate && !rawJoint) {
      // Empty row, skip
      return;
    }

    if (!rawDate) {
      errors.push(`Row ${rowNum}: Missing Date`);
      return;
    }

    // Parse date
    let formattedDate = '';
    const numDate = Number(rawDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      formattedDate = rawDate;
    } else if (!isNaN(numDate) && numDate > 30000 && numDate < 80000) {
      // Excel serial date format (e.g. 45000 -> 2023)
      const dateObj = new Date(Math.round((numDate - 25569) * 86400 * 1000));
      formattedDate = dateObj.toISOString().split('T')[0];
    } else {
      // Try to parse standard date string
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      } else {
        errors.push(`Row ${rowNum}: Invalid date format "${rawDate}". Expected YYYY-MM-DD.`);
        return;
      }
    }

    if (!rawJoint) {
      errors.push(`Row ${rowNum}: Missing Joint`);
      return;
    }

    const sevNum = Number(rawSev);
    if (isNaN(sevNum) || sevNum < 0 || sevNum > 10) {
      errors.push(`Row ${rowNum}: Severity must be a number between 0 and 10. Got "${rawSev}".`);
      return;
    }

    let side: SideType = 'none';
    if (rawSide === 'left') side = 'left';
    else if (rawSide === 'right') side = 'right';
    else if (rawSide === 'both') side = 'both';

    distinctDates.add(formattedDate);

    validEntries.push({
      id: `imported_${formattedDate}_${idx}_${Date.now()}`,
      date: formattedDate,
      joint: rawJoint.charAt(0).toUpperCase() + rawJoint.slice(1),
      severity: Math.round(sevNum),
      severityDescription: getSeverityDescription(sevNum),
      side,
      notes: rawNotes,
      createdAt: Date.now() + idx
    });
  });

  return {
    validEntries,
    errors,
    totalRows: rawRows.length,
    datesCount: distinctDates.size
  };
}
