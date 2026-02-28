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
