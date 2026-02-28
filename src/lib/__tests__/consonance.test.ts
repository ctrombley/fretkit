import { describe, it, expect } from 'vitest';
import {
  justRatioInfo,
  intervalConsonance,
  beatFrequency,
  justIntonationBeat,
  setConsonance,
  JUST_INTERVAL_NAMES,
} from '../consonance';

describe('justRatioInfo', () => {
  it('unison (0) has ratio 1:1 and 0 cents error', () => {
    const info = justRatioInfo(0);
    expect(info.ratio).toEqual([1, 1]);
    expect(info.etCents).toBe(0);
    expect(info.justCents).toBe(0);
    expect(info.errorCents).toBeCloseTo(0);
  });

  it('perfect 5th (7) has ratio 3:2', () => {
    const info = justRatioInfo(7);
    expect(info.ratio).toEqual([3, 2]);
    expect(info.justCents).toBeCloseTo(701.955, 1);
    expect(info.etCents).toBe(700);
    expect(info.errorCents).toBeCloseTo(-1.955, 1);
  });

  it('major 3rd (4) has ratio 5:4', () => {
    const info = justRatioInfo(4);
    expect(info.ratio).toEqual([5, 4]);
    expect(info.justCents).toBeCloseTo(386.314, 1);
    expect(info.etCents).toBe(400);
    expect(info.errorCents).toBeCloseTo(13.686, 1);
  });

  it('octave (12 mod 12 = 0) has ratio 1:1 at 0 semitones', () => {
    const info = justRatioInfo(12);
    // 12 % 12 = 0, so unison ratio
    expect(info.ratio).toEqual([1, 1]);
  });
});

describe('intervalConsonance', () => {
  it('unison is most consonant (= 1)', () => {
    expect(intervalConsonance(0)).toBe(1);
  });

  it('octave equivalent to unison in mod-12 system', () => {
    expect(intervalConsonance(12)).toBe(intervalConsonance(0));
  });

  it('perfect fifth is more consonant than major third', () => {
    expect(intervalConsonance(7)).toBeGreaterThan(intervalConsonance(4));
  });

  it('major third is more consonant than minor second', () => {
    expect(intervalConsonance(4)).toBeGreaterThan(intervalConsonance(1));
  });

  it('tritone is among the least consonant', () => {
    expect(intervalConsonance(6)).toBeLessThan(intervalConsonance(7));
    expect(intervalConsonance(6)).toBeLessThan(intervalConsonance(5));
  });

  it('all values are positive and ≤ 1', () => {
    for (let i = 0; i <= 12; i++) {
      const c = intervalConsonance(i);
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});

describe('beatFrequency', () => {
  it('two identical pitches have 0 beats', () => {
    expect(beatFrequency(440, 440)).toBe(0);
  });

  it('1 Hz apart → 1 beat per second', () => {
    expect(beatFrequency(440, 441)).toBe(1);
  });

  it('is symmetric', () => {
    expect(beatFrequency(440, 445)).toBe(beatFrequency(445, 440));
  });
});

describe('justIntonationBeat', () => {
  it('perfect 5th from A4 (220 Hz) has very small beat', () => {
    // ET P5 at A2 (220 Hz): 220 × 2^(7/12) ≈ 329.628 Hz
    // Just P5: 220 × 3/2 = 330.000 Hz
    const beat = justIntonationBeat(220, 7);
    expect(beat).toBeCloseTo(0.372, 1);
    expect(beat).toBeLessThan(1); // very pure
  });

  it('major third has larger beat than perfect fifth', () => {
    // Major third beats more (~2 Hz at 220 Hz) vs P5 (~0.4 Hz)
    const p5beat = justIntonationBeat(220, 7);
    const m3beat = justIntonationBeat(220, 4);
    expect(m3beat).toBeGreaterThan(p5beat);
  });

  it('unison has no beat', () => {
    expect(justIntonationBeat(440, 0)).toBe(0);
  });
});

describe('setConsonance', () => {
  it('single note has consonance 1', () => {
    expect(setConsonance([0])).toBe(1);
  });

  it('empty set has consonance 1', () => {
    expect(setConsonance([])).toBe(1);
  });

  it('major triad is more consonant than diminished triad', () => {
    const major = setConsonance([0, 4, 7]);     // {P5, M3, m3}
    const dim   = setConsonance([0, 3, 6]);      // {tritone, m3, tritone}
    expect(major).toBeGreaterThan(dim);
  });

  it('perfect 5th dyad is more consonant than minor 2nd', () => {
    expect(setConsonance([0, 7])).toBeGreaterThan(setConsonance([0, 1]));
  });

  it('result is between 0 and 1', () => {
    const c = setConsonance([0, 1, 6, 11]);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});

describe('JUST_INTERVAL_NAMES', () => {
  it('has entries for 0–12', () => {
    for (let i = 0; i <= 12; i++) {
      expect(JUST_INTERVAL_NAMES[i]).toBeTruthy();
    }
  });

  it('unison is labeled correctly', () => {
    expect(JUST_INTERVAL_NAMES[0]).toContain('1:1');
  });

  it('perfect 5th is labeled correctly', () => {
    expect(JUST_INTERVAL_NAMES[7]).toContain('3:2');
  });
});
