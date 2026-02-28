import { describe, it, expect } from 'vitest';
import {
  computeVoiceLeading,
  findSmoothestTransition,
  sortByVoiceLeading,
  voiceDirections,
  contraryMotionRatio,
  detectParallels,
} from '../voiceLeading';
import Sequence from '../Sequence';
import StringNote from '../StringNote';
import Note from '../Note';

function makeSequence(entries: [string: number, semitones: number, fret: number][]): Sequence {
  const stringNotes = entries.map(
    ([s, semi, fret]) => new StringNote(s, new Note(semi), fret)
  );
  return new Sequence(stringNotes);
}

describe('computeVoiceLeading', () => {
  it('same voicing = distance 0', () => {
    const seq = makeSequence([
      [0, 40, 0], [1, 45, 0], [2, 50, 0],
    ]);
    const result = computeVoiceLeading(seq, seq, 6);
    expect(result.totalDistance).toBe(0);
    expect(result.commonStrings).toBe(3);
  });

  it('one-fret shift on all strings gives predictable distance', () => {
    const a = makeSequence([
      [0, 40, 0], [1, 45, 0], [2, 50, 0],
    ]);
    const b = makeSequence([
      [0, 41, 1], [1, 46, 1], [2, 51, 1],
    ]);
    const result = computeVoiceLeading(a, b, 6);
    expect(result.totalDistance).toBe(3); // 1 + 1 + 1
    expect(result.commonStrings).toBe(3);
  });

  it('handles muted vs sounded strings', () => {
    const a = makeSequence([[0, 40, 0], [1, 45, 0]]);
    const b = makeSequence([[0, 40, 0], [2, 50, 0]]); // string 1 missing, string 2 added
    const result = computeVoiceLeading(a, b, 6);
    expect(result.perString[0]).toBe(0);
    expect(result.perString[1]).toBeNull();
    expect(result.perString[2]).toBeNull();
    expect(result.commonStrings).toBe(1);
  });

  it('per-string distances are correct', () => {
    const a = makeSequence([[0, 40, 0], [1, 45, 0], [2, 50, 0]]);
    const b = makeSequence([[0, 42, 2], [1, 45, 0], [2, 53, 3]]);
    const result = computeVoiceLeading(a, b, 6);
    expect(result.perString[0]).toBe(2);
    expect(result.perString[1]).toBe(0);
    expect(result.perString[2]).toBe(3);
  });
});

describe('findSmoothestTransition', () => {
  it('returns null for empty candidates', () => {
    const from = makeSequence([[0, 40, 0]]);
    expect(findSmoothestTransition(from, [], 6)).toBeNull();
  });

  it('finds the closest voicing', () => {
    const from = makeSequence([[0, 40, 0], [1, 45, 0]]);
    const close = makeSequence([[0, 41, 1], [1, 46, 1]]);  // distance = 2
    const far = makeSequence([[0, 45, 5], [1, 50, 5]]);    // distance = 10
    const result = findSmoothestTransition(from, [far, close], 6);
    expect(result).toBe(close);
  });
});

describe('sortByVoiceLeading', () => {
  it('sorts candidates by distance (smoothest first)', () => {
    const from = makeSequence([[0, 40, 0], [1, 45, 0]]);
    const a = makeSequence([[0, 41, 1], [1, 46, 1]]); // distance = 2
    const b = makeSequence([[0, 43, 3], [1, 48, 3]]); // distance = 6
    const c = makeSequence([[0, 42, 2], [1, 47, 2]]); // distance = 4

    const sorted = sortByVoiceLeading(from, [b, a, c], 6);
    expect(sorted[0]).toBe(a);
    expect(sorted[1]).toBe(c);
    expect(sorted[2]).toBe(b);
  });

  it('does not mutate the original array', () => {
    const from = makeSequence([[0, 40, 0]]);
    const candidates = [
      makeSequence([[0, 45, 5]]),
      makeSequence([[0, 41, 1]]),
    ];
    const original = [...candidates];
    sortByVoiceLeading(from, candidates, 6);
    expect(candidates[0]).toBe(original[0]);
    expect(candidates[1]).toBe(original[1]);
  });
});

describe('voiceDirections', () => {
  it('returns "up" when voice moves to higher semitone', () => {
    const from = makeSequence([[0, 40, 0]]);
    const to   = makeSequence([[0, 42, 2]]);
    expect(voiceDirections(from, to, 2)[0]).toBe('up');
  });

  it('returns "down" when voice moves to lower semitone', () => {
    const from = makeSequence([[0, 42, 2]]);
    const to   = makeSequence([[0, 40, 0]]);
    expect(voiceDirections(from, to, 2)[0]).toBe('down');
  });

  it('returns "same" when voice does not move', () => {
    const seq = makeSequence([[0, 40, 0]]);
    expect(voiceDirections(seq, seq, 2)[0]).toBe('same');
  });

  it('returns null for strings absent in either voicing', () => {
    const from = makeSequence([[0, 40, 0]]);
    const to   = makeSequence([[1, 45, 0]]); // different string
    const dirs = voiceDirections(from, to, 3);
    expect(dirs[0]).toBeNull(); // string 0 absent in `to`
    expect(dirs[1]).toBeNull(); // string 1 absent in `from`
  });
});

describe('contraryMotionRatio', () => {
  it('all voices moving same direction → ratio 0', () => {
    const from = makeSequence([[0, 40, 0], [1, 45, 0]]);
    const to   = makeSequence([[0, 42, 2], [1, 47, 2]]); // both up
    expect(contraryMotionRatio(from, to, 3)).toBe(0);
  });

  it('two voices in opposite directions → ratio 1', () => {
    const from = makeSequence([[0, 40, 0], [1, 45, 0]]);
    const to   = makeSequence([[0, 42, 2], [1, 43, 0]]); // s0 up, s1 down
    expect(contraryMotionRatio(from, to, 3)).toBe(1);
  });

  it('fewer than 2 moving voices → ratio 0', () => {
    const from = makeSequence([[0, 40, 0]]);
    const to   = makeSequence([[0, 40, 0]]);
    expect(contraryMotionRatio(from, to, 2)).toBe(0);
  });
});

describe('detectParallels', () => {
  it('parallel fifths detected on adjacent strings', () => {
    // String 0: E(4) → A(9)  +5 semitones
    // String 1: B(11) → E(4) +5 semitones (mod 12)  — same direction, same interval
    // String 0: 40→47 (+7), String 1: 47→54 (+7), same direction, P5 before and after
    const from2 = makeSequence([[0, 40, 0], [1, 47, 7]]);
    const to2   = makeSequence([[0, 47, 7], [1, 54, 14]]);
    const parallels = detectParallels(from2, to2, 3);
    expect(parallels.some(p => p.type === 'fifth')).toBe(true);
  });

  it('no parallels when voicings are static', () => {
    const seq = makeSequence([[0, 40, 0], [1, 47, 7]]);
    expect(detectParallels(seq, seq, 3)).toHaveLength(0);
  });

  it('contrary motion does not trigger parallel detection', () => {
    // String 0 goes up, string 1 goes down: contrary motion, no parallels
    const from = makeSequence([[0, 40, 0], [1, 47, 7]]);
    const to   = makeSequence([[0, 47, 7], [1, 40, 0]]);
    // Interval after: 40-47 = -7 mod 12 = 5 → not same as before (7)
    // Different interval, no parallel
    expect(detectParallels(from, to, 3)).toHaveLength(0);
  });
});
