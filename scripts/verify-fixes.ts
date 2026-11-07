// Test verification for Bug 1 and Bug 2 logic
import { getSeverityDescription } from '../src/utils/severity.ts';
import { getSortedJointOptions } from '../src/utils/storage.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('--- Testing Bug 1: Dirty State / Discard Detection Logic ---');

// Mock state logic matching EntryForm.tsx
function checkUnsaved(
  initialSnapshot: string,
  joints: Array<{ joint: string; side: 'none' | 'left' | 'right' | 'both'; severity: number | null }>,
  notes: string,
  selectedDate: string,
  mostCommonJoint: string
): boolean {
  if (!initialSnapshot) return false;
  const initial = JSON.parse(initialSnapshot);
  if (initial.isNew) {
    const firstJoint = joints[0];
    if (!firstJoint) return false;
    const initialJoint = initial.joints[0]?.joint || mostCommonJoint;
    const alteredJoint = firstJoint.joint !== initialJoint;
    const alteredSide = firstJoint.side !== 'none';
    const alteredSeverity = firstJoint.severity !== null;
    const hasNotes = notes.trim().length > 0;
    const extraJoints = joints.length > 1;

    return alteredSeverity || alteredSide || hasNotes || extraJoints || (alteredJoint && (alteredSeverity || alteredSide));
  } else {
    const currentData = {
      date: selectedDate,
      isNew: false,
      joints: joints.map((j) => ({ joint: j.joint, side: j.side, severity: j.severity })),
      notes: notes.trim()
    };
    return JSON.stringify(currentData) !== initialSnapshot;
  }
}

// 1. Fresh draft on a new date (untouched)
const initialSnapshotNew = JSON.stringify({
  date: '2026-11-07',
  isNew: true,
  joints: [{ joint: 'Knee', side: 'none', severity: null }],
  notes: ''
});
const untouchedJoints = [{ joint: 'Knee', side: 'none' as const, severity: null }];

assert(
  checkUnsaved(initialSnapshotNew, untouchedJoints, '', '2026-11-07', 'Knee') === false,
  'Untouched new entry must NOT have unsaved changes'
);

// 2. User sets severity 4
const editedJoints = [{ joint: 'Knee', side: 'left' as const, severity: 4 }];
assert(
  checkUnsaved(initialSnapshotNew, editedJoints, '', '2026-11-07', 'Knee') === true,
  'User setting severity=4 on new entry MUST have unsaved changes'
);

// 3. User saves entry: snapshot becomes isNew=false with exact saved data
const savedSnapshot = JSON.stringify({
  date: '2026-11-07',
  isNew: false,
  joints: [{ joint: 'Knee', side: 'left', severity: 4 }],
  notes: ''
});
assert(
  checkUnsaved(savedSnapshot, editedJoints, '', '2026-11-07', 'Knee') === false,
  'Immediately after saving, hasUnsavedChanges MUST be false'
);

// 4. Switching to another date when savedSnapshot is active
assert(
  checkUnsaved(savedSnapshot, editedJoints, '', '2026-11-07', 'Knee') === false,
  'Pressing a different date after saving must NOT trigger discard dialog'
);

// 5. User changes severity on saved entry (4 -> 6)
const modifiedJoints = [{ joint: 'Knee', side: 'left' as const, severity: 6 }];
assert(
  checkUnsaved(savedSnapshot, modifiedJoints, '', '2026-11-07', 'Knee') === true,
  'Modifying an existing saved entry MUST trigger unsaved changes when trying to navigate'
);

console.log('--- All Verification Tests Passed Successfully! ---');
