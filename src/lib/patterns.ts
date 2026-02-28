/**
 * Pitch class set pattern detection and Forte set class identification.
 *
 * Inspired by astrokit's Chart.patterns(), which detects structural aspect
 * patterns (Grand Trine = 3 bodies 120° apart, T-Square, Grand Cross) in
 * astrological charts.
 *
 * Here we detect the equivalent musical structures — symmetric sets, special
 * scale types, and inversional symmetry — and look up Forte prime form numbers
 * for common set classes.
 *
 * Musical parallels to astrokit patterns:
 *   Grand Trine (3 × 120°)  ↔  Augmented triad (3 × 4 semitones)
 *   T-Square (2 × 90°)       ↔  Diminished 7th axis pair
 *   Grand Cross (4 × 90°)   ↔  Fully diminished 7th chord (4 × 3 semitones)
 */

import { primeForm } from './pitchClassSet';

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizePcs(pcs: number[]): number[] {
  return [...new Set(pcs.map(p => ((p % 12) + 12) % 12))].sort((a, b) => a - b);
}

/** True if the set is unchanged by transposing every pc by `n` semitones. */
function hasTranspositionSymmetry(pcs: number[], n: number): boolean {
  const set = new Set(normalizePcs(pcs));
  return normalizePcs(pcs).every(p => set.has(((p + n) % 12 + 12) % 12));
}

// ── Symmetry ──────────────────────────────────────────────────────────────

export interface SymmetryResult {
  /** Number of distinct transpositions that map the set to itself. */
  folds: number;
  /** Semitone interval between elements in each symmetric group. */
  interval: number;
  description: string;
}

/**
 * Detect all transposition symmetries of a pitch class set.
 * A set has n-fold symmetry when transposing by 12/n semitones leaves it
 * unchanged. Returns one entry per symmetry order found.
 *
 * Examples:
 *   Augmented triad {0,4,8}   → 3-fold (interval=4)
 *   Dim7 {0,3,6,9}            → 4-fold (interval=3)
 *   Whole tone {0,2,4,6,8,10} → 6-fold (interval=2)
 */
export function detectSymmetry(pcs: number[]): SymmetryResult[] {
  const candidates: Array<{ folds: number; interval: number; description: string }> = [
    { folds: 2,  interval: 6, description: '2-fold tritone symmetry' },
    { folds: 3,  interval: 4, description: '3-fold major-third symmetry (augmented axis)' },
    { folds: 4,  interval: 3, description: '4-fold minor-third symmetry (diminished axis)' },
    { folds: 6,  interval: 2, description: '6-fold whole-tone symmetry' },
    { folds: 12, interval: 1, description: '12-fold (chromatic — all transpositions)' },
  ];
  return candidates.filter(c => hasTranspositionSymmetry(pcs, c.interval));
}

/**
 * Find axes of inversional symmetry.
 * Axis `t` means I_t(x) = (t − x) mod 12 maps the set onto itself.
 * Returns all axis values 0–11 for which the set is self-inverse.
 */
export function symmetryAxes(pcs: number[]): number[] {
  const set = new Set(normalizePcs(pcs));
  return Array.from({ length: 12 }, (_, axis) => axis).filter(axis =>
    normalizePcs(pcs).every(p => set.has(((axis - p) % 12 + 12) % 12)),
  );
}

/** True if the set maps onto itself under at least one inversion. */
export function isSelfInverse(pcs: number[]): boolean {
  return symmetryAxes(pcs).length > 0;
}

// ── Special set detection ─────────────────────────────────────────────────

/** True if `pcs` is a whole-tone hexachord (6 pcs, all whole steps apart). */
export function isWholeTone(pcs: number[]): boolean {
  const u = normalizePcs(pcs);
  return u.length === 6 && u.every((p, i) => i === 0 || p - u[i - 1]! === 2);
}

/** True if `pcs` is the octatonic (diminished) scale (8 pcs, alternating 1/2). */
export function isOctatonic(pcs: number[]): boolean {
  const u = normalizePcs(pcs);
  if (u.length !== 8) return false;
  // Compute each step interval, wrapping around the octave at the boundary.
  const intervals = u.map((p, i) => {
    const prev = u[(i - 1 + u.length) % u.length]!;
    return ((p - prev) % 12 + 12) % 12;
  });
  // Allow rotations starting on either half or whole step.
  return intervals.every(iv => iv === 1 || iv === 2);
}

/** True if `pcs` is an augmented triad (3 pcs, each a major third apart). */
export function isAugmented(pcs: number[]): boolean {
  return normalizePcs(pcs).length === 3 && hasTranspositionSymmetry(pcs, 4);
}

/** True if `pcs` is a fully-diminished seventh chord (4 pcs, each a minor third apart). */
export function isDiminishedSeventh(pcs: number[]): boolean {
  return normalizePcs(pcs).length === 4 && hasTranspositionSymmetry(pcs, 3);
}

/** True if any two pcs in the set form a tritone (6 semitones). */
export function hasTritone(pcs: number[]): boolean {
  const u = normalizePcs(pcs);
  return u.some(p => u.some(q => p !== q && Math.abs(p - q) === 6));
}

// ── Pattern detection ─────────────────────────────────────────────────────

export interface SetPattern {
  name: string;
  description: string;
}

/**
 * Detect named structural patterns in a pitch class set.
 *
 * Direct musical parallel to astrokit's Chart.patterns():
 *   Grand Trine → augmented triad / 3-fold symmetry
 *   Grand Cross → fully-diminished 7th
 *   T-Square    → tritone-axis pair within a larger set
 *   Stellium    → chromatic cluster
 */
export function detectPatterns(pcs: number[]): SetPattern[] {
  const patterns: SetPattern[] = [];

  if (isAugmented(pcs)) {
    patterns.push({
      name: 'Augmented triad',
      description: '3-fold symmetry — major thirds form a perfect equilateral triangle',
    });
  }

  if (isDiminishedSeventh(pcs)) {
    patterns.push({
      name: 'Diminished seventh',
      description: '4-fold symmetry — minor thirds divide the octave into four equal parts',
    });
  }

  if (isWholeTone(pcs)) {
    patterns.push({
      name: 'Whole-tone scale',
      description: '6-fold symmetry — all whole steps, no tonal gravity',
    });
  }

  if (isOctatonic(pcs)) {
    patterns.push({
      name: 'Octatonic scale',
      description: 'Diminished scale — alternating half and whole steps, 4-fold symmetry',
    });
  }

  if (hasTritone(pcs) && normalizePcs(pcs).length <= 4) {
    patterns.push({
      name: 'Tritone axis',
      description: 'Contains tritone-related pitch classes — maximum intervallic tension',
    });
  }

  // Generic symmetry (not already covered above).
  const symm = detectSymmetry(pcs);
  if (
    symm.length > 0 &&
    !isAugmented(pcs) &&
    !isDiminishedSeventh(pcs) &&
    !isWholeTone(pcs)
  ) {
    patterns.push({
      name: 'Symmetric set',
      description: symm[0]!.description,
    });
  }

  if (isSelfInverse(pcs) && patterns.length === 0) {
    const axes = symmetryAxes(pcs);
    patterns.push({
      name: 'Inversionally symmetric',
      description: `Self-inverse under I_${axes[0]} — maps onto itself when inverted`,
    });
  }

  return patterns;
}

// ── Forte set class table ─────────────────────────────────────────────────

export interface SetClassInfo {
  primeForm: number[];
  /** Forte number, e.g. "4-27". */
  forteNumber: string;
  /** Common name if one exists, e.g. "major triad". */
  commonName?: string;
}

// Curated table of the most common and musically important set classes.
// Prime forms are computed by the primeForm() algorithm.
const FORTE_TABLE: Array<{ pf: number[]; forte: string; name?: string }> = [
  // ── Trichords (3-n) ──────────────────────────────────────────────────
  { pf: [0, 1, 2], forte: '3-1',  name: 'chromatic cluster' },
  { pf: [0, 1, 3], forte: '3-2' },
  { pf: [0, 1, 4], forte: '3-3' },
  { pf: [0, 1, 5], forte: '3-4' },
  { pf: [0, 1, 6], forte: '3-5' },
  { pf: [0, 2, 4], forte: '3-6',  name: 'whole-tone trichord' },
  { pf: [0, 2, 5], forte: '3-7' },
  { pf: [0, 2, 6], forte: '3-8' },
  { pf: [0, 2, 7], forte: '3-9',  name: 'suspended triad / quartal' },
  { pf: [0, 3, 6], forte: '3-10', name: 'diminished triad' },
  { pf: [0, 3, 7], forte: '3-11', name: 'minor / major triad' },
  { pf: [0, 4, 8], forte: '3-12', name: 'augmented triad' },
  // ── Tetrachords (4-n) ────────────────────────────────────────────────
  { pf: [0, 1, 2, 3], forte: '4-1' },
  { pf: [0, 1, 2, 4], forte: '4-2' },
  { pf: [0, 1, 3, 4], forte: '4-3' },
  { pf: [0, 1, 2, 5], forte: '4-4' },
  { pf: [0, 1, 2, 6], forte: '4-5' },
  { pf: [0, 1, 2, 7], forte: '4-6' },
  { pf: [0, 1, 4, 5], forte: '4-7' },
  { pf: [0, 1, 5, 6], forte: '4-8' },
  { pf: [0, 1, 6, 7], forte: '4-9' },
  { pf: [0, 2, 3, 5], forte: '4-10' },
  { pf: [0, 1, 3, 5], forte: '4-11' },
  { pf: [0, 2, 3, 6], forte: '4-12' },
  { pf: [0, 1, 3, 6], forte: '4-13' },
  { pf: [0, 2, 3, 7], forte: '4-14' },
  { pf: [0, 1, 4, 6], forte: '4-15' },
  { pf: [0, 1, 5, 7], forte: '4-16' },
  { pf: [0, 3, 4, 7], forte: '4-17' },
  { pf: [0, 1, 4, 7], forte: '4-18' },
  { pf: [0, 1, 4, 8], forte: '4-19', name: 'minor-major seventh' },
  { pf: [0, 1, 5, 8], forte: '4-20', name: 'major seventh chord' },
  { pf: [0, 2, 4, 6], forte: '4-21', name: 'whole-tone tetrachord' },
  { pf: [0, 2, 4, 7], forte: '4-22', name: 'major/minor seventh' },
  { pf: [0, 2, 5, 7], forte: '4-23', name: 'quartal tetrachord' },
  { pf: [0, 2, 4, 8], forte: '4-24' },
  { pf: [0, 2, 6, 8], forte: '4-25', name: 'French augmented sixth' },
  { pf: [0, 3, 5, 8], forte: '4-26', name: 'minor seventh chord' },
  { pf: [0, 2, 5, 8], forte: '4-27', name: 'half-diminished / dominant seventh' },
  { pf: [0, 3, 6, 9], forte: '4-28', name: 'fully-diminished seventh' },
  // ── Pentachords (5-n) ────────────────────────────────────────────────
  { pf: [0, 1, 2, 3, 4], forte: '5-1' },
  { pf: [0, 1, 3, 5, 7], forte: '5-23' },
  { pf: [0, 2, 3, 5, 7], forte: '5-24' },
  { pf: [0, 2, 4, 7, 9], forte: '5-35', name: 'pentatonic scale' },
  { pf: [0, 2, 4, 6, 8], forte: '5-33', name: 'whole-tone pentachord' },
  { pf: [0, 1, 3, 6, 8], forte: '5-32', name: 'blues scale (5-tone)' },
  // ── Hexachords (6-n) ─────────────────────────────────────────────────
  { pf: [0, 1, 2, 3, 4, 5], forte: '6-1' },
  { pf: [0, 1, 4, 5, 8, 9], forte: '6-20', name: 'hexatonic scale' },
  { pf: [0, 1, 3, 5, 7, 9], forte: '6-32', name: 'major hexachord' },
  { pf: [0, 2, 4, 6, 8, 10], forte: '6-35', name: 'whole-tone scale' },
  // ── Heptachords (7-n) ────────────────────────────────────────────────
  { pf: [0, 1, 2, 3, 4, 5, 6], forte: '7-1' },
  { pf: [0, 2, 4, 5, 7, 9, 11], forte: '7-35', name: 'major / diatonic scale' },
  { pf: [0, 1, 3, 4, 6, 8, 10], forte: '7-33', name: 'altered scale' },
  { pf: [0, 2, 3, 5, 7, 8, 11], forte: '7-32', name: 'harmonic minor scale' },
  { pf: [0, 2, 3, 5, 7, 9, 11], forte: '7-34', name: 'melodic minor scale' },
];

/**
 * Look up the Forte set class for a pitch class set.
 * Returns null if the set is not in the curated table.
 */
export function getSetClassInfo(pcs: number[]): SetClassInfo | null {
  const pf = primeForm(pcs);
  const pfStr = pf.join(',');
  // Normalise table entries on the fly so the table can hold any transposition
  // of each set class, not just the canonical prime form.
  const entry = FORTE_TABLE.find(e => primeForm(e.pf).join(',') === pfStr);
  if (!entry) return null;
  return {
    primeForm: pf,
    forteNumber: entry.forte,
    commonName: entry.name,
  };
}
