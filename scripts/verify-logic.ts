import assert from 'node:assert';
import { getSeverityDescription, getSeverityHexColor, getSeverityShortLabel } from '../src/utils/severity.ts';
import { getCollapsedDayRecords, getSortedJointOptions } from '../src/utils/storage.ts';
import { parseSpreadsheetData, exportToCSV } from '../src/utils/exportImport.ts';
import type { JointEntry } from '../src/types/index.ts';

console.log('🧪 Starting Swell-o Verification Tests...');

// 1. Severity descriptions
console.log('Testing severity descriptions...');
assert.strictEqual(getSeverityDescription(0), 'Ok');
assert.strictEqual(getSeverityDescription(1), 'Ok / Ache');
assert.strictEqual(getSeverityDescription(2), 'Ache');
assert.strictEqual(getSeverityDescription(3), 'Ache / Mild swelling');
assert.strictEqual(getSeverityDescription(4), 'Mild swelling');
assert.strictEqual(getSeverityDescription(5), 'Mild / Moderate swelling');
assert.strictEqual(getSeverityDescription(6), 'Moderate swelling');
assert.strictEqual(getSeverityDescription(7), 'Moderate / Severe swelling');
assert.strictEqual(getSeverityDescription(8), 'Severe swelling');
assert.strictEqual(getSeverityDescription(9), 'Severe swelling / Total loss of function');
assert.strictEqual(getSeverityDescription(10), 'Total loss of function');

// Short ticks
assert.strictEqual(getSeverityShortLabel(0), 'ok');
assert.strictEqual(getSeverityShortLabel(2), 'ache');
assert.strictEqual(getSeverityShortLabel(4), 'mild');
assert.strictEqual(getSeverityShortLabel(6), 'med');
assert.strictEqual(getSeverityShortLabel(8), 'severe');
assert.strictEqual(getSeverityShortLabel(10), 'total');

// 2. Color verification
console.log('Testing severity color anchors...');
assert.strictEqual(getSeverityHexColor(0), 'rgb(34, 197, 94)'); // green
assert.strictEqual(getSeverityHexColor(2), 'rgb(234, 179, 8)');  // yellow
assert.strictEqual(getSeverityHexColor(8), 'rgb(220, 38, 38)');  // red
assert.strictEqual(getSeverityHexColor(10), 'rgb(24, 24, 27)');  // black

// 3. Collapsing entries by date & stable descending severity sort
console.log('Testing day collapsing and stable descending sort...');
const mockEntries: JointEntry[] = [
  {
    id: '1',
    date: '2026-10-19',
    joint: 'Knee',
    side: 'right',
    severity: 4,
    severityDescription: 'Mild swelling',
    notes: 'Knee seems to be on the way up. Elbow also hurts but less.',
    createdAt: 1000
  },
  {
    id: '2',
    date: '2026-10-19',
    joint: 'Elbow',
    side: 'left',
    severity: 2,
    severityDescription: 'Ache',
    notes: '',
    createdAt: 1001
  },
  {
    id: '3',
    date: '2026-10-19',
    joint: 'Wrist',
    side: 'both',
    severity: 4,
    severityDescription: 'Mild swelling',
    notes: '',
    createdAt: 1002
  },
  {
    id: '4',
    date: '2026-10-18',
    joint: 'Ankle',
    side: 'left',
    severity: 6,
    severityDescription: 'Moderate swelling',
    notes: 'Prior day ankle flare',
    createdAt: 900
  }
];

const collapsed = getCollapsedDayRecords(mockEntries);
assert.strictEqual(collapsed.length, 2);

const day19 = collapsed.find((d) => d.date === '2026-10-19');
assert(day19 !== undefined);
assert.strictEqual(day19.entries.length, 3);
assert.strictEqual(day19.maxSeverity, 4);
assert.strictEqual(day19.totalSeverity, 10);
assert.strictEqual(day19.notes, 'Knee seems to be on the way up. Elbow also hurts but less.');

// Check descending sort order:
// Severity 4 (Knee, index 0), then Severity 4 (Wrist, index 2), then Severity 2 (Elbow, index 1)
assert.strictEqual(day19.entries[0].joint, 'Knee');
assert.strictEqual(day19.entries[0].severity, 4);
assert.strictEqual(day19.entries[1].joint, 'Wrist');
assert.strictEqual(day19.entries[1].severity, 4);
assert.strictEqual(day19.entries[2].joint, 'Elbow');
assert.strictEqual(day19.entries[2].severity, 2);

// 4. Joint frequency sorting
console.log('Testing joint frequency ranking...');
const { sortedJoints, mostCommonJoint } = getSortedJointOptions(mockEntries);
// Knee, Wrist, Elbow, Ankle each have entries; others have 0
assert(['Knee', 'Wrist', 'Ankle', 'Elbow'].includes(mostCommonJoint));
assert(sortedJoints.indexOf('Knee') < sortedJoints.indexOf('Jaw'));

// 5. CSV Export and Import
console.log('Testing CSV export & import roundtrip...');
const csv = exportToCSV(mockEntries);
assert(csv.includes('2026-10-19'));
assert(csv.includes('Knee'));
assert(csv.includes('Mild swelling'));

const parsed = parseSpreadsheetData(csv);
assert.strictEqual(parsed.errors.length, 0);
assert.strictEqual(parsed.validEntries.length, 4);
assert.strictEqual(parsed.datesCount, 2);

console.log('All Swell-o logic verification tests passed with 100% success! 🎉');
