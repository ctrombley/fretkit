import { describe, it, expect } from 'vitest';
import {
  findHarmonicClusters,
  clusteringStrength,
  harmonicSpectrum,
  projectHarmonic,
} from '../harmonicSpectrum';

describe('findHarmonicClusters', () => {
  it('augmented triad M3 — all pcs collapse to same position', () => {
    // {0,4,8} × 3 mod 12 = {0,0,0}: all three map to 0
    const clusters = findHarmonicClusters([0, 4, 8], 3);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.members).toHaveLength(3);
    expect(clusters[0]!.spread).toBe(0);
  });

  it('dim7 M4 — all pcs collapse to 0', () => {
    // {0,3,6,9} × 4 mod 12 = {0,0,0,0}
    const clusters = findHarmonicClusters([0, 3, 6, 9], 4);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.members).toHaveLength(4);
  });

  it('identity (M1) — no clustering in spread-out set', () => {
    // {0,4,7} × 1 = {0,4,7}: all separate
    const clusters = findHarmonicClusters([0, 4, 7], 1, 2);
    expect(clusters).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(findHarmonicClusters([], 3)).toEqual([]);
  });
});

describe('clusteringStrength', () => {
  it('augmented triad has strength 1 at M3 (all collapse)', () => {
    expect(clusteringStrength([0, 4, 8], 3)).toBe(1);
  });

  it('dim7 has strength 1 at M4', () => {
    expect(clusteringStrength([0, 3, 6, 9], 4)).toBe(1);
  });

  it('whole tone scale M2 — cardinality halves, pairs that collide cluster', () => {
    // {0,2,4,6,8,10} × 2 = {0,4,8,0,4,8}: 3 distinct values, 3 collapsed pairs.
    // clusteringStrength measures pairs ≤ 2 semitones apart: 3 collapsed out of 15 = 0.2
    const s = clusteringStrength([0, 2, 4, 6, 8, 10], 2);
    expect(s).toBeCloseTo(0.2, 5);
  });

  it('M2 projection of whole tone scale reduces cardinality from 6 to 3', () => {
    const result = projectHarmonic([0, 2, 4, 6, 8, 10], 2);
    const unique = new Set(result.projectedPcs).size;
    expect(unique).toBe(3); // collapses to augmented triad pattern {0,4,8}
  });

  it('single element has strength 1', () => {
    expect(clusteringStrength([5], 7)).toBe(1);
  });

  it('strength is between 0 and 1', () => {
    const s = clusteringStrength([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 1);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('harmonicSpectrum', () => {
  it('returns maxHarmonic entries', () => {
    const spectrum = harmonicSpectrum([0, 4, 7], 8);
    expect(spectrum).toHaveLength(8);
  });

  it('entry at harmonic 1 is identity', () => {
    const spectrum = harmonicSpectrum([0, 4, 7]);
    expect(spectrum[0]!.harmonic).toBe(1);
    expect(spectrum[0]!.description).toContain('identity');
  });

  it('dim7 peaks at harmonic 4', () => {
    const spectrum = harmonicSpectrum([0, 3, 6, 9]);
    const entry = spectrum.find(e => e.harmonic === 4)!;
    expect(entry.strength).toBe(1);
  });

  it('augmented triad peaks at harmonic 3', () => {
    const spectrum = harmonicSpectrum([0, 4, 8]);
    const entry = spectrum.find(e => e.harmonic === 3)!;
    expect(entry.strength).toBe(1);
  });

  it('whole tone scale — M2 collapses to 3 values, M6 collapses to 1', () => {
    // {0,2,4,6,8,10} × 2 = {0,4,8,0,4,8}: augmented-triad pattern (3 distinct)
    // {0,2,4,6,8,10} × 6 = {0,0,0,0,0,0}: full collapse to 0 (6-fold symmetry)
    const result2 = projectHarmonic([0, 2, 4, 6, 8, 10], 2);
    const result6 = projectHarmonic([0, 2, 4, 6, 8, 10], 6);
    expect(new Set(result2.projectedPcs).size).toBe(3);
    expect(new Set(result6.projectedPcs).size).toBe(1);
  });

  it('each entry has required fields', () => {
    const spectrum = harmonicSpectrum([0, 4, 7]);
    for (const entry of spectrum) {
      expect(typeof entry.harmonic).toBe('number');
      expect(typeof entry.strength).toBe('number');
      expect(Array.isArray(entry.clusters)).toBe(true);
      expect(typeof entry.description).toBe('string');
    }
  });
});

describe('projectHarmonic', () => {
  it('includes projectedPcs', () => {
    const result = projectHarmonic([0, 4, 7], 5);
    expect(result.projectedPcs).toHaveLength(3);
    expect(result.harmonic).toBe(5);
  });
});
