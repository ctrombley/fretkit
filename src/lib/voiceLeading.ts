/**
 * Voice leading distance: measures how far fingers move
 * between two voicings on the same instrument.
 */

import type Sequence from './Sequence';

export interface VoiceLeadingResult {
  totalDistance: number;
  perString: (number | null)[];  // null if either voicing has no note on that string
  commonStrings: number;
}

/**
 * Compute per-string semitone distance between two voicings.
 */
export function computeVoiceLeading(
  a: Sequence,
  b: Sequence,
  stringCount: number,
): VoiceLeadingResult {
  const aByString = new Map<number, number>();
  for (const sn of a.stringNotes) {
    aByString.set(sn.string, sn.semitones);
  }

  const bByString = new Map<number, number>();
  for (const sn of b.stringNotes) {
    bByString.set(sn.string, sn.semitones);
  }

  const perString: (number | null)[] = [];
  let totalDistance = 0;
  let commonStrings = 0;

  for (let s = 0; s < stringCount; s++) {
    const aSemi = aByString.get(s);
    const bSemi = bByString.get(s);

    if (aSemi !== undefined && bSemi !== undefined) {
      const dist = Math.abs(aSemi - bSemi);
      perString.push(dist);
      totalDistance += dist;
      commonStrings++;
    } else {
      perString.push(null);
      // Penalty for adding/removing a sounded string
      if (aSemi !== undefined || bSemi !== undefined) {
        totalDistance += 3; // moderate penalty
      }
    }
  }

  return { totalDistance, perString, commonStrings };
}

/**
 * Find the candidate voicing with minimum voice leading distance from the current voicing.
 */
export function findSmoothestTransition(
  from: Sequence,
  candidates: Sequence[],
  stringCount: number,
): Sequence | null {
  if (candidates.length === 0) return null;

  let best = candidates[0]!;
  let bestDist = computeVoiceLeading(from, best, stringCount).totalDistance;

  for (let i = 1; i < candidates.length; i++) {
    const dist = computeVoiceLeading(from, candidates[i]!, stringCount).totalDistance;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidates[i]!;
    }
  }

  return best;
}

/**
 * Sort candidates by voice leading distance from the current voicing (smoothest first).
 */
export function sortByVoiceLeading(
  from: Sequence,
  candidates: Sequence[],
  stringCount: number,
): Sequence[] {
  return [...candidates].sort((a, b) => {
    const distA = computeVoiceLeading(from, a, stringCount).totalDistance;
    const distB = computeVoiceLeading(from, b, stringCount).totalDistance;
    return distA - distB;
  });
}

// ── Voice direction ───────────────────────────────────────────────────────

/**
 * Per-string motion direction from one voicing to another.
 * null = string is absent in at least one voicing.
 *
 * Mirrors astrokit's EclipticPosition.isApplyingTo(), which determines
 * whether angular separation between two bodies is decreasing (applying)
 * or increasing (separating). Here we track whether each voice moves
 * up, down, stays, or disappears between chord changes.
 */
export type VoiceDirection = 'up' | 'down' | 'same' | null;

export function voiceDirections(
  from: Sequence,
  to: Sequence,
  stringCount: number,
): VoiceDirection[] {
  const aByString = new Map<number, number>();
  for (const sn of from.stringNotes) aByString.set(sn.string, sn.semitones);

  const bByString = new Map<number, number>();
  for (const sn of to.stringNotes) bByString.set(sn.string, sn.semitones);

  return Array.from({ length: stringCount }, (_, s) => {
    const a = aByString.get(s);
    const b = bByString.get(s);
    if (a === undefined || b === undefined) return null;
    if (b > a) return 'up';
    if (b < a) return 'down';
    return 'same';
  });
}

/**
 * Fraction of moving voices that move in contrary motion (0–1).
 * 1.0 = all voices move in strictly contrary pairs; 0 = all parallel or oblique.
 */
export function contraryMotionRatio(
  from: Sequence,
  to: Sequence,
  stringCount: number,
): number {
  const dirs = voiceDirections(from, to, stringCount).filter(
    d => d !== null && d !== 'same',
  ) as Array<'up' | 'down'>;

  if (dirs.length < 2) return 0;
  const ups   = dirs.filter(d => d === 'up').length;
  const downs = dirs.filter(d => d === 'down').length;
  return (Math.min(ups, downs) * 2) / dirs.length;
}

// ── Parallel motion detection ─────────────────────────────────────────────

export interface ParallelMotion {
  /** Interval class being paralleled. */
  type: 'unison' | 'fourth' | 'fifth' | 'octave';
  /** Pair of string indices exhibiting the parallel motion. */
  strings: [number, number];
}

/**
 * Detect parallel perfect intervals between adjacent string pairs.
 *
 * Parallel fifths and octaves are the classic voice-leading violations in
 * Western counterpoint. On guitar, they're very common in power chords but
 * noteworthy when they appear in otherwise independent voice movement.
 *
 * Checks every adjacent string pair: if both voices move in the same
 * direction AND the perfect interval (P1, P4, P5, or P8) is preserved,
 * the motion is reported.
 */
export function detectParallels(
  from: Sequence,
  to: Sequence,
  stringCount: number,
): ParallelMotion[] {
  const aMap = new Map<number, number>();
  for (const sn of from.stringNotes) aMap.set(sn.string, sn.semitones);

  const bMap = new Map<number, number>();
  for (const sn of to.stringNotes) bMap.set(sn.string, sn.semitones);

  const parallels: ParallelMotion[] = [];

  for (let s = 0; s < stringCount - 1; s++) {
    const a1 = aMap.get(s);
    const a2 = aMap.get(s + 1);
    const b1 = bMap.get(s);
    const b2 = bMap.get(s + 1);

    if (a1 === undefined || a2 === undefined || b1 === undefined || b2 === undefined) continue;

    // Both voices must actually move.
    if (b1 === a1 && b2 === a2) continue;

    // Compute intervals before and after (mod 12 to ignore octave displacement).
    const ivBefore = ((a2 - a1) % 12 + 12) % 12;
    const ivAfter  = ((b2 - b1) % 12 + 12) % 12;

    if (ivBefore !== ivAfter) continue;

    // Use the raw directed interval (0–11), not the interval class, so that
    // a perfect fifth (7 semitones) and a perfect fourth (5 semitones) are
    // distinguished — they share interval class 5 but are different intervals.
    if (ivBefore === 0) parallels.push({ type: 'unison', strings: [s, s + 1] });
    else if (ivBefore === 5) parallels.push({ type: 'fourth', strings: [s, s + 1] });
    else if (ivBefore === 7) parallels.push({ type: 'fifth',  strings: [s, s + 1] });
  }

  // Parallel octaves: voices land an octave apart and both moved in the same direction.
  for (let s = 0; s < stringCount - 1; s++) {
    const a1 = aMap.get(s);
    const a2 = aMap.get(s + 1);
    const b1 = bMap.get(s);
    const b2 = bMap.get(s + 1);

    if (a1 === undefined || a2 === undefined || b1 === undefined || b2 === undefined) continue;
    if (b1 === a1 && b2 === a2) continue;

    const ivAfter = ((b2 - b1) % 12 + 12) % 12;
    const dir1 = b1 - a1;
    const dir2 = b2 - a2;

    if (ivAfter === 0 && dir1 !== 0 && dir2 !== 0 && Math.sign(dir1) === Math.sign(dir2)) {
      // Avoid double-reporting with the unison case above.
      const ivBefore = ((a2 - a1) % 12 + 12) % 12;
      if (ivBefore !== 0) {
        parallels.push({ type: 'octave', strings: [s, s + 1] });
      }
    }
  }

  return parallels;
}
