import type Sequence from './Sequence';

/**
 * Compute the optimal starting fret so a voicing is visible on the fretboard.
 * Ignores open strings (fret 0) since they're always visible.
 *
 * @param sequence - The voicing / sequence to inspect
 * @param padding  - Extra frets of margin below the lowest fretted note (default 1)
 * @returns A starting fret >= 1
 */
export function optimalStartingFret(sequence: Sequence, padding = 1): number {
  const frettedNotes = sequence.stringNotes.filter(sn => sn.fret > 0);
  if (frettedNotes.length === 0) return 1;
  const minFret = Math.min(...frettedNotes.map(sn => sn.fret));
  return Math.max(1, minFret - padding);
}
