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

  describe('with fretCount (open-string breathing room)', () => {
    it('starts at 1 when open strings present and voicing fits in window', () => {
      // open + frets 3,4 → maxFret=4, fretCount=5 → fits from 1
      const seq = makeSequence([0, 3, 4, 0, 0, 0]);
      expect(optimalStartingFret(seq, 1, 5)).toBe(1);
    });

    it('falls back to minFret-padding when voicing does not fit from fret 1', () => {
      // open + frets 5,7 → maxFret=7, fretCount=5 → does NOT fit from 1
      const seq = makeSequence([0, 5, 7, 0, 0, 0]);
      expect(optimalStartingFret(seq, 1, 5)).toBe(4);
    });

    it('does not apply open-string rule when there are no open strings', () => {
      // all fretted at 2,3 → maxFret=3, fretCount=5 → fits, but no open strings
      const seq = makeSequence([2, 3, 2, 3, 2, 3]);
      expect(optimalStartingFret(seq, 1, 5)).toBe(1);
    });

    it('behaves like no-fretCount when fretCount is omitted', () => {
      const seq = makeSequence([0, 3, 4, 0, 0, 0]);
      // without fretCount → minFret(3) - padding(1) = 2
      expect(optimalStartingFret(seq, 1)).toBe(2);
    });
  });
});
