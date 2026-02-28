import { describe, it, expect } from 'vitest';
import Interval from '../Interval';

describe('Interval', () => {
  describe('constructor', () => {
    it('creates from string', () => {
      const interval = new Interval('P5');
      expect(interval.semitones).toBe(7);
    });

    it('creates from number', () => {
      const interval = new Interval(7);
      expect(interval.semitones).toBe(7);
    });

    it('creates from another Interval', () => {
      const original = new Interval('P5');
      const copy = new Interval(original);
      expect(copy.semitones).toBe(7);
    });

    it('defaults to 0', () => {
      const interval = new Interval();
      expect(interval.semitones).toBe(0);
    });

    it('throws on invalid string', () => {
      expect(() => new Interval('X')).toThrow('Invalid interval string');
    });
  });

  describe('interval values', () => {
    it('unison is 0', () => {
      expect(new Interval('P1').semitones).toBe(0);
    });

    it('minor 2nd is 1', () => {
      expect(new Interval('m2').semitones).toBe(1);
    });

    it('major 2nd is 2', () => {
      expect(new Interval('M2').semitones).toBe(2);
    });

    it('minor 3rd is 3', () => {
      expect(new Interval('m3').semitones).toBe(3);
    });

    it('major 3rd is 4', () => {
      expect(new Interval('M3').semitones).toBe(4);
    });

    it('perfect 4th is 5', () => {
      expect(new Interval('P4').semitones).toBe(5);
    });

    it('diminished 5th is 6', () => {
      expect(new Interval('d5').semitones).toBe(6);
    });

    it('perfect 5th is 7', () => {
      expect(new Interval('P5').semitones).toBe(7);
    });

    it('augmented 5th is 8', () => {
      expect(new Interval('A5').semitones).toBe(8);
    });

    it('minor 7th is 10', () => {
      expect(new Interval('m7').semitones).toBe(10);
    });

    it('major 7th is 11', () => {
      expect(new Interval('M7').semitones).toBe(11);
    });

    it('octave is 12', () => {
      expect(new Interval('P8').semitones).toBe(12);
    });
  });

  describe('unicode modifiers', () => {
    it('sharp', () => {
      expect(new Interval('♯5').semitones).toBe(8);
    });

    it('flat', () => {
      expect(new Interval('♭7').semitones).toBe(10);
    });

    it('double flat', () => {
      expect(new Interval('𝄫7').semitones).toBe(9);
    });
  });
});
