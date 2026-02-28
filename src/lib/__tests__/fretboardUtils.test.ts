import { describe, it, expect } from 'vitest';
import { optimalStartingFret } from '../fretboardUtils';
import Sequence from '../Sequence';
import StringNote from '../StringNote';
import Note from '../Note';

function makeSequence(frets: number[]): Sequence {
  return new Sequence(
    frets.map((fret, i) => new StringNote(i, new Note('E'), fret)),
  );
}

describe('optimalStartingFret', () => {
  it('returns 1 for an all-open voicing', () => {
    const seq = makeSequence([0, 0, 0, 0, 0, 0]);
    expect(optimalStartingFret(seq)).toBe(1);
  });

  it('returns minFret - padding for a fretted voicing', () => {
    // fretted notes at frets 3, 5, 7 → min=3, default padding=1 → 2
    const seq = makeSequence([0, 3, 5, 7, 0, 0]);
    expect(optimalStartingFret(seq)).toBe(2);
  });

  it('clamps to 1 when fret 1 is the lowest', () => {
    const seq = makeSequence([1, 0, 2, 3, 0, 0]);
    // minFret=1, 1-1=0 → clamped to 1
    expect(optimalStartingFret(seq)).toBe(1);
  });

  it('respects custom padding', () => {
    const seq = makeSequence([0, 5, 7, 9, 0, 0]);
    // minFret=5, padding=2 → 3
    expect(optimalStartingFret(seq, 2)).toBe(3);
  });

  it('works with padding=0', () => {
    const seq = makeSequence([0, 5, 7, 0, 0, 0]);
    // minFret=5, padding=0 → 5
    expect(optimalStartingFret(seq, 0)).toBe(5);
  });
});
