/**
 * Pitch class set theory operations.
 *
 * Implements the Forte/Rahn toolkit: interval class vector, normal form,
 * prime form, and the standard transformational operations T_n, I_n, M_n.
 *
 * The M_n (multiplication) operations mirror astrokit's harmonicPositions(),
 * which projects astrological longitudes onto harmonic dials by multiplying
 * by n mod 360. Here we multiply pitch classes by n mod 12.
 */

/** Count of each interval class (ic1–ic6) across all pairs in a set. */
export type IntervalClassVector = [number, number, number, number, number, number];

/** Deduplicate, reduce mod 12, sort ascending. */
function normalize(pcs: number[]): number[] {
  return [...new Set(pcs.map(p => ((p % 12) + 12) % 12))].sort((a, b) => a - b);
}

/**
 * Compute the interval class vector for a pitch class set.
 * ICV[i-1] = count of interval class i (i = 1..6) across all unordered pairs.
 * This is the unique "fingerprint" of a set class.
 */
export function intervalClassVector(pcs: number[]): IntervalClassVector {
  const unique = normalize(pcs);
  const icv: IntervalClassVector = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const diff = Math.abs(unique[i]! - unique[j]!);
      const ic = diff > 6 ? 12 - diff : diff;
      if (ic >= 1 && ic <= 6) icv[ic - 1]++;
    }
  }
  return icv;
}

/**
 * Compute the normal form of a pitch class set.
 * Normal form is the rotation that is most compactly packed to the left:
 * smallest span, then smallest interval from first to each subsequent note
 * (compared from right to left to break ties).
 */
export function normalForm(pcs: number[]): number[] {
  const unique = normalize(pcs);
  if (unique.length <= 1) return unique;

  const n = unique.length;
  // Each rotation is represented with wraparound notes elevated by 12.
  const rotations = Array.from({ length: n }, (_, i) => [
    ...unique.slice(i),
    ...unique.slice(0, i).map(p => p + 12),
  ]);

  let best = rotations[0]!;
  for (let i = 1; i < n; i++) {
    const rot = rotations[i]!;
    const bestSpan = best[n - 1]! - best[0]!;
    const rotSpan = rot[n - 1]! - rot[0]!;
    if (rotSpan < bestSpan) {
      best = rot;
    } else if (rotSpan === bestSpan) {
      // Tie-break: compare intervals from second-to-last toward left.
      for (let j = n - 2; j >= 1; j--) {
        const bestIv = best[j]! - best[0]!;
        const rotIv = rot[j]! - rot[0]!;
        if (rotIv < bestIv) { best = rot; break; }
        if (rotIv > bestIv) break;
      }
    }
  }

  return best.map(p => p % 12);
}

/**
 * Transpose a pitch class set by n semitones: T_n(x) = (x + n) mod 12.
 */
export function transposeSet(pcs: number[], n: number): number[] {
  return pcs.map(p => ((((p % 12) + 12) % 12 + n) % 12 + 12) % 12);
}

/**
 * Invert a pitch class set: I_axis(x) = (axis − x) mod 12.
 * Default axis 0 inverts around C (I_0: C↔C, D↔B, E↔A, F↔G, etc.).
 */
export function invertSet(pcs: number[], axis: number = 0): number[] {
  return pcs.map(p => ((axis - ((p % 12) + 12) % 12) % 12 + 12) % 12);
}

/**
 * Multiply a pitch class set by n: M_n(x) = (x * n) mod 12.
 *
 * Key operations:
 *   M1  = identity
 *   M5  = maps perfect fourths → semitones (circle-of-fourths transform)
 *   M7  = maps perfect fifths → semitones (circle-of-fifths transform)
 *   M11 = inversion (equivalent to I_0)
 *
 * Direct analogue of astrokit's harmonicPositions(positions, n) which
 * multiplies ecliptic longitudes by n mod 360 to project onto harmonic dials.
 */
export function multiplySet(pcs: number[], n: number): number[] {
  return pcs.map(p => ((((p % 12) + 12) % 12 * ((n % 12) + 12) % 12) % 12 + 12) % 12);
}

/**
 * Compute the prime form of a pitch class set.
 * Prime form is the most compact normal form among the set and its inversion,
 * both transposed to start on 0. It is the canonical representative of a set class.
 */
export function primeForm(pcs: number[]): number[] {
  if (pcs.length === 0) return [];

  const nf = normalForm(pcs);
  const nfZero = normalForm(transposeSet(nf, -nf[0]!));

  const inv = invertSet(nf);
  const invNf = normalForm(inv);
  const invZero = normalForm(transposeSet(invNf, -invNf[0]!));

  // Pick the most compactly packed form (lexicographically smallest from left).
  for (let i = 1; i < nfZero.length; i++) {
    if (nfZero[i]! < invZero[i]!) return nfZero;
    if (invZero[i]! < nfZero[i]!) return invZero;
  }
  return nfZero;
}

/**
 * Check whether two pitch class sets belong to the same set class
 * (related by transposition T_n or inversion I_n).
 */
export function areRelatedByTnI(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return primeForm(a).join(',') === primeForm(b).join(',');
}

/**
 * Compute the complement of a pitch class set in the 12-tone universe.
 */
export function complement(pcs: number[]): number[] {
  const set = new Set(normalize(pcs));
  return Array.from({ length: 12 }, (_, i) => i).filter(p => !set.has(p));
}

/**
 * Project a pitch class set onto the nth harmonic dial via M_n.
 * Reveals structural symmetry: sets with n-fold symmetry will cluster or
 * collapse when multiplied by the corresponding divisor.
 *
 * Examples:
 *   harmonicProjection([0,4,8], 3) → [0,0,0]  (augmented triad collapses — 3-fold symmetry)
 *   harmonicProjection([0,3,6,9], 4) → [0,0,0,0]  (dim7 collapses — 4-fold symmetry)
 *   harmonicProjection([0,2,4,5,7,9,11], 7) → circle-of-fifths reordering
 */
export function harmonicProjection(pcs: number[], n: number): number[] {
  return multiplySet(pcs, n);
}

/**
 * Check whether two sets are Z-related: same interval class vector but
 * NOT related by T_n or I_n. Z-related pairs share a "fingerprint" without
 * being structurally equivalent.
 */
export function areZRelated(a: number[], b: number[]): boolean {
  if (areRelatedByTnI(a, b)) return false;
  return intervalClassVector(a).join(',') === intervalClassVector(b).join(',');
}
