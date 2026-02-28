import { describe, it, expect } from 'vitest';
import Mode from '../Mode';

describe('Mode', () => {
  it('parses C ionian', () => {
    const mode = new Mode('C ionian');
    expect(mode.name).toBe('C ionian');
    expect(mode.type).toBe('Mode');
    expect(mode.notes).toHaveLength(7);
    expect(mode.notes.map(n => n.baseSemitones)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('parses D dorian', () => {
    const mode = new Mode('D dorian');
    expect(mode.notes.map(n => n.baseSemitones)).toEqual([2, 4, 5, 7, 9, 11, 0]);
  });

  it('parses A aeolian', () => {
    const mode = new Mode('A aeolian');
    expect(mode.notes.map(n => n.baseSemitones)).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });

  it('parses all seven modes', () => {
    const modeNames = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
    for (const name of modeNames) {
      const mode = new Mode(`C ${name}`);
      expect(mode.notes).toHaveLength(7);
    }
  });

  it('throws on invalid mode', () => {
    expect(() => new Mode('C invalid')).toThrow('Invalid mode string');
  });

  it('creates empty mode with no input', () => {
    const mode = new Mode();
    expect(mode.notes).toEqual([]);
  });
});
