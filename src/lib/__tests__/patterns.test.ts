import { describe, it, expect } from 'vitest';
import {
  detectSymmetry,
  symmetryAxes,
  isSelfInverse,
  isWholeTone,
  isOctatonic,
  isAugmented,
  isDiminishedSeventh,
  hasTritone,
  detectPatterns,
  getSetClassInfo,
} from '../patterns';

describe('detectSymmetry', () => {
  it('augmented triad {0,4,8} has 3-fold symmetry', () => {
    const symm = detectSymmetry([0, 4, 8]);
    expect(symm.some(s => s.folds === 3)).toBe(true);
  });

  it('diminished 7th {0,3,6,9} has 4-fold symmetry', () => {
    const symm = detectSymmetry([0, 3, 6, 9]);
    expect(symm.some(s => s.folds === 4)).toBe(true);
  });

  it('whole tone scale {0,2,4,6,8,10} has 6-fold symmetry', () => {
    const symm = detectSymmetry([0, 2, 4, 6, 8, 10]);
    expect(symm.some(s => s.folds === 6)).toBe(true);
  });

  it('major triad has no transposition symmetry', () => {
    const symm = detectSymmetry([0, 4, 7]);
    expect(symm).toHaveLength(0);
  });

  it('tritone pair {0,6} has 2-fold symmetry', () => {
    const symm = detectSymmetry([0, 6]);
    expect(symm.some(s => s.folds === 2)).toBe(true);
  });
});

describe('symmetryAxes', () => {
  it('major triad {0,4,7} has inversion axes', () => {
    const axes = symmetryAxes([0, 4, 7]);
    // {0,4,7} inverted around axis 7: I_7(0)=7, I_7(4)=3, I_7(7)=0 → {0,3,7} ≠ {0,4,7}
    // Not self-inverse for any axis
    expect(axes).toHaveLength(0);
  });

  it('diminished 7th {0,3,6,9} has multiple inversion axes', () => {
    // {0,3,6,9} → symmetric under several inversions
    const axes = symmetryAxes([0, 3, 6, 9]);
    expect(axes.length).toBeGreaterThan(0);
  });

  it('chromatic scale is self-inverse under all axes', () => {
    const axes = symmetryAxes([0,1,2,3,4,5,6,7,8,9,10,11]);
    expect(axes).toHaveLength(12);
  });
});

describe('isSelfInverse', () => {
  it('diminished 7th is self-inverse', () => {
    expect(isSelfInverse([0, 3, 6, 9])).toBe(true);
  });

  it('major triad is not self-inverse', () => {
    expect(isSelfInverse([0, 4, 7])).toBe(false);
  });
});

describe('isWholeTone', () => {
  it('whole tone scale is detected', () => {
    expect(isWholeTone([0, 2, 4, 6, 8, 10])).toBe(true);
  });

  it('F# whole tone scale is detected', () => {
    expect(isWholeTone([1, 3, 5, 7, 9, 11])).toBe(true);
  });

  it('major scale is not whole tone', () => {
    expect(isWholeTone([0, 2, 4, 5, 7, 9, 11])).toBe(false);
  });

  it('5-note set is not whole tone', () => {
    expect(isWholeTone([0, 2, 4, 6, 8])).toBe(false);
  });
});

describe('isOctatonic', () => {
  it('octatonic scale starting with half step', () => {
    // C Db Eb E F# G A Bb = 0 1 3 4 6 7 9 10
    expect(isOctatonic([0, 1, 3, 4, 6, 7, 9, 10])).toBe(true);
  });

  it('7-note scale is not octatonic', () => {
    expect(isOctatonic([0, 2, 4, 5, 7, 9, 11])).toBe(false);
  });
});

describe('isAugmented', () => {
  it('augmented triad is detected', () => {
    expect(isAugmented([0, 4, 8])).toBe(true);
    expect(isAugmented([4, 8, 0])).toBe(true);
  });

  it('major triad is not augmented', () => {
    expect(isAugmented([0, 4, 7])).toBe(false);
  });
});

describe('isDiminishedSeventh', () => {
  it('fully diminished 7th is detected', () => {
    expect(isDiminishedSeventh([0, 3, 6, 9])).toBe(true);
  });

  it('minor 7th is not dim7', () => {
    expect(isDiminishedSeventh([0, 3, 7, 10])).toBe(false);
  });
});

describe('hasTritone', () => {
  it('tritone pair has tritone', () => {
    expect(hasTritone([0, 6])).toBe(true);
  });

  it('dom7 {0,4,7,10} has tritone between 4 and 10', () => {
    expect(hasTritone([0, 4, 7, 10])).toBe(true);
  });

  it('major triad has no tritone', () => {
    expect(hasTritone([0, 4, 7])).toBe(false);
  });
});

describe('detectPatterns', () => {
  it('names augmented triad', () => {
    const p = detectPatterns([0, 4, 8]);
    expect(p.some(x => x.name === 'Augmented triad')).toBe(true);
  });

  it('names diminished seventh', () => {
    const p = detectPatterns([0, 3, 6, 9]);
    expect(p.some(x => x.name === 'Diminished seventh')).toBe(true);
  });

  it('names whole-tone scale', () => {
    const p = detectPatterns([0, 2, 4, 6, 8, 10]);
    expect(p.some(x => x.name === 'Whole-tone scale')).toBe(true);
  });

  it('major triad gets no symmetry patterns', () => {
    const p = detectPatterns([0, 4, 7]);
    expect(p.every(x => !x.name.includes('symmetry') && !x.name.includes('fold'))).toBe(true);
  });
});

describe('getSetClassInfo', () => {
  it('major/minor triad → 3-11', () => {
    const info = getSetClassInfo([0, 3, 7]);
    expect(info).not.toBeNull();
    expect(info!.forteNumber).toBe('3-11');
    expect(info!.commonName).toContain('triad');
  });

  it('augmented triad → 3-12', () => {
    const info = getSetClassInfo([0, 4, 8]);
    expect(info!.forteNumber).toBe('3-12');
  });

  it('diminished 7th → 4-28', () => {
    const info = getSetClassInfo([0, 3, 6, 9]);
    expect(info!.forteNumber).toBe('4-28');
  });

  it('whole tone scale → 6-35', () => {
    const info = getSetClassInfo([0, 2, 4, 6, 8, 10]);
    expect(info!.forteNumber).toBe('6-35');
  });

  it('major scale → 7-35', () => {
    const info = getSetClassInfo([0, 2, 4, 5, 7, 9, 11]);
    expect(info!.forteNumber).toBe('7-35');
  });

  it('returns null for unknown sets', () => {
    // A random 9-note set unlikely to be in the table
    expect(getSetClassInfo([0, 1, 2, 3, 4, 5, 6, 7, 8])).toBeNull();
  });
});
