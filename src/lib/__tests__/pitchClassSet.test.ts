import { describe, it, expect } from 'vitest';
import {
  intervalClassVector,
  normalForm,
  primeForm,
  transposeSet,
  invertSet,
  multiplySet,
  harmonicProjection,
  complement,
  areRelatedByTnI,
  areZRelated,
} from '../pitchClassSet';

describe('intervalClassVector', () => {
  it('major triad {0,4,7} → <001110>', () => {
    // ic1=0, ic2=0, ic3=1(m3 between E-G=3), ic4=1(M3 between C-E=4), ic5=1(P5 between C-G=7)... wait
    // C=0, E=4, G=7
    // 0-4=4 → ic4; 0-7=7 → ic5; 4-7=3 → ic3
    const icv = intervalClassVector([0, 4, 7]);
    expect(icv).toEqual([0, 0, 1, 1, 1, 0]);
  });

  it('minor triad {0,3,7} → <001110>', () => {
    // Same icv as major triad (they are T/I related)
    const icv = intervalClassVector([0, 3, 7]);
    expect(icv).toEqual([0, 0, 1, 1, 1, 0]);
  });

  it('diminished 7th {0,3,6,9} → <004002>', () => {
    // All pairs: 0-3=3(ic3), 0-6=6(ic6), 0-9=3(ic3), 3-6=3(ic3), 3-9=6(ic6), 6-9=3(ic3)
    // ic3=4, ic6=2
    const icv = intervalClassVector([0, 3, 6, 9]);
    expect(icv).toEqual([0, 0, 4, 0, 0, 2]);
  });

  it('whole tone {0,2,4,6,8,10} → <060603>', () => {
    const icv = intervalClassVector([0, 2, 4, 6, 8, 10]);
    expect(icv).toEqual([0, 6, 0, 6, 0, 3]);
  });

  it('handles duplicates and octave-equivalent pcs', () => {
    const icv = intervalClassVector([0, 4, 7, 12]); // 12 mod 12 = 0, duplicate
    expect(icv).toEqual(intervalClassVector([0, 4, 7]));
  });

  it('empty set → all zeros', () => {
    expect(intervalClassVector([])).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('normalForm', () => {
  it('major triad {4,7,0} → [0,4,7]', () => {
    expect(normalForm([4, 7, 0])).toEqual([0, 4, 7]);
  });

  it('minor triad {0,3,7} → [0,3,7]', () => {
    expect(normalForm([0, 3, 7])).toEqual([0, 3, 7]);
  });

  it('diminished 7th {0,3,6,9} → [0,3,6,9]', () => {
    expect(normalForm([0, 3, 6, 9])).toEqual([0, 3, 6, 9]);
  });

  it('augmented triad {0,4,8} → [0,4,8]', () => {
    expect(normalForm([0, 4, 8])).toEqual([0, 4, 8]);
  });

  it('handles unsorted input — G major {2,7,11}', () => {
    // G=7, B=11, D=2; most compact rotation is [7,11,14] → [7,11,2]
    expect(normalForm([2, 11, 7])).toEqual([7, 11, 2]);
  });

  it('arbitrary ordering produces same result as sorted', () => {
    expect(normalForm([11, 4, 0])).toEqual(normalForm([0, 4, 11]));
  });

  it('single note → [pc]', () => {
    expect(normalForm([9])).toEqual([9]);
  });

  it('empty → []', () => {
    expect(normalForm([])).toEqual([]);
  });
});

describe('primeForm', () => {
  it('major and minor triads share prime form [0,3,7]', () => {
    expect(primeForm([0, 4, 7])).toEqual([0, 3, 7]);
    expect(primeForm([0, 3, 7])).toEqual([0, 3, 7]);
  });

  it('diminished triad prime form [0,3,6]', () => {
    expect(primeForm([0, 3, 6])).toEqual([0, 3, 6]);
  });

  it('augmented triad prime form [0,4,8]', () => {
    expect(primeForm([0, 4, 8])).toEqual([0, 4, 8]);
  });

  it('dom7 {0,4,7,10} → [0,2,5,8] (4-27)', () => {
    // Dom7 and half-dim share prime form 4-27
    expect(primeForm([0, 4, 7, 10])).toEqual([0, 2, 5, 8]);
  });

  it('major and minor pentatonic share prime form [0,2,4,7,9]', () => {
    const major = primeForm([0, 2, 4, 7, 9]);  // C D E G A
    const minor = primeForm([0, 3, 5, 7, 10]); // C Eb F G Bb
    expect(major).toEqual([0, 2, 4, 7, 9]);
    expect(minor).toEqual([0, 2, 4, 7, 9]);
  });

  it('empty → []', () => {
    expect(primeForm([])).toEqual([]);
  });
});

describe('transposeSet', () => {
  it('transposes all pcs by n', () => {
    expect(transposeSet([0, 4, 7], 2)).toEqual([2, 6, 9]);
  });

  it('wraps around mod 12', () => {
    expect(transposeSet([10, 11], 3)).toEqual([1, 2]);
  });
});

describe('invertSet', () => {
  it('I_0 inverts around C', () => {
    // I_0(C=0)=0, I_0(E=4)=8, I_0(G=7)=5
    expect(invertSet([0, 4, 7]).sort((a, b) => a - b)).toEqual([0, 5, 8]);
  });

  it('I_0(E=4) = Ab(8)', () => {
    expect(invertSet([4])).toEqual([8]);
  });
});

describe('multiplySet', () => {
  it('M1 = identity', () => {
    expect(multiplySet([0, 4, 7], 1)).toEqual([0, 4, 7]);
  });

  it('M7 of C major scale maps through circle of fifths', () => {
    // C major: 0 2 4 5 7 9 11
    // × 7 mod 12: 0 14%12=2 28%12=4 35%12=11 49%12=1 63%12=3 77%12=5
    const result = multiplySet([0, 2, 4, 5, 7, 9, 11], 7).sort((a, b) => a - b);
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 11]); // same 7 pcs, rearranged
  });

  it('M3 on augmented triad {0,4,8} collapses to {0}', () => {
    const result = new Set(multiplySet([0, 4, 8], 3));
    expect(result.size).toBe(1);
    expect(result.has(0)).toBe(true);
  });

  it('M4 on dim7 {0,3,6,9} collapses to {0}', () => {
    const result = new Set(multiplySet([0, 3, 6, 9], 4));
    expect(result.size).toBe(1);
  });
});

describe('harmonicProjection', () => {
  it('is equivalent to multiplySet', () => {
    const pcs = [0, 4, 7];
    expect(harmonicProjection(pcs, 5)).toEqual(multiplySet(pcs, 5));
  });
});

describe('complement', () => {
  it('complement of {0,4,7} has 9 elements and no overlap', () => {
    const c = complement([0, 4, 7]);
    expect(c).toHaveLength(9);
    expect(c.includes(0)).toBe(false);
    expect(c.includes(4)).toBe(false);
    expect(c.includes(7)).toBe(false);
  });

  it('complement of empty set is all 12', () => {
    expect(complement([])).toHaveLength(12);
  });

  it('complement of chromatic scale is empty', () => {
    expect(complement([0,1,2,3,4,5,6,7,8,9,10,11])).toHaveLength(0);
  });
});

describe('areRelatedByTnI', () => {
  it('major and minor triads are T/I related', () => {
    expect(areRelatedByTnI([0, 4, 7], [0, 3, 7])).toBe(true);
  });

  it('D major and C major are related by T_2', () => {
    expect(areRelatedByTnI([0, 4, 7], [2, 6, 9])).toBe(true);
  });

  it('major triad and dom7 are not related', () => {
    expect(areRelatedByTnI([0, 4, 7], [0, 4, 7, 10])).toBe(false);
  });

  it('pentatonic transpositions are related', () => {
    expect(areRelatedByTnI([0, 2, 4, 7, 9], [5, 7, 9, 0, 2])).toBe(true);
  });
});

describe('areZRelated', () => {
  it('returns false for T/I related sets', () => {
    expect(areZRelated([0, 4, 7], [0, 3, 7])).toBe(false);
  });

  it('returns false for sets with different ICV', () => {
    expect(areZRelated([0, 4, 7], [0, 3, 6, 9])).toBe(false);
  });
});
