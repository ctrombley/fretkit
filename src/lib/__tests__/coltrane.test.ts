import { describe, it, expect } from 'vitest';
import { getAxisGroups, getIntervalClass, getCadences } from '../coltrane';

describe('getAxisGroups', () => {
  it('major thirds from C: 4 groups of 3', () => {
    const groups = getAxisGroups(0, 3);
    expect(groups).toEqual([
      [0, 4, 8],
      [1, 5, 9],
      [2, 6, 10],
      [3, 7, 11],
    ]);
  });

  it('minor thirds from C: 3 groups of 4', () => {
    const groups = getAxisGroups(0, 4);
    expect(groups).toEqual([
      [0, 3, 6, 9],
      [1, 4, 7, 10],
      [2, 5, 8, 11],
    ]);
  });

  it('tritones from C: 6 pairs', () => {
    const groups = getAxisGroups(0, 2);
    expect(groups).toEqual([
      [0, 6],
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 10],
      [5, 11],
    ]);
  });

  it('whole tones from C: 2 groups of 6', () => {
    const groups = getAxisGroups(0, 6);
    expect(groups).toEqual([
      [0, 2, 4, 6, 8, 10],
      [1, 3, 5, 7, 9, 11],
    ]);
  });

  it('respects root offset', () => {
    const groups = getAxisGroups(2, 3); // D root
    expect(groups).toEqual([
      [2, 6, 10],
      [3, 7, 11],
      [4, 8, 0],
      [5, 9, 1],
    ]);
  });
});

describe('getIntervalClass', () => {
  it('returns 0 for unison', () => {
    expect(getIntervalClass(0, 0)).toBe(0);
  });

  it('is symmetric: ic(0,7) === ic(7,0)', () => {
    expect(getIntervalClass(0, 7)).toBe(5);
    expect(getIntervalClass(7, 0)).toBe(5);
  });

  it('tritone is always 6', () => {
    expect(getIntervalClass(0, 6)).toBe(6);
    expect(getIntervalClass(3, 9)).toBe(6);
  });

  it('minor second / major seventh both return 1', () => {
    expect(getIntervalClass(0, 1)).toBe(1);
    expect(getIntervalClass(0, 11)).toBe(1);
  });
});

describe('getCadences', () => {
  it('major thirds from C: C→B7→E, E→Eb7→Ab, Ab→G7→C', () => {
    const cadences = getCadences(0, 3);
    expect(cadences).toEqual([
      { from: 0, dominant: 11, to: 4 },   // C → B7 → E
      { from: 4, dominant: 3, to: 8 },    // E → Eb7 → Ab
      { from: 8, dominant: 7, to: 0 },    // Ab → G7 → C
    ]);
  });

  it('minor thirds from C: 4 cadences cycling back', () => {
    const cadences = getCadences(0, 4);
    expect(cadences).toHaveLength(4);
    expect(cadences[0]!.from).toBe(0);
    expect(cadences[0]!.to).toBe(3);
    expect(cadences[3]!.to).toBe(0); // cycles back
  });
});
