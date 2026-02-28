import { describe, it, expect } from 'vitest';
import { parseList } from '../tones';

describe('parseList', () => {
  it('parses space-separated notes', () => {
    const result = parseList('C D E');
    expect(result).toHaveLength(3);
    expect(result[0]!.baseSemitones).toBe(0);
    expect(result[1]!.baseSemitones).toBe(2);
    expect(result[2]!.baseSemitones).toBe(4);
  });

  it('filters invalid notes', () => {
    const result = parseList('C invalid E');
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(parseList('')).toEqual([]);
  });

  it('handles array input', () => {
    const result = parseList(['C', 'D', 'E']);
    expect(result).toHaveLength(3);
  });
});
