import { describe, it, expect } from 'vitest';
import generate from '../sequenceGenerator';
import Note from '../Note';
import Chord from '../Chord';

function makeStrings(tuning: string[], fretCount: number): Note[][] {
  return tuning.map(noteStr => {
    const open = new Note(noteStr);
    const notes: Note[] = [];
    for (let i = 1; i < fretCount; i++) {
      notes.push(new Note(open.semitones + i));
    }
    return notes;
  });
}

describe('sequenceGenerator', () => {
  const tuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
  const fretCount = 12;

  it('returns sequences for a C major chord', () => {
    const chord = new Chord('C M');
    const strings = makeStrings(tuning, fretCount);
    const sequences = generate(chord.notes, strings, 1);
    expect(sequences.length).toBeGreaterThan(0);
  });

  it('sequences contain valid string notes', () => {
    const chord = new Chord('C M');
    const strings = makeStrings(tuning, fretCount);
    const sequences = generate(chord.notes, strings, 1);

    for (const seq of sequences) {
      for (const sn of seq.stringNotes) {
        expect(sn.string).toBeGreaterThanOrEqual(0);
        expect(sn.string).toBeLessThan(tuning.length);
        expect(sn.fret).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('returns empty array for empty notes', () => {
    const strings = makeStrings(tuning, fretCount);
    const sequences = generate([], strings, 1);
    expect(sequences).toEqual([]);
  });

  it('sequences are sorted by fret delta', () => {
    const chord = new Chord('G M');
    const strings = makeStrings(tuning, fretCount);
    const sequences = generate(chord.notes, strings, 1);

    for (let i = 1; i < sequences.length; i++) {
      expect(sequences[i]!.fretDelta).toBeGreaterThanOrEqual(sequences[i - 1]!.fretDelta);
    }
  });
});
