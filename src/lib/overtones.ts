import { noteName, usesSharps } from './harmony';

// ── Types ────────────────────────────────────────────────────────────────

export type HarmonicFamily = 'fundamental' | 'octave' | 'fifth' | 'third' | 'seventh' | 'other';

export interface HarmonicInfo {
  n: number;
  frequency: number;
  etFrequency: number;
  ratio: string;
  centsFromFundamental: number;
  centsInOctave: number;
  nearestSemitone: number;
  nearestNoteName: string;
  centsDeviation: number;
  octave: number;
  intervalName: string;
  family: HarmonicFamily;
}

export interface SpiralPoint {
  angle: number;
  radius: number;
  x: number;
  y: number;
}

// ── Color palette ────────────────────────────────────────────────────────

export const HARMONIC_COLORS: Record<HarmonicFamily, string> = {
  fundamental: '#99C432',
  octave: '#3B82F6',
  fifth: '#F59E0B',
  third: '#EC4899',
  seventh: '#8B5CF6',
  other: '#9CA3AF',
};

// ── Interval names by semitone offset within octave ──────────────────────

const INTERVAL_NAMES: Record<number, string> = {
  0: 'Unison',
  1: 'Minor 2nd',
  2: 'Major 2nd',
  3: 'Minor 3rd',
  4: 'Major 3rd',
  5: 'Perfect 4th',
  6: 'Tritone',
  7: 'Perfect 5th',
  8: 'Minor 6th',
  9: 'Major 6th',
  10: 'Minor 7th',
  11: 'Major 7th',
};

// ── Core functions ───────────────────────────────────────────────────────

/** Classify a harmonic by its prime factorization (strip octave doublings). */
export function getHarmonicFamily(n: number): HarmonicFamily {
  if (n === 1) return 'fundamental';
  // Strip factors of 2 to get the odd part
  let odd = n;
  while (odd % 2 === 0) odd /= 2;
  if (odd === 1) return 'octave';
  if (odd % 7 === 0) return 'seventh';
  if (odd % 5 === 0) return 'third';
  if (odd % 3 === 0) return 'fifth';
  return 'other';
}

/** Compute frequency from pitch class (0-11) and octave using A4=440 Hz. */
export function fundamentalFrequency(pitchClass: number, octave: number): number {
  // A4 = 440 Hz, A is pitch class 9
  const semitonesFromA4 = (pitchClass - 9) + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/** Compute full info for harmonic n of a given fundamental. */
export function getHarmonicInfo(
  n: number,
  fundamentalHz: number,
  fundamentalPitchClass: number,
): HarmonicInfo {
  const frequency = n * fundamentalHz;
  const centsFromFundamental = 1200 * Math.log2(n);
  const centsInOctave = ((centsFromFundamental % 1200) + 1200) % 1200;
  const nearestSemitone = Math.round(centsInOctave / 100) % 12;
  const centsDeviation = centsInOctave - nearestSemitone * 100;
  const octave = Math.floor(centsFromFundamental / 1200);

  const absoluteSemitone = (fundamentalPitchClass + nearestSemitone) % 12;
  const preferSharps = usesSharps(absoluteSemitone);
  const nearestNoteName = noteName(absoluteSemitone, preferSharps);

  const etFrequency = fundamentalHz * Math.pow(2, (octave * 12 + nearestSemitone) / 12);

  const intervalName = INTERVAL_NAMES[nearestSemitone] ?? 'Unknown';
  const family = getHarmonicFamily(n);

  // Simple ratio string
  const ratio = `${n}:1`;

  return {
    n,
    frequency,
    etFrequency,
    ratio,
    centsFromFundamental,
    centsInOctave,
    nearestSemitone,
    nearestNoteName,
    centsDeviation,
    octave,
    intervalName,
    family,
  };
}

/** Generate HarmonicInfo for harmonics 1 through count. */
export function getHarmonics(
  fundamentalHz: number,
  pitchClass: number,
  count: number,
): HarmonicInfo[] {
  const result: HarmonicInfo[] = [];
  for (let n = 1; n <= count; n++) {
    result.push(getHarmonicInfo(n, fundamentalHz, pitchClass));
  }
  return result;
}

// ── Spiral geometry ──────────────────────────────────────────────────────

/** Get the SVG point for harmonic n on a logarithmic Archimedean spiral. */
export function getSpiralPoint(
  n: number,
  cx: number,
  cy: number,
  baseR: number,
  growth: number,
): SpiralPoint {
  const log2n = n === 1 ? 0 : Math.log2(n);
  const angle = log2n * 2 * Math.PI - Math.PI / 2;
  const radius = baseR + growth * log2n;
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  return { angle, radius, x, y };
}

/** Generate an SVG path string for the continuous spiral backbone. */
export function getSpiralBackbonePath(
  cx: number,
  cy: number,
  baseR: number,
  growth: number,
  maxN: number,
): string {
  const steps = Math.max(100, maxN * 20);
  const maxLog = Math.log2(maxN);
  const parts: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxLog;
    const angle = t * 2 * Math.PI - Math.PI / 2;
    const radius = baseR + growth * t;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }

  return parts.join(' ');
}

/** Get small reference markers at every ET semitone along the spiral. */
export function getETReferencePoints(
  cx: number,
  cy: number,
  baseR: number,
  growth: number,
  maxN: number,
  fundamentalPitchClass: number,
): { x: number; y: number; name: string; semitone: number }[] {
  const maxLog = Math.log2(maxN);
  const totalSemitones = Math.floor(maxLog * 12);
  const points: { x: number; y: number; name: string; semitone: number }[] = [];

  for (let s = 0; s <= totalSemitones; s++) {
    const log2val = s / 12;
    const angle = log2val * 2 * Math.PI - Math.PI / 2;
    const radius = baseR + growth * log2val;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const pc = (fundamentalPitchClass + (s % 12)) % 12;
    const preferSharps = usesSharps(pc);
    const name = noteName(pc, preferSharps);
    points.push({ x, y, name, semitone: s });
  }

  return points;
}

/** Get positions where the spiral completes full revolutions (octave boundaries). */
export function getOctaveMarkers(
  cx: number,
  cy: number,
  baseR: number,
  growth: number,
  maxN: number,
): { cx: number; cy: number; radius: number; octave: number }[] {
  const maxOctaves = Math.ceil(Math.log2(maxN));
  const markers: { cx: number; cy: number; radius: number; octave: number }[] = [];

  for (let oct = 0; oct <= maxOctaves; oct++) {
    const radius = baseR + growth * oct;
    markers.push({ cx, cy, radius, octave: oct });
  }

  return markers;
}

/** Node radius decreases with harmonic number. */
export function getNodeRadius(n: number, baseNodeR: number): number {
  return baseNodeR / Math.sqrt(n);
}
