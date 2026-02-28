import { describe, it, expect } from 'vitest';
import getStrings from '../getStrings';
import Note from '../Note';

describe('getStrings', () => {
  it('returns an array of string arrays', () => {
    const tuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
    const strings = getStrings(5, tuning);
    expect(strings).toHaveLength(6);
    expect(strings[0]).toHaveLength(4);
  });

  it('each note is offset by semitone from the open note', () => {
    const tuning = ['E2'];
    const strings = getStrings(4, tuning);
    const openE = new Note('E2');
    expect(strings[0]![0]!.semitones).toBe(openE.semitones + 1);
    expect(strings[0]![1]!.semitones).toBe(openE.semitones + 2);
    expect(strings[0]![2]!.semitones).toBe(openE.semitones + 3);
  });

  it('handles single fret count', () => {
    const strings = getStrings(1, ['A2']);
    expect(strings[0]).toHaveLength(0);
  });
});
