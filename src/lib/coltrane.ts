export type SymmetricDivision = 2 | 3 | 4 | 6;

export const DIVISION_PRESETS: Record<SymmetricDivision, { name: string; interval: number; description: string }> = {
  2: { name: 'Tritones', interval: 6, description: '6 pairs separated by tritones' },
  3: { name: 'Major Thirds', interval: 4, description: '4 groups of 3 — the Coltrane axis' },
  4: { name: 'Minor Thirds', interval: 3, description: '3 groups of 4 — diminished symmetry' },
  6: { name: 'Whole Tones', interval: 2, description: '2 groups of 6 — whole-tone sets' },
};

/**
 * Divide 12 pitch classes into symmetric axis groups.
 * Each group contains notes separated by `12/divisions` semitones.
 * Returns `divisions` groups, each with `12/divisions` members.
 */
export function getAxisGroups(root: number, divisions: SymmetricDivision): number[][] {
  const interval = 12 / divisions; // semitones between members of a group
  const numGroups = interval;       // number of distinct groups
  const groups: number[][] = [];
  for (let g = 0; g < numGroups; g++) {
    const group: number[] = [];
    for (let i = 0; i < divisions; i++) {
      group.push(((root + g) + i * interval) % 12);
    }
    groups.push(group);
  }
  return groups;
}

/** Interval class (1-6): the shortest distance between two pitch classes */
export function getIntervalClass(a: number, b: number): number {
  const diff = Math.abs(((a % 12) + 12) % 12 - ((b % 12) + 12) % 12);
  return diff > 6 ? 12 - diff : diff;
}

/**
 * Generate V-I cadence chain connecting axis tones.
 * For root=0, div=3: C → B7 → E → Eb7 → Ab → G7 → C
 * Each entry: { from, dominant, to } where dominant = (to + 7) % 12
 */
export function getCadences(root: number, divisions: SymmetricDivision): { from: number; dominant: number; to: number }[] {
  const interval = DIVISION_PRESETS[divisions].interval;
  const axisTones: number[] = [];
  for (let i = 0; i < 12 / interval; i++) {
    axisTones.push((root + i * interval) % 12);
  }
  return axisTones.map((from, i) => {
    const to = axisTones[(i + 1) % axisTones.length]!;
    const dominant = (to + 7) % 12; // V of the target
    return { from, dominant, to };
  });
}

/** 12 distinct hues for tracking pitch classes across views */
export const NOTE_COLORS: string[] = [
  '#ef4444', // C  - red
  '#f97316', // C# - orange
  '#eab308', // D  - yellow
  '#84cc16', // D# - lime
  '#22c55e', // E  - green
  '#14b8a6', // F  - teal
  '#06b6d4', // F# - cyan
  '#3b82f6', // G  - blue
  '#6366f1', // G# - indigo
  '#8b5cf6', // A  - violet
  '#d946ef', // A# - fuchsia
  '#ec4899', // B  - pink
];

export const INTERVAL_CLASS_INFO: { name: string; semitones: number; color: string }[] = [
  { name: 'Unison', semitones: 0, color: '#9ca3af' },
  { name: 'Minor 2nd / Major 7th', semitones: 1, color: '#ef4444' },
  { name: 'Major 2nd / Minor 7th', semitones: 2, color: '#f97316' },
  { name: 'Minor 3rd / Major 6th', semitones: 3, color: '#eab308' },
  { name: 'Major 3rd / Minor 6th', semitones: 4, color: '#22c55e' },
  { name: 'Perfect 4th / 5th', semitones: 5, color: '#3b82f6' },
  { name: 'Tritone', semitones: 6, color: '#8b5cf6' },
];

/** Colors for axis groups (up to 6) */
export const AXIS_COLORS: string[] = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];
