/** 12 pitch classes in circle-of-fifths order: C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F */
export const FIFTHS_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] as const;

const fifthsIndexMap = new Map<number, number>();
FIFTHS_ORDER.forEach((pc, i) => fifthsIndexMap.set(pc, i));

/** Get the index (0-11) of a pitch class on the circle of fifths */
export function getFifthsIndex(baseSemitones: number): number {
  return fifthsIndexMap.get(((baseSemitones % 12) + 12) % 12)!;
}

/** Whether a key root conventionally uses sharps (true) or flats (false) */
export function usesSharps(baseSemitones: number): boolean {
  return getFifthsIndex(baseSemitones) <= 6;
}

const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Convert a pitch class (0-11) to a display name */
export function noteName(baseSemitones: number, preferSharps?: boolean): string {
  const pc = ((baseSemitones % 12) + 12) % 12;
  const sharps = preferSharps ?? usesSharps(pc);
  return sharps ? sharpNames[pc]! : flatNames[pc]!;
}

/** Get the relative minor root (down 3 semitones) */
export function getRelativeMinor(semitones: number): number {
  return ((semitones - 3) % 12 + 12) % 12;
}

/** Get the relative major root (up 3 semitones) */
export function getRelativeMajor(semitones: number): number {
  return ((semitones + 3) % 12 + 12) % 12;
}

/** Get the dominant key root (up a perfect fifth) */
export function getDominantKey(semitones: number): number {
  return ((semitones + 7) % 12 + 12) % 12;
}

/** Get the subdominant key root (up a perfect fourth) */
export function getSubdominantKey(semitones: number): number {
  return ((semitones + 5) % 12 + 12) % 12;
}

/** Scale interval patterns as semitone arrays */
const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/** Get the set of diatonic pitch classes for a key */
export function getDiatonicPitchClasses(root: number, scaleType: 'major' | 'minor'): Set<number> {
  const intervals = SCALE_INTERVALS[scaleType]!;
  return new Set(intervals.map(i => ((root + i) % 12 + 12) % 12));
}

export interface DiatonicChord {
  degree: number;       // 1-7
  roman: string;        // "I", "ii", "iii", etc.
  rootSemitones: number;
  quality: string;      // "M", "m", "°"
  chordName: string;    // e.g. "C M", "D m", "B °"
}

const majorRomans = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const minorRomans = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

/** Derive diatonic triads for a key by stacking thirds from the scale */
export function getDiatonicChords(root: number, scaleType: 'major' | 'minor'): DiatonicChord[] {
  const intervals = SCALE_INTERVALS[scaleType]!;
  const romans = scaleType === 'major' ? majorRomans : minorRomans;
  const scalePitchClasses = intervals.map(i => ((root + i) % 12 + 12) % 12);
  const preferSharps = usesSharps(root);

  return scalePitchClasses.map((pc, idx) => {
    // Stack thirds: root, third (2 scale steps up), fifth (4 scale steps up)
    const thirdPc = scalePitchClasses[(idx + 2) % 7]!;
    const fifthPc = scalePitchClasses[(idx + 4) % 7]!;

    // Calculate intervals in semitones
    const thirdInterval = ((thirdPc - pc) % 12 + 12) % 12;
    const fifthInterval = ((fifthPc - pc) % 12 + 12) % 12;

    let quality: string;
    if (thirdInterval === 4 && fifthInterval === 7) {
      quality = 'M';
    } else if (thirdInterval === 3 && fifthInterval === 7) {
      quality = 'm';
    } else if (thirdInterval === 3 && fifthInterval === 6) {
      quality = '°';
    } else if (thirdInterval === 4 && fifthInterval === 8) {
      quality = '+';
    } else {
      quality = 'M'; // fallback
    }

    const name = noteName(pc, preferSharps);

    return {
      degree: idx + 1,
      roman: romans[idx]!,
      rootSemitones: pc,
      quality,
      chordName: `${name} ${quality}`,
    };
  });
}
