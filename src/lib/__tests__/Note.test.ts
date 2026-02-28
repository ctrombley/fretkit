import { describe, it, expect } from 'vitest';
import Note from '../Note';

describe('Note', () => {
  describe('constructor', () => {
    it('creates a note from a string', () => {
      const note = new Note('C4');
      expect(note.semitones).toBe(48);
    });

    it('creates a note from a number', () => {
      const note = new Note(60);
      expect(note.semitones).toBe(60);
    });

    it('creates a note from another Note', () => {
      const original = new Note('A4');
      const copy = new Note(original);
      expect(copy.semitones).toBe(original.semitones);
    });

    it('defaults to 0 semitones with no input', () => {
      const note = new Note();
      expect(note.semitones).toBe(0);
    });

    it('throws on invalid note string', () => {
      expect(() => new Note('X')).toThrow('Invalid note string');
    });
  });

  describe('parseBaseNote', () => {
    it('parses natural notes', () => {
      expect(Note.parseBaseNote('C')).toBe(0);
      expect(Note.parseBaseNote('D')).toBe(2);
      expect(Note.parseBaseNote('E')).toBe(4);
      expect(Note.parseBaseNote('F')).toBe(5);
      expect(Note.parseBaseNote('G')).toBe(7);
      expect(Note.parseBaseNote('A')).toBe(9);
      expect(Note.parseBaseNote('B')).toBe(11);
    });

    it('parses sharps', () => {
      expect(Note.parseBaseNote('C', '#')).toBe(1);
      expect(Note.parseBaseNote('C', '♯')).toBe(1);
    });

    it('parses flats', () => {
      expect(Note.parseBaseNote('D', 'b')).toBe(1);
      expect(Note.parseBaseNote('D', '♭')).toBe(1);
    });

    it('parses double sharps', () => {
      expect(Note.parseBaseNote('C', '𝄪')).toBe(2);
    });

    it('parses double flats', () => {
      expect(Note.parseBaseNote('D', '𝄫')).toBe(0);
    });

    it('wraps around correctly', () => {
      expect(Note.parseBaseNote('C', 'b')).toBe(11); // Cb = B
    });
  });

  describe('baseSemitones', () => {
    it('returns semitones mod 12', () => {
      const note = new Note('C4');
      expect(note.baseSemitones).toBe(0);
    });

    it('returns correct base for A4', () => {
      const note = new Note('A4');
      expect(note.baseSemitones).toBe(9);
    });
  });

  describe('frequency', () => {
    it('returns 440 for A4', () => {
      const note = new Note('A4');
      expect(Math.round(note.frequency)).toBe(440);
    });
  });

  describe('add', () => {
    it('adds a number of semitones', () => {
      const note = new Note('C4');
      const result = note.add(7);
      expect(result.semitones).toBe(55); // G4
    });

    it('adds an interval string', () => {
      const note = new Note('C4');
      const result = note.add('P5');
      expect(result.semitones).toBe(55);
    });

    it('adds another Note', () => {
      const c = new Note('C4');
      const interval = new Note(7);
      expect(c.add(interval).semitones).toBe(55);
    });
  });

  describe('subtract', () => {
    it('subtracts semitones', () => {
      const note = new Note('G4');
      const result = note.subtract(7);
      expect(result.semitones).toBe(48); // C4
    });
  });

  describe('octave notes', () => {
    it('C0 is 0 semitones', () => {
      expect(new Note('C0').semitones).toBe(0);
    });

    it('C1 is 12 semitones', () => {
      expect(new Note('C1').semitones).toBe(12);
    });

    it('E2 is 28 semitones', () => {
      expect(new Note('E2').semitones).toBe(28);
    });
  });
});
