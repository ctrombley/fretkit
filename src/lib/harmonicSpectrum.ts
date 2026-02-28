/**
 * Harmonic spectrum analysis for pitch class sets.
 *
 * A direct port of astrokit's HarmonicAspects.ts, adapted for the 12-tone
 * pitch class universe.
 *
 * Astrokit projects astrological positions onto harmonic dials by multiplying
 * each longitude by n mod 360°, then measures how tightly the results cluster.
 * Tight clustering at harmonic n reveals that the chart has n-fold structure.
 *
 * Here we project pitch classes by multiplying each by n mod 12 (the M_n
 * transformation from pitchClassSet.ts), then measure clustering. This reveals
 * which harmonics are most "active" in a chord or scale.
 *
 * Examples:
 *   Major triad {0,4,7}: strong clustering at M3 (augmented symmetry), M9
 *   Diminished 7th {0,3,6,9}: perfect clustering at M4 (all collapse to 0)
 *   Whole tone {0,2,4,6,8,10}: perfect clustering at M2 and M6
 */

import { harmonicProjection } from './pitchClassSet';

// ── Types ─────────────────────────────────────────────────────────────────

export interface HarmonicCluster {
  /** Original pitch classes that land near each other after projection. */
  members: number[];
  /** Average projected position (mod 12). */
  centroid: number;
  /** Max circular distance from centroid within this cluster (semitones). */
  spread: number;
}

export interface HarmonicProjectionResult {
  harmonic: number;
  /** Projected pitch classes (M_n applied to input). */
  projectedPcs: number[];
  clusters: HarmonicCluster[];
  /** 0–1: how tightly the projected pcs cluster on the mod-12 ring. */
  strength: number;
}

export interface SpectrumEntry {
  harmonic: number;
  /** 0–1: clustering strength at this harmonic. */
  strength: number;
  clusters: HarmonicCluster[];
  description: string;
}

// ── Core functions ────────────────────────────────────────────────────────

/**
 * Circular distance between two pitch classes on the mod-12 ring (0–6).
 */
function circularDist(a: number, b: number): number {
  const d = Math.abs(((a % 12) + 12) % 12 - ((b % 12) + 12) % 12);
  return d > 6 ? 12 - d : d;
}

/**
 * Find clusters among projected pitch classes.
 * Pairs whose projected positions fall within `threshold` semitones of each
 * other (on the mod-12 ring) are grouped together.
 *
 * Mirrors astrokit's findHarmonicClusters(positions, n, orb).
 */
export function findHarmonicClusters(
  pcs: number[],
  n: number,
  threshold: number = 2,
): HarmonicCluster[] {
  if (pcs.length === 0) return [];

  const projected = harmonicProjection(pcs, n);
  const pairs = pcs.map((original, i) => ({ original, projected: projected[i]! }));
  const sorted = [...pairs].sort((a, b) => a.projected - b.projected);

  const clusters: HarmonicCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;
    const cluster: typeof sorted[number][] = [sorted[i]!];
    used.add(i);

    for (let j = 0; j < sorted.length; j++) {
      if (i === j || used.has(j)) continue;
      if (circularDist(sorted[j]!.projected, sorted[i]!.projected) <= threshold) {
        cluster.push(sorted[j]!);
        used.add(j);
      }
    }

    const members = cluster.map(p => p.original);
    const avgProjected = cluster.reduce((s, p) => s + p.projected, 0) / cluster.length;
    const centroid = ((Math.round(avgProjected) % 12) + 12) % 12;
    const spread = cluster.reduce(
      (mx, p) => Math.max(mx, circularDist(p.projected, avgProjected)),
      0,
    );

    clusters.push({ members, centroid, spread });
  }

  return clusters;
}

/**
 * Compute clustering strength (0–1) for a harmonic projection.
 * Measures the fraction of pitch class pairs that end up within 2 semitones
 * of each other after projection — higher = more clustered.
 *
 * Mirrors astrokit's harmonicSpectrum() scoring logic.
 */
export function clusteringStrength(pcs: number[], n: number): number {
  if (pcs.length <= 1) return 1;

  const projected = harmonicProjection(pcs, n);
  let closePairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      if (circularDist(projected[i]!, projected[j]!) <= 2) closePairs++;
      totalPairs++;
    }
  }

  return totalPairs === 0 ? 1 : closePairs / totalPairs;
}

const HARMONIC_DESCRIPTIONS: Record<number, string> = {
  1:  'M1 — identity',
  2:  'M2 — whole-tone axis',
  3:  'M3 — major third / augmented axis',
  4:  'M4 — minor third / diminished axis',
  5:  'M5 — circle of fourths',
  6:  'M6 — tritone axis',
  7:  'M7 — circle of fifths',
  8:  'M8 — minor sixth axis',
  9:  'M9 — major third axis (inverse)',
  10: 'M10 — whole-tone axis (inverse)',
  11: 'M11 — inversion (I₀)',
};

/**
 * Compute the harmonic spectrum of a pitch class set.
 * Returns clustering strength at each multiplier from 1 to maxHarmonic.
 *
 * High strength at harmonic n means the set has n-fold structure (or is
 * invariant under M_n). Use this to "fingerprint" the symmetry of any chord
 * or scale.
 *
 * Mirrors astrokit's harmonicSpectrum(positions, maxHarmonic).
 */
export function harmonicSpectrum(
  pcs: number[],
  maxHarmonic: number = 11,
): SpectrumEntry[] {
  return Array.from({ length: maxHarmonic }, (_, i) => {
    const n = i + 1;
    return {
      harmonic: n,
      strength: clusteringStrength(pcs, n),
      clusters: findHarmonicClusters(pcs, n),
      description: HARMONIC_DESCRIPTIONS[n] ?? `M${n}`,
    };
  });
}

/**
 * Full projection result for a single harmonic, including projected positions.
 */
export function projectHarmonic(pcs: number[], n: number): HarmonicProjectionResult {
  return {
    harmonic: n,
    projectedPcs: harmonicProjection(pcs, n),
    clusters: findHarmonicClusters(pcs, n),
    strength: clusteringStrength(pcs, n),
  };
}
