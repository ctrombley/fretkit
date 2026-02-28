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
