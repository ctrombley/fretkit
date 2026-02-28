/**
 * Just intonation consonance and beat frequency analysis.
 *
 * Inspired by astrokit's CelestialBody.synodicPeriodWith(), which computes
 * the beat frequency between two orbital periods:
 *   1/P_syn = |1/P1 − 1/P2|
 *
 * In acoustics the direct parallel is simpler: two notes beat at |f1 − f2| Hz.
 * More fundamentally, consonance arises when frequency ratios are simple
 * integers — the same reason harmonic n of a string produces a recognisable
 * pitch (n:1 ratio). We measure this via Euler's gradus suavitatis ("degree
 * of softness"), which assigns lower scores to simpler ratios.
 */

// ── Just intonation reference ratios ─────────────────────────────────────
// 5-limit just intonation for each interval class 0–12.

const JUST_RATIOS: ReadonlyArray<readonly [number, number]> = [
  [1,  1],   //  0: unison
  [16, 15],  //  1: minor 2nd (diatonic semitone)
  [9,  8],   //  2: major 2nd (Pythagorean whole tone)
  [6,  5],   //  3: minor 3rd
  [5,  4],   //  4: major 3rd
  [4,  3],   //  5: perfect 4th
  [7,  5],   //  6: tritone (septimal — 7-limit)
  [3,  2],   //  7: perfect 5th
  [8,  5],   //  8: minor 6th
  [5,  3],   //  9: major 6th
  [7,  4],   // 10: harmonic 7th (septimal minor 7th)
  [15, 8],   // 11: major 7th
  [2,  1],   // 12: octave
];

// ── Internal utilities ────────────────────────────────────────────────────

function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let m = Math.abs(Math.round(n));
  for (let d = 2; d * d <= m; d++) {
    while (m % d === 0) { factors.push(d); m /= d; }
  }
  if (m > 1) factors.push(m);
  return factors;
}

/**
 * Euler's gradus suavitatis for integer n:
 *   g(n) = 1 + Σ (p_i − 1) over all prime factors p_i (with repetition).
 * Smaller = simpler = more consonant.
 */
function gradus(n: number): number {
  return primeFactors(n).reduce((s, p) => s + (p - 1), 1);
}

// ── Public API ────────────────────────────────────────────────────────────

export interface JustRatioInfo {
  /** Simplest just-intonation ratio for this interval. */
  ratio: readonly [number, number];
  /** Cents of the just interval. */
  justCents: number;
  /** Cents of the equal-tempered interval. */
  etCents: number;
  /** ET − just (positive = ET is sharp). */
  errorCents: number;
}

/**
 * Just intonation ratio, ET cents, and deviation for a given interval in semitones.
 */
export function justRatioInfo(semitones: number): JustRatioInfo {
  const i = ((Math.round(semitones) % 12) + 12) % 12;
  const ratio = JUST_RATIOS[i]!;
  const justCents = 1200 * Math.log2(ratio[0] / ratio[1]);
  const etCents = i * 100;
  return { ratio, justCents, etCents, errorCents: etCents - justCents };
}

/**
 * Consonance rating for an interval in semitones (0 = most dissonant, 1 = unison/octave).
 *
 * Derived from Euler's gradus suavitatis: consonance = 1 / g(p·q) where the
 * just ratio is p/q. Simpler ratios → lower gradus → higher consonance.
 */
export function intervalConsonance(semitones: number): number {
  const i = ((Math.round(semitones) % 12) + 12) % 12;
  const ratio = JUST_RATIOS[i]!;
  const g = gradus(ratio[0]) + gradus(ratio[1]) - 1; // combined gradus for p/q
  return 1 / g;
}

/**
 * Beat frequency in Hz between two pitches.
 * Beats are the amplitude modulation at |f1 − f2| Hz when two tones are
 * heard simultaneously. Below ~15 Hz perceived as pulsing; above ~40 Hz
 * perceived as roughness or a separate difference tone.
 *
 * Direct analogue of astrokit's synodicPeriodWith():
 *   beats/sec = |f1 − f2|  vs  |1/P1 − 1/P2| orbital beats/day
 */
export function beatFrequency(hz1: number, hz2: number): number {
  return Math.abs(hz1 - hz2);
}

/**
 * Beat frequency between an ET interval and its just-intonation target.
 *
 * E.g., a perfect fifth starting at A4 (220 Hz):
 *   ET fifth: 220 × 2^(7/12) ≈ 329.63 Hz
 *   Just fifth: 220 × 3/2 = 330.00 Hz
 *   Beat frequency ≈ 0.37 Hz (very slow — nearly pure)
 *
 * A major third starting at A4:
 *   ET third: 220 × 2^(4/12) ≈ 277.18 Hz
 *   Just third: 220 × 5/4 = 275.00 Hz
 *   Beat frequency ≈ 2.18 Hz (noticeable beating)
 */
export function justIntonationBeat(fundamentalHz: number, semitones: number): number {
  const i = ((Math.round(semitones) % 12) + 12) % 12;
  const etFreq   = fundamentalHz * Math.pow(2, i / 12);
  const ratio    = JUST_RATIOS[i]!;
  const justFreq = fundamentalHz * (ratio[0] / ratio[1]);
  return Math.abs(etFreq - justFreq);
}

/**
 * Overall consonance of a pitch class set (0–1).
 * Computes the average intervalConsonance across all unordered pairs.
 */
export function setConsonance(pcs: number[]): number {
  const unique = [...new Set(pcs.map(p => ((p % 12) + 12) % 12))];
  if (unique.length <= 1) return 1;
  let total = 0, count = 0;
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const diff = Math.abs(unique[i]! - unique[j]!);
      const ic = diff > 6 ? 12 - diff : diff;
      total += intervalConsonance(ic);
      count++;
    }
  }
  return count === 0 ? 1 : total / count;
}

/** Descriptive names for just ratios by semitone. */
export const JUST_INTERVAL_NAMES: Readonly<Record<number, string>> = {
  0:  'Unison (1:1)',
  1:  'Minor 2nd (16:15)',
  2:  'Major 2nd (9:8)',
  3:  'Minor 3rd (6:5)',
  4:  'Major 3rd (5:4)',
  5:  'Perfect 4th (4:3)',
  6:  'Tritone (7:5)',
  7:  'Perfect 5th (3:2)',
  8:  'Minor 6th (8:5)',
  9:  'Major 6th (5:3)',
  10: 'Harmonic 7th (7:4)',
  11: 'Major 7th (15:8)',
  12: 'Octave (2:1)',
};
