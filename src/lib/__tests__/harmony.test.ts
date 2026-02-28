import { describe, it, expect } from 'vitest';
import {
  FIFTHS_ORDER,
  getFifthsIndex,
  usesSharps,
  noteName,
  getRelativeMinor,
  getRelativeMajor,
  getDominantKey,
  getSubdominantKey,
  getDiatonicPitchClasses,
  getDiatonicChords,
} from '../harmony';

describe('harmony', () => {
  describe('FIFTHS_ORDER', () => {
    it('has 12 unique pitch classes', () => {
      expect(new Set(FIFTHS_ORDER).size).toBe(12);
    });

    it('starts with C (0) and progresses by fifths', () => {
      expect(FIFTHS_ORDER[0]).toBe(0);  // C
      expect(FIFTHS_ORDER[1]).toBe(7);  // G
      expect(FIFTHS_ORDER[2]).toBe(2);  // D
    });
  });

  describe('getFifthsIndex', () => {
    it('returns 0 for C', () => {
      expect(getFifthsIndex(0)).toBe(0);
    });

    it('returns 1 for G', () => {
      expect(getFifthsIndex(7)).toBe(1);
    });

    it('returns 11 for F', () => {
      expect(getFifthsIndex(5)).toBe(11);
    });
  });

  describe('usesSharps', () => {
    it('returns true for C through F#', () => {
      expect(usesSharps(0)).toBe(true);   // C
      expect(usesSharps(7)).toBe(true);   // G
      expect(usesSharps(2)).toBe(true);   // D
      expect(usesSharps(6)).toBe(true);   // F#
    });

    it('returns false for Db through F', () => {
      expect(usesSharps(1)).toBe(false);  // Db
      expect(usesSharps(8)).toBe(false);  // Ab
      expect(usesSharps(5)).toBe(false);  // F
    });
  });

  describe('noteName', () => {
    it('returns sharp names for sharp keys', () => {
      expect(noteName(0)).toBe('C');
      expect(noteName(7)).toBe('G');
      expect(noteName(6)).toBe('F#');
    });

    it('returns flat names for flat keys', () => {
      expect(noteName(1)).toBe('Db');
      expect(noteName(8)).toBe('Ab');
      expect(noteName(10)).toBe('Bb');
    });

    it('respects preferSharps override', () => {
      expect(noteName(1, true)).toBe('C#');
      expect(noteName(6, false)).toBe('Gb');
    });
  });

  describe('key relationships', () => {
    it('getRelativeMinor returns A for C', () => {
      expect(getRelativeMinor(0)).toBe(9);
    });

    it('getRelativeMajor returns C for A', () => {
      expect(getRelativeMajor(9)).toBe(0);
    });

    it('getDominantKey returns G for C', () => {
      expect(getDominantKey(0)).toBe(7);
    });

    it('getSubdominantKey returns F for C', () => {
      expect(getSubdominantKey(0)).toBe(5);
    });
  });

  describe('getDiatonicPitchClasses', () => {
    it('returns 7 pitch classes for C major', () => {
      const pcs = getDiatonicPitchClasses(0, 'major');
      expect(pcs.size).toBe(7);
      // C D E F G A B = 0 2 4 5 7 9 11
      expect(pcs).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
    });

    it('returns correct pitch classes for A minor', () => {
      const pcs = getDiatonicPitchClasses(9, 'minor');
      // A B C D E F G = 9 11 0 2 4 5 7
      expect(pcs).toEqual(new Set([9, 11, 0, 2, 4, 5, 7]));
    });
  });

  describe('getDiatonicChords', () => {
    it('returns 7 chords for C major', () => {
      const chords = getDiatonicChords(0, 'major');
      expect(chords).toHaveLength(7);
    });

    it('generates correct qualities for C major (M m m M M m °)', () => {
      const chords = getDiatonicChords(0, 'major');
      const qualities = chords.map(c => c.quality);
      expect(qualities).toEqual(['M', 'm', 'm', 'M', 'M', 'm', '°']);
    });

    it('generates correct roman numerals for C major', () => {
      const chords = getDiatonicChords(0, 'major');
      const romans = chords.map(c => c.roman);
      expect(romans).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    });

    it('generates correct chord names for C major', () => {
      const chords = getDiatonicChords(0, 'major');
      expect(chords[0]!.chordName).toBe('C M');
      expect(chords[1]!.chordName).toBe('D m');
      expect(chords[2]!.chordName).toBe('E m');
      expect(chords[3]!.chordName).toBe('F M');
      expect(chords[4]!.chordName).toBe('G M');
      expect(chords[5]!.chordName).toBe('A m');
      expect(chords[6]!.chordName).toBe('B °');
    });

    it('generates correct qualities for A minor (m ° M m m M M)', () => {
      const chords = getDiatonicChords(9, 'minor');
      const qualities = chords.map(c => c.quality);
      expect(qualities).toEqual(['m', '°', 'M', 'm', 'm', 'M', 'M']);
    });

    it('generates correct roman numerals for A minor', () => {
      const chords = getDiatonicChords(9, 'minor');
      const romans = chords.map(c => c.roman);
      expect(romans).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
    });

    it('uses flat names for flat keys', () => {
      const chords = getDiatonicChords(5, 'major'); // F major
      expect(chords[3]!.chordName).toBe('Bb M'); // IV of F
    });
  });
});
