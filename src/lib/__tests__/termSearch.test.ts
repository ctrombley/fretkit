import { describe, it, expect } from 'vitest';
import search from '../termSearch';

describe('termSearch', () => {
  it('finds a chord', () => {
    const result = search('C M');
    expect(result.current?.type).toBe('Chord');
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it('finds a mode', () => {
    const result = search('C ionian');
    expect(result.current?.type).toBe('Mode');
    expect(result.notes).toHaveLength(7);
  });

  it('finds a scale', () => {
    const result = search('C major');
    expect(result.current?.type).toBe('Scale');
    expect(result.notes).toHaveLength(7);
  });

  it('falls back to parsing individual notes', () => {
    const result = search('C D E');
    expect(result.current).toBeUndefined();
    expect(result.notes).toHaveLength(3);
  });

  it('returns empty notes for empty string', () => {
    const result = search('');
    expect(result.notes).toEqual([]);
  });
});
