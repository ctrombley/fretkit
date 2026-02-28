import type Sequence from './Sequence';

/**
 * Compute the optimal starting fret so a voicing is visible on the fretboard.
 * Ignores open strings (fret 0) since they're always visible.
 *
 * When `fretCount` is provided and the voicing contains open strings, the
 * function checks whether the entire voicing fits in the window starting from
 * fret 1. If it does, it returns 1 so the natural gap between open strings
 * and higher fretted notes is preserved.
 *
 * @param sequence  - The voicing / sequence to inspect
 * @param padding   - Extra frets of margin below the lowest fretted note (default 1)
 * @param fretCount - Visible fret window size (optional)
 * @returns A starting fret >= 1
 */
export function optimalStartingFret(
  sequence: Sequence,
  padding = 1,
  fretCount?: number,
): number {
  const frettedNotes = sequence.stringNotes.filter(sn => sn.fret > 0);
  if (frettedNotes.length === 0) return 1;

  const minFret = Math.min(...frettedNotes.map(sn => sn.fret));
  const maxFret = Math.max(...frettedNotes.map(sn => sn.fret));
  const hasOpenStrings = sequence.stringNotes.some(sn => sn.fret === 0);

  // If there are open strings and the whole voicing fits from fret 1, keep the
  // natural spacing so the gap between the nut and the first fretted note shows.
  if (hasOpenStrings && fretCount !== undefined && maxFret <= fretCount) {
    return 1;
  }

  return Math.max(1, minFret - padding);
}
