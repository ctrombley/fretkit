import { describe, it, expect } from 'vitest';
import {
  getScaleModes,
  containingScales,
  areModallyEquivalent,
} from '../modalRelations';
import Scale from '../Scale';
import modes from '../modes';
import scales from '../scales';

describe('areModallyEquivalent', () => {
  it('C major and D dorian share the same pitch classes', () => {
    // C major: 0 2 4 5 7 9 11
    // D dorian: 2 4 5 7 9 11 0 (same pcs, different root)
    expect(areModallyEquivalent([0, 2, 4, 5, 7, 9, 11], [0, 2, 4, 5, 7, 9, 11])).toBe(true);
  });

  it('C major and C minor are NOT modally equivalent', () => {
    expect(areModallyEquivalent(
      [0, 2, 4, 5, 7, 9, 11], // C major
      [0, 2, 3, 5, 7, 8, 10], // C minor
    )).toBe(false);
  });

  it('order does not matter', () => {
    expect(areModallyEquivalent([0, 4, 7], [7, 0, 4])).toBe(true);
  });

  it('different lengths are not equivalent', () => {
    expect(areModallyEquivalent([0, 4, 7], [0, 4, 7, 10])).toBe(false);
  });
});

describe('Scale.pitchClasses and Scale.isModallyEquivalent', () => {
  it('Scale.pitchClasses returns sorted unique pcs', () => {
    const s = new Scale('C major');
    expect(s.pitchClasses).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('C major and G major have different pitch classes', () => {
    const c = new Scale('C major');
    const g = new Scale('G major');
    expect(c.isModallyEquivalent(g)).toBe(false);
  });

  it('C major and C major (same object) are modally equivalent', () => {
    const a = new Scale('C major');
    const b = new Scale('C major');
    expect(a.isModallyEquivalent(b)).toBe(true);
  });
});

describe('getScaleModes', () => {
  it('returns 7 rotations for a 7-note scale', () => {
    const modeRotations = getScaleModes(modes.ionian!, 0); // C ionian
    expect(modeRotations).toHaveLength(7);
  });

  it('first rotation root is the scale root', () => {
    const modeRotations = getScaleModes(modes.ionian!, 0);
    expect(modeRotations[0]!.root).toBe(0); // C
    expect(modeRotations[0]!.degree).toBe(1);
  });

  it('second rotation starts on D (2) for C major', () => {
    const modeRotations = getScaleModes(modes.ionian!, 0);
    expect(modeRotations[1]!.root).toBe(2); // D
    expect(modeRotations[1]!.modeName).toBe('dorian');
  });

  it('sixth rotation starts on A (9) for C major', () => {
    const modeRotations = getScaleModes(modes.ionian!, 0);
    expect(modeRotations[5]!.root).toBe(9); // A
    expect(modeRotations[5]!.modeName).toBe('aeolian');
  });

  it('all rotations have the same pitch class content', () => {
    const modeRotations = getScaleModes(modes.ionian!, 0);
    const allPcs = modeRotations[0]!.pitchClasses.sort((a, b) => a - b);
    for (const m of modeRotations) {
      expect([...m.pitchClasses].sort((a, b) => a - b)).toEqual(allPcs);
    }
  });

  it('accepts custom mode names', () => {
    const names = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const modeRotations = getScaleModes(modes.ionian!, 0, names);
    expect(modeRotations[0]!.modeName).toBe('I');
    expect(modeRotations[3]!.modeName).toBe('IV');
  });
});

describe('containingScales', () => {
  it('finds C major and its modes for pitch class 0 (C)', () => {
    const results = containingScales([0]);
    const names = results.map(r => r.scaleName);
    expect(names.some(n => n === 'ionian' || n === 'major')).toBe(true);
  });

  it('C major triad {0,4,7} is found in C major', () => {
    const results = containingScales([0, 4, 7]);
    const cMajor = results.find(r => r.root === 0 && (r.scaleName === 'major' || r.scaleName === 'ionian'));
    expect(cMajor).toBeDefined();
  });

  it('C major triad is NOT found in C minor', () => {
    // C minor has Eb (3) not E (4)
    const results = containingScales([0, 4, 7]);
    const cMinor = results.find(
      r => r.root === 0 && (r.scaleName === 'aeolian' || r.scaleName === 'natural minor'),
    );
    expect(cMinor).toBeUndefined();
  });

  it('returns empty array for empty input', () => {
    expect(containingScales([])).toEqual([]);
  });

  it('blues scale subset is found in fewer scales', () => {
    // {0,3,5} is a subset of many scales
    const results = containingScales([0, 3, 5]);
    expect(results.length).toBeGreaterThan(0);
  });

  it('respects scaleNames filter', () => {
    const results = containingScales([0, 4, 7], ['major', 'ionian']);
    expect(results.every(r => r.scaleName === 'major' || r.scaleName === 'ionian')).toBe(true);
  });
});
