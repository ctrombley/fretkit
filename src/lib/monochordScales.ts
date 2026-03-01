import { noteName, usesSharps } from './harmony';
import { getPitchClassColor } from './noteColors';

// ── Types ──────────────────────────────────────────────────────────────────

/** A single position entry in a scale definition. Stores ratio (pos + semitones)
 *  so pin colors/note-names recompute correctly when the fundamental changes. */
export interface ScaleEntry {
  pos: number;       // bridge position [0, 1]
  semitones: number; // semitones above fundamental (approx, for pitch-class color)
  ratio: string;     // display label e.g. "3:2", "H3", "ET+7"
}

/** A rendered pin on the string canvas — computed from ScaleEntry + current fundamental. */
export interface ScalePin {
  pos: number;
  semitones: number;
  color: string;
  noteName: string;
  ratio: string;
}

export interface ScalePreset {
  id: string;
  name: string;
  description: string;
  entries: ScaleEntry[];
  isFactory: true;
}

export interface UserScalePreset {
  id: string;
  name: string;
  entries: ScaleEntry[];
}

// ── Entry helpers ──────────────────────────────────────────────────────────

/** Build a ScaleEntry from integer freq ratio (num:den).
 *  A left-segment frequency of (num/den)×fund requires bridge at pos = den/num. */
function entry(num: number, den: number, ratio?: string): ScaleEntry {
  const pos = den / num;
  const semitones = Math.round(12 * Math.log2(num / den));
  return { pos, semitones, ratio: ratio ?? `${num}:${den}` };
}

/** Build a ScaleEntry from an equal-tempered semitone count. */
function etEntry(st: number): ScaleEntry {
  const pos = Math.pow(2, -st / 12);
  return { pos, semitones: st, ratio: `ET+${st}` };
}

// ── Factory presets ────────────────────────────────────────────────────────

export const FACTORY_SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No scale pins',
    isFactory: true,
    entries: [],
  },
  {
    id: 'ji-major',
    name: 'JI Major',
    description: 'Ptolemaic just intonation major scale',
    isFactory: true,
    entries: [
      entry(9,  8,  '9:8'),   // major 2nd
      entry(5,  4,  '5:4'),   // major 3rd
      entry(4,  3,  '4:3'),   // perfect 4th
      entry(3,  2,  '3:2'),   // perfect 5th
      entry(5,  3,  '5:3'),   // major 6th
      entry(15, 8,  '15:8'),  // major 7th
      entry(2,  1,  '2:1'),   // octave
    ],
  },
  {
    id: 'ji-minor',
    name: 'JI Minor',
    description: 'Just intonation natural minor scale',
    isFactory: true,
    entries: [
      entry(9,  8,  '9:8'),   // major 2nd
      entry(6,  5,  '6:5'),   // minor 3rd
      entry(4,  3,  '4:3'),   // perfect 4th
      entry(3,  2,  '3:2'),   // perfect 5th
      entry(8,  5,  '8:5'),   // minor 6th
      entry(16, 9,  '16:9'),  // minor 7th
      entry(2,  1,  '2:1'),   // octave
    ],
  },
  {
    id: 'pythagorean',
    name: 'Pythagorean',
    description: 'Seven-tone scale built from stacked perfect fifths (3:2)',
    isFactory: true,
    entries: [
      entry(9,   8,   '9:8'),     // major 2nd
      entry(81,  64,  '81:64'),   // Pythagorean major 3rd
      entry(4,   3,   '4:3'),     // perfect 4th
      entry(3,   2,   '3:2'),     // perfect 5th
      entry(27,  16,  '27:16'),   // Pythagorean major 6th
      entry(243, 128, '243:128'), // Pythagorean major 7th
      entry(2,   1,   '2:1'),     // octave
    ],
  },
  {
    id: 'pentatonic',
    name: 'Pentatonic',
    description: 'Five-tone just pentatonic (1 2 3 5 6)',
    isFactory: true,
    entries: [
      entry(9, 8, '9:8'),  // major 2nd
      entry(5, 4, '5:4'),  // major 3rd
      entry(3, 2, '3:2'),  // perfect 5th
      entry(5, 3, '5:3'),  // major 6th
      entry(2, 1, '2:1'),  // octave
    ],
  },
  {
    id: 'harmonic',
    name: 'Harmonic Series',
    description: 'Overtone series partials H2–H8, plus common octave-reduced intervals',
    isFactory: true,
    entries: [
      // Octave-reduced intervals from lower harmonics
      entry(5, 4,  '5:4'),   // H5 reduced — major 3rd
      entry(3, 2,  '3:2'),   // H3 reduced — perfect 5th
      entry(7, 4,  '7:4'),   // H7 reduced — harmonic minor 7th
      // Upper harmonics (positions in first octave above fund)
      entry(2, 1,  'H2'),    // octave
      entry(3, 1,  'H3'),    // oct + 5th
      entry(4, 1,  'H4'),    // 2 oct
      entry(5, 1,  'H5'),    // 2 oct + M3
      entry(6, 1,  'H6'),    // 2 oct + 5th
      entry(7, 1,  'H7'),    // 2 oct + ~m7
      entry(8, 1,  'H8'),    // 3 oct
    ],
  },
  {
    id: '12tet',
    name: '12-TET',
    description: 'All 12 equal-tempered semitones',
    isFactory: true,
    entries: [
      etEntry(1),
      etEntry(2),
      etEntry(3),
      etEntry(4),
      etEntry(5),
      etEntry(6),
      etEntry(7),
      etEntry(8),
      etEntry(9),
      etEntry(10),
      etEntry(11),
      etEntry(12),
    ],
  },
  {
    id: 'blues',
    name: 'Blues Scale',
    description: 'Six-tone blues scale (pentatonic minor + tritone)',
    isFactory: true,
    entries: [
      entry(6,  5,  '6:5'),   // minor 3rd
      entry(4,  3,  '4:3'),   // perfect 4th
      entry(45, 32, '45:32'), // augmented 4th (just tritone)
      entry(3,  2,  '3:2'),   // perfect 5th
      entry(16, 9,  '16:9'),  // minor 7th
      entry(2,  1,  '2:1'),   // octave
    ],
  },
];

// ── Compute pins from entries ──────────────────────────────────────────────

/** Recompute ScalePins from entries whenever the fundamental changes. */
export function computeScalePins(
  entries: ScaleEntry[],
  fundPitchClass: number,
): ScalePin[] {
  return entries.map(e => {
    const pc    = ((fundPitchClass + e.semitones) % 12 + 12) % 12;
    const sharp = usesSharps(pc);
    return {
      pos:      e.pos,
      semitones: e.semitones,
      color:    getPitchClassColor(pc),
      noteName: noteName(pc, sharp),
      ratio:    e.ratio,
    };
  });
}

/** Create a ScaleEntry from a bridge position (for user-pinned tones). */
export function posToEntry(pos: number, label?: string): ScaleEntry {
  const semitones = Math.round(12 * Math.log2(1 / pos));

  // Try to find a simple rational label (denominator ≤ 16)
  let bestRatio = label ?? '';
  if (!bestRatio) {
    let bestDist = 1e9;
    for (let n = 2; n <= 16; n++) {
      for (let k = 1; k < n; k++) {
        const d = Math.abs(pos - k / n);
        if (d < bestDist && d < 0.003) {
          bestDist = d;
          bestRatio = `${k}/${n}`;
        }
      }
    }
    if (!bestRatio) bestRatio = `${(pos * 100).toFixed(1)}%`;
  }
  return { pos, semitones, ratio: bestRatio };
}
