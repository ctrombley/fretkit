import { describe, it, expect } from 'vitest';
import {
  getHarmonicFamily,
  fundamentalFrequency,
  getHarmonicInfo,
  getHarmonics,
  getSpiralPoint,
  getNodeRadius,
} from '../overtones';

describe('getHarmonicFamily', () => {
  it('classifies 1 as fundamental', () => {
    expect(getHarmonicFamily(1)).toBe('fundamental');
  });

  it('classifies pure octaves (2, 4, 8, 16) as octave', () => {
    expect(getHarmonicFamily(2)).toBe('octave');
    expect(getHarmonicFamily(4)).toBe('octave');
    expect(getHarmonicFamily(8)).toBe('octave');
    expect(getHarmonicFamily(16)).toBe('octave');
  });

  it('classifies fifth family (3, 6, 12) as fifth', () => {
    expect(getHarmonicFamily(3)).toBe('fifth');
    expect(getHarmonicFamily(6)).toBe('fifth');
    expect(getHarmonicFamily(12)).toBe('fifth');
  });

  it('classifies third family (5, 10, 20) as third', () => {
    expect(getHarmonicFamily(5)).toBe('third');
    expect(getHarmonicFamily(10)).toBe('third');
    expect(getHarmonicFamily(20)).toBe('third');
  });

  it('classifies seventh family (7, 14, 28) as seventh', () => {
    expect(getHarmonicFamily(7)).toBe('seventh');
    expect(getHarmonicFamily(14)).toBe('seventh');
    expect(getHarmonicFamily(28)).toBe('seventh');
  });

  it('classifies 11, 13 as other', () => {
    expect(getHarmonicFamily(11)).toBe('other');
    expect(getHarmonicFamily(13)).toBe('other');
  });
});

describe('fundamentalFrequency', () => {
  it('returns 440 for A4', () => {
    expect(fundamentalFrequency(9, 4)).toBeCloseTo(440, 1);
  });

  it('returns 110 for A2', () => {
    expect(fundamentalFrequency(9, 2)).toBeCloseTo(110, 1);
  });

  it('returns ~261.63 for C4 (middle C)', () => {
    expect(fundamentalFrequency(0, 4)).toBeCloseTo(261.63, 0);
  });
});

describe('getHarmonicInfo', () => {
  const a2Hz = 110;

  it('harmonic 3 of A2: freq=330, near E, deviation ≈ +2.0 cents', () => {
    const info = getHarmonicInfo(3, a2Hz, 9);
    expect(info.frequency).toBeCloseTo(330, 1);
    expect(info.nearestNoteName).toBe('E');
    expect(info.centsDeviation).toBeCloseTo(2.0, 0);
  });

  it('harmonic 7 of A2: freq=770, near G, deviation ≈ -31.2 cents', () => {
    const info = getHarmonicInfo(7, a2Hz, 9);
    expect(info.frequency).toBeCloseTo(770, 1);
    expect(info.nearestNoteName).toBe('G');
    expect(info.centsDeviation).toBeCloseTo(-31.2, 0);
  });

  it('harmonic 1 is the fundamental with 0 cents deviation', () => {
    const info = getHarmonicInfo(1, a2Hz, 9);
    expect(info.frequency).toBeCloseTo(110, 1);
    expect(info.centsFromFundamental).toBeCloseTo(0, 1);
    expect(info.family).toBe('fundamental');
  });

  it('harmonic 2 is one octave up', () => {
    const info = getHarmonicInfo(2, a2Hz, 9);
    expect(info.frequency).toBeCloseTo(220, 1);
    expect(info.octave).toBe(1);
    expect(info.family).toBe('octave');
  });
});

describe('getHarmonics', () => {
  it('returns the correct number of harmonics', () => {
    const harmonics = getHarmonics(110, 9, 8);
    expect(harmonics).toHaveLength(8);
    expect(harmonics[0]!.n).toBe(1);
    expect(harmonics[7]!.n).toBe(8);
  });
});

describe('getSpiralPoint', () => {
  const cx = 250, cy = 250, baseR = 40, growth = 50;

  it('places harmonic 1 at 12 o\'clock (angle = -π/2)', () => {
    const pt = getSpiralPoint(1, cx, cy, baseR, growth);
    expect(pt.angle).toBeCloseTo(-Math.PI / 2, 5);
    // At 12 o'clock: x ≈ cx, y ≈ cy - baseR
    expect(pt.x).toBeCloseTo(cx, 1);
    expect(pt.y).toBeCloseTo(cy - baseR, 1);
  });

  it('places harmonic 2 at 12 o\'clock one revolution out', () => {
    const pt = getSpiralPoint(2, cx, cy, baseR, growth);
    // log2(2) = 1, so angle = 2π - π/2 = 3π/2 which wraps to -π/2
    expect(pt.angle).toBeCloseTo(2 * Math.PI - Math.PI / 2, 5);
    // radius = baseR + growth * 1 = 90
    expect(pt.radius).toBeCloseTo(baseR + growth, 1);
  });
});

describe('getNodeRadius', () => {
  it('returns baseR for n=1', () => {
    expect(getNodeRadius(1, 20)).toBe(20);
  });

  it('decreases with n', () => {
    const r1 = getNodeRadius(1, 20);
    const r4 = getNodeRadius(4, 20);
    const r16 = getNodeRadius(16, 20);
    expect(r4).toBeLessThan(r1);
    expect(r16).toBeLessThan(r4);
    expect(r4).toBeCloseTo(10, 1); // 20 / sqrt(4) = 10
    expect(r16).toBeCloseTo(5, 1); // 20 / sqrt(16) = 5
  });
});
