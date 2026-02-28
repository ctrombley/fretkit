import { describe, it, expect } from 'vitest';
import Chord from '../Chord';

describe('Chord', () => {
  describe('major chord', () => {
    it('parses C major', () => {
      const chord = new Chord('C M');
      expect(chord.name).toBe('C M');
      expect(chord.type).toBe('Chord');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 7]);
    });

    it('parses with alias "maj"', () => {
      const chord = new Chord('C maj');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 7]);
    });

    it('parses G major', () => {
      const chord = new Chord('G M');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([7, 11, 2]);
    });
  });

  describe('minor chord', () => {
    it('parses A minor', () => {
      const chord = new Chord('A m');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([9, 0, 4]);
    });

    it('parses with alias "min"', () => {
      const chord = new Chord('A min');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([9, 0, 4]);
    });
  });

  describe('seventh chords', () => {
    it('parses dominant 7th', () => {
      const chord = new Chord('C 7');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 7, 10]);
    });

    it('parses major 7th', () => {
      const chord = new Chord('C M7');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 7, 11]);
    });

    it('parses minor 7th', () => {
      const chord = new Chord('C m7');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 7, 10]);
    });

    it('parses diminished 7th', () => {
      const chord = new Chord('C °7');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 6, 9]);
    });

    it('parses half-diminished 7th', () => {
      const chord = new Chord('C ø7');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 6, 10]);
    });
  });

  describe('diminished triad', () => {
    it('parses C diminished', () => {
      const chord = new Chord('C °');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 6]);
    });

    it('parses with alias "dim"', () => {
      const chord = new Chord('C dim');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 6]);
    });

    it('parses B diminished', () => {
      const chord = new Chord('B °');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([11, 2, 5]);
    });
  });

  describe('augmented triad', () => {
    it('parses C augmented', () => {
      const chord = new Chord('C +');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 8]);
    });

    it('parses with alias "aug"', () => {
      const chord = new Chord('C aug');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 8]);
    });
  });

  describe('sixth chords', () => {
    it('parses major 6th', () => {
      const chord = new Chord('C 6');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 4, 7, 9]);
    });

    it('parses minor 6th', () => {
      const chord = new Chord('C m6');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([0, 3, 7, 9]);
    });
  });

  describe('sharp/flat roots', () => {
    it('parses F# major', () => {
      const chord = new Chord('F# M');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([6, 10, 1]);
    });

    it('parses Bb minor', () => {
      const chord = new Chord('Bb m');
      expect(chord.notes.map(n => n.baseSemitones)).toEqual([10, 1, 5]);
    });
  });

  describe('inversions', () => {
    it('returns maxInversions = notes.length - 1', () => {
      const triad = new Chord('C M');
      expect(triad.maxInversions).toBe(2);
      const seventh = new Chord('C 7');
      expect(seventh.maxInversions).toBe(3);
    });

    it('returns 0 maxInversions for empty chord', () => {
      const chord = new Chord();
      expect(chord.maxInversions).toBe(0);
    });

    it('invert(0) returns original notes', () => {
      const chord = new Chord('C M');
      const inverted = chord.invert(0);
      expect(inverted.map(n => n.baseSemitones)).toEqual([0, 4, 7]);
    });

    it('invert(1) moves root up an octave (1st inversion)', () => {
      const chord = new Chord('C M');
      const inverted = chord.invert(1);
      // E(4), G(7), C(12 = 0 base)
      expect(inverted.map(n => n.baseSemitones)).toEqual([4, 7, 0]);
      // The moved note should have semitones >= 12
      expect(inverted[2]!.semitones).toBe(12);
    });

    it('invert(2) produces 2nd inversion', () => {
      const chord = new Chord('C M');
      const inverted = chord.invert(2);
      // G(7), C(12), E(16)
      expect(inverted.map(n => n.baseSemitones)).toEqual([7, 0, 4]);
    });

    it('clamps inversion to maxInversions', () => {
      const chord = new Chord('C M');
      const inverted = chord.invert(10);
      // Same as invert(2) for a triad
      expect(inverted.map(n => n.baseSemitones)).toEqual([7, 0, 4]);
    });

    it('invert with negative returns original notes', () => {
      const chord = new Chord('C M');
      const inverted = chord.invert(-1);
      expect(inverted.map(n => n.baseSemitones)).toEqual([0, 4, 7]);
    });
  });

  describe('error handling', () => {
    it('throws on invalid chord', () => {
      expect(() => new Chord('X invalid')).toThrow('Invalid chord string');
    });

    it('creates empty chord with no input', () => {
      const chord = new Chord();
      expect(chord.notes).toEqual([]);
    });
  });
});
