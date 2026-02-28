import { describe, it, expect } from 'vitest';
import Scale from '../Scale';

describe('Scale', () => {
  it('parses C major', () => {
    const scale = new Scale('C major');
    expect(scale.name).toBe('C major');
    expect(scale.type).toBe('Scale');
    expect(scale.notes).toHaveLength(7);
    expect(scale.notes.map(n => n.baseSemitones)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('parses A minor pentatonic', () => {
    const scale = new Scale('A minor pentatonic');
    expect(scale.notes).toHaveLength(5);
    expect(scale.notes.map(n => n.baseSemitones)).toEqual([9, 0, 2, 4, 7]);
  });

  it('parses blues scale', () => {
    const scale = new Scale('E blues');
    expect(scale.notes).toHaveLength(6);
  });

  it('parses chromatic scale', () => {
    const scale = new Scale('C chromatic');
    expect(scale.notes).toHaveLength(12);
  });

  it('parses harmonic minor', () => {
    const scale = new Scale('A harmonic minor');
    expect(scale.notes).toHaveLength(7);
    expect(scale.notes.map(n => n.baseSemitones)).toEqual([9, 11, 0, 2, 4, 5, 8]);
  });

  it('throws on invalid scale', () => {
    expect(() => new Scale('C invalid')).toThrow('Invalid scale string');
  });

  it('creates empty scale with no input', () => {
    const scale = new Scale();
    expect(scale.notes).toEqual([]);
  });
});
