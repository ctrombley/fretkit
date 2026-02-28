/**
 * Modal relations: find which scales/modes contain a set of pitch classes,
 * and enumerate all modal rotations of a scale.
 *
 * Completes the Scale/Mode API by providing the "what scale am I in?" query
 * that mirrors astrokit's ZodiacSign.triplicity() / quadruplicity() groupings
 * (elements and modalities that share a common membership structure).
 */

import Interval from './Interval';
import { noteName, usesSharps } from './harmony';
import scales from './scales';
import modes from './modes';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert an interval string array + root semitones to a Set of pitch classes. */
function scaleToPitchClasses(root: number, intervalStrs: string[]): Set<number> {
  return new Set(
    intervalStrs.map(s => ((root + new Interval(s).semitones) % 12 + 12) % 12),
  );
}

// Merge scales and modes into a single lookup, preferring readable names.
const ALL_SCALE_TYPES: Record<string, string[]> = { ...scales, ...modes };

// ── Scale mode rotations ──────────────────────────────────────────────────

export interface ModeRotation {
  /** 1-based degree of the parent scale this rotation starts on. */
  degree: number;
  /** Pitch class of this mode's root. */
  root: number;
  rootName: string;
  /** Mode name if known (church mode for major scale), otherwise "Mode N". */
  modeName: string;
  /** Pitch classes in ascending order starting from this root. */
  pitchClasses: number[];
}

// Church mode names for major (ionian) scale rotations.
const IONIAN_MODE_NAMES = [
  'ionian', 'dorian', 'phrygian', 'lydian',
  'mixolydian', 'aeolian', 'locrian',
];

/**
 * Generate all modal rotations of a scale.
 *
 * @param intervalStrs - interval strings from scales.ts / modes.ts
 * @param scaleRoot    - pitch class of the parent scale root (0–11)
 * @param modeNames    - optional override names for each rotation
 */
export function getScaleModes(
  intervalStrs: string[],
  scaleRoot: number,
  modeNames?: string[],
): ModeRotation[] {
  const n = intervalStrs.length;
  const pitchClasses = intervalStrs.map(s =>
    ((scaleRoot + new Interval(s).semitones) % 12 + 12) % 12,
  );

  return Array.from({ length: n }, (_, i) => {
    const root = pitchClasses[i]!;
    const rotated = [
      ...pitchClasses.slice(i),
      ...pitchClasses.slice(0, i),
    ];
    return {
      degree: i + 1,
      root,
      rootName: noteName(root, usesSharps(root)),
      modeName: modeNames?.[i] ?? IONIAN_MODE_NAMES[i] ?? `Mode ${i + 1}`,
      pitchClasses: rotated,
    };
  });
}

// ── Scale membership search ───────────────────────────────────────────────

export interface ScaleMatch {
  /** Pitch class of the scale root. */
  root: number;
  rootName: string;
  /** Scale or mode name from the lookup table. */
  scaleName: string;
  /**
   * Which degree of the scale the lowest provided pitch class sits on (1-based).
   * Useful for displaying "you are on the Nth mode of X".
   */
  degree: number;
}

/**
 * Find all named scales/modes whose pitch class content is a superset of
 * the given pitch classes.
 *
 * Analogous to astrokit's dignity system finding the "best sign" for a planet:
 * here we find every tonal environment in which a chord or melodic fragment
 * "belongs."
 *
 * @param pcs        - pitch classes to search for
 * @param scaleNames - optional subset of scale names to check (default: all)
 */
export function containingScales(
  pcs: number[],
  scaleNames?: string[],
): ScaleMatch[] {
  if (pcs.length === 0) return [];

  const target = new Set(pcs.map(p => ((p % 12) + 12) % 12));
  const names = scaleNames ?? Object.keys(ALL_SCALE_TYPES);
  const results: ScaleMatch[] = [];

  // Deduplicate scale names that are aliases of the same interval array.
  const seen = new Set<string>();

  for (const scaleName of names) {
    const intervalStrs = ALL_SCALE_TYPES[scaleName];
    if (!intervalStrs) continue;

    for (let root = 0; root < 12; root++) {
      const scaleSet = scaleToPitchClasses(root, intervalStrs);
      if (![...target].every(pc => scaleSet.has(pc))) continue;

      // Deduplicate: skip if we already have this root + same pitch class content.
      const key = `${root}:${[...scaleSet].sort((a, b) => a - b).join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Find which degree the first target pitch class sits on.
      const scalePcs = intervalStrs.map(s =>
        ((root + new Interval(s).semitones) % 12 + 12) % 12,
      );
      const firstTarget = [...target][0]!;
      const degree = scalePcs.indexOf(firstTarget) + 1;

      results.push({
        root,
        rootName: noteName(root, usesSharps(root)),
        scaleName,
        degree: degree > 0 ? degree : 1,
      });
    }
  }

  return results;
}

/**
 * Check if two sets of pitch classes have identical content (modal equivalence).
 * Two scales are modally equivalent if they are rotations of each other —
 * e.g. C major and D dorian.
 */
export function areModallyEquivalent(a: number[], b: number[]): boolean {
  const sortedA = [...new Set(a.map(p => ((p % 12) + 12) % 12))].sort((x, y) => x - y);
  const sortedB = [...new Set(b.map(p => ((p % 12) + 12) % 12))].sort((x, y) => x - y);
  return sortedA.length === sortedB.length && sortedA.every((p, i) => p === sortedB[i]);
}
