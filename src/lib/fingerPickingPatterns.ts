/**
 * Finger picking pattern library.
 *
 * Each `sequence` is an array of steps where 0 = lowest (bass) and
 * higher values = higher strings/treble. At runtime positions are clamped to
 * the actual number of held notes (Math.min(pos, noteCount - 1)).
 *
 * A step can be a single number (one note) or an array of numbers (pinch —
 * multiple notes played simultaneously).
 */

/** A single step: one note position, or multiple positions played at once. */
export type PatternStep = number | number[];

/** Classical right-hand finger designation: p=thumb, i=index, m=middle, a=ring. */
export type FingerLabel = 'p' | 'i' | 'm' | 'a';

/**
 * Finger annotation for a step. Parallel to `sequence`:
 * - Single step  → `FingerLabel | null`
 * - Pinch step   → `FingerLabel[]` (one per position) or `null`
 */
export type PatternStepFingers = FingerLabel | FingerLabel[] | null;

export interface FingerPickingPattern {
  id: string;
  name: string;
  description: string;
  /** Steps into sorted note array (0 = bass, N-1 = treble). */
  sequence: PatternStep[];
  /** Per-step finger annotations, parallel to `sequence`. */
  fingers: PatternStepFingers[];
  /** Canonical beat-count for one cycle (informational). */
  beatLength: number;
}

export const FINGER_PICKING_PATTERNS: FingerPickingPattern[] = [
  {
    id: 'travis',
    name: 'Travis Picking',
    description: 'Pinch bass+treble on downbeats, alternating thumb + fingers (country/folk)',
    sequence: [[0, 3], 2, [1, 3], 2, [0, 3], 2, [1, 3], 2],
    fingers: [['p', 'a'], 'm', ['p', 'a'], 'm', ['p', 'a'], 'm', ['p', 'a'], 'm'],
    beatLength: 8,
  },
  {
    id: 'alternatingBass',
    name: 'Alternating Bass',
    description: 'Thumb alternates two bass notes while fingers hit treble',
    sequence: [0, 2, 1, 2],
    fingers: ['p', 'm', 'p', 'm'],
    beatLength: 4,
  },
  {
    id: 'pima',
    name: 'PIMA (Classical)',
    description: 'Classical right-hand: P (thumb) then I-M-A ascending',
    sequence: [0, 1, 2, 3],
    fingers: ['p', 'i', 'm', 'a'],
    beatLength: 4,
  },
  {
    id: 'pimaDown',
    name: 'PIMA + Descend',
    description: 'Ascending then descending classical sweep',
    sequence: [0, 1, 2, 3, 3, 2, 1, 0],
    fingers: ['p', 'i', 'm', 'a', 'a', 'm', 'i', 'p'],
    beatLength: 8,
  },
  {
    id: 'neverGoingBack',
    name: 'Never Going Back Again',
    description: "Buckingham-style rolling 16th-note triplet cascade",
    sequence: [0, 1, 2, 1, 0, 1, 3, 1, 0, 1, 2, 1, 0, 1, 3, 1],
    fingers: ['p', 'i', 'm', 'i', 'p', 'i', 'a', 'i', 'p', 'i', 'm', 'i', 'p', 'i', 'a', 'i'],
    beatLength: 16,
  },
  {
    id: 'banjoForward',
    name: 'Banjo Forward Roll',
    description: 'Classic 3-finger banjo forward roll: T-I-M',
    sequence: [0, 2, 1, 0, 2, 1],
    fingers: ['p', 'm', 'i', 'p', 'm', 'i'],
    beatLength: 6,
  },
  {
    id: 'banjoAlternating',
    name: 'Banjo Alternating Roll',
    description: 'Alternating thumbs banjo roll: T-I-T-M',
    sequence: [0, 2, 1, 2, 0, 1, 0, 2],
    fingers: ['p', 'm', 'i', 'm', 'p', 'i', 'p', 'm'],
    beatLength: 8,
  },
  {
    id: 'waltz',
    name: 'Waltz (3/4)',
    description: 'Bass on beat 1, chord voicing on beats 2 and 3',
    sequence: [0, [1, 2, 3], [1, 2, 3]],
    fingers: ['p', ['i', 'm', 'a'], ['i', 'm', 'a']],
    beatLength: 3,
  },
  {
    id: 'celtic',
    name: 'Celtic Roll',
    description: 'Bass-accented alternating roll for reels',
    sequence: [0, 2, 0, 1, 0, 2, 0, 1],
    fingers: ['p', 'm', 'p', 'i', 'p', 'm', 'p', 'i'],
    beatLength: 8,
  },
  {
    id: 'claw',
    name: 'Claw Hammer',
    description: 'Brush down across treble strings + thumb bass pluck',
    sequence: [[1, 2, 3], 0, [1, 2, 3], 0],
    fingers: [['i', 'm', 'a'], 'p', ['i', 'm', 'a'], 'p'],
    beatLength: 4,
  },
];

/** Resolve a pattern position to an actual note index given the current note count. */
export function resolvePatternIndex(position: number, noteCount: number): number {
  if (noteCount <= 1) return 0;
  return Math.min(position, noteCount - 1);
}

export function getPatternById(id: string): FingerPickingPattern | undefined {
  return FINGER_PICKING_PATTERNS.find(p => p.id === id);
}
