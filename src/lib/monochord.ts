/**
 * Monochord: the mathematical string instrument of Pythagoras (~530 BCE).
 *
 * A string of length 1, divided by a movable bridge at position t ∈ (0,1):
 *   left segment  (length t)   → frequency = fundHz / t
 *   right segment (length 1-t) → frequency = fundHz / (1-t)
 *
 * Because frequency ∝ 1/length, placing the bridge at t = q/p
 * makes the left segment play exactly p/q × fundHz — a just-intonation
 * interval above the fundamental.  This is what Pythagoras discovered.
 */

import { getPitchClassColor } from './noteColors';
import { noteName } from './harmony';

// ── Types ─────────────────────────────────────────────────────────────────

export interface SegmentInfo {
  length: number;        // fraction of full string
  hz: number;            // frequency in Hz
  ratioStr: string;      // e.g. "3:2" above the fundamental
  intervalName: string;  // e.g. "Perfect Fifth"
  cents: number;         // cents above fundamental
  pitchClass: number;
  noteName: string;
  color: string;
}

export interface BridgeInfo {
  position: number;
  left: SegmentInfo;
  right: SegmentInfo;
  beatHz: number;              // |leftHz − rightHz|
  segmentRatioStr: string;     // interval between the two segments
  segmentIntervalName: string;
  nearestCanonical: CanonicalRatio | null;
}

export interface CanonicalRatio {
  p: number;          // numerator (interval above fundamental)
  q: number;          // denominator
  position: number;   // canonical bridge position = q/p (left segment length)
  symbol: string;     // "3:2"
  name: string;       // "Perfect Fifth"
  justCents: number;  // just-intonation cents
  description: string;
}

export interface CommaStep {
  n: number;
  hz: number;
  centsFromStart: number;  // cents above fundHz, octave-reduced
  centsDeviation: number;  // deviation from equal-tempered expectation
  label: string;           // note name on circle of fifths
}

export interface FundamentalNote {
  name: string;
  pitchClass: number;
  octave: number;
  hz: number;
}

// ── Interval names ────────────────────────────────────────────────────────

const INTERVAL_NAMES: Record<number, string> = {
  0:  'Unison',
  1:  'Minor 2nd',
  2:  'Major 2nd',
  3:  'Minor 3rd',
  4:  'Major 3rd',
  5:  'Perfect 4th',
  6:  'Tritone',
  7:  'Perfect 5th',
  8:  'Minor 6th',
  9:  'Major 6th',
  10: 'Minor 7th',
  11: 'Major 7th',
  12: 'Octave',
};

// ── Canonical bridge positions ────────────────────────────────────────────
// At position t = q/p the left segment (length q/p) plays p/q × fundHz.

export const CANONICAL_RATIOS: CanonicalRatio[] = [
  {
    p: 2, q: 1, position: 1 / 2, symbol: '2:1', name: 'Octave',
    justCents: 1200.00,
    description: 'Half the string length — one octave above the open string',
  },
  {
    p: 3, q: 2, position: 2 / 3, symbol: '3:2', name: 'Perfect Fifth',
    justCents: 701.96,
    description: "Pythagoras's key discovery — two-thirds of the string length",
  },
  {
    p: 4, q: 3, position: 3 / 4, symbol: '4:3', name: 'Perfect Fourth',
    justCents: 498.04,
    description: 'Three-quarters of the string — the perfect fourth',
  },
  {
    p: 5, q: 4, position: 4 / 5, symbol: '5:4', name: 'Major Third',
    justCents: 386.31,
    description: 'Four-fifths of the string — the pure major third',
  },
  {
    p: 6, q: 5, position: 5 / 6, symbol: '6:5', name: 'Minor Third',
    justCents: 315.64,
    description: 'Five-sixths of the string — the pure minor third',
  },
  {
    p: 5, q: 3, position: 3 / 5, symbol: '5:3', name: 'Major Sixth',
    justCents: 884.36,
    description: 'Three-fifths of the string — the pure major sixth',
  },
  {
    p: 8, q: 5, position: 5 / 8, symbol: '8:5', name: 'Minor Sixth',
    justCents: 813.69,
    description: 'Five-eighths of the string — the pure minor sixth',
  },
  {
    p: 7, q: 4, position: 4 / 7, symbol: '7:4', name: 'Harmonic 7th',
    justCents: 968.83,
    description: 'The 7th harmonic — between minor and major seventh',
  },
  {
    p: 9, q: 8, position: 8 / 9, symbol: '9:8', name: 'Pythagorean Tone',
    justCents: 203.91,
    description: 'The Pythagorean whole tone — the ratio 9:8',
  },
  {
    p: 16, q: 9, position: 9 / 16, symbol: '16:9', name: 'Minor 7th',
    justCents: 996.09,
    description: 'The Pythagorean minor seventh',
  },
  {
    p: 45, q: 32, position: 32 / 45, symbol: '45:32', name: 'Tritone',
    justCents: 590.22,
    description: 'Diabolus in musica — the augmented fourth',
  },
];

// The golden ratio bridge position — the irrational ghost
export const GOLDEN_POSITION = 1 / 1.6180339887; // ≈ 0.618

// ── Math helpers ──────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b > 0) { const r = a % b; a = b; b = r; }
  return a === 0 ? 1 : a;
}

/**
 * Best rational approximation p/q ≈ x, both ≤ maxN (Stern-Brocot search).
 * Exported so components can compute Lissajous ratios from bridge position.
 */
export function toIntegerRatio(x: number, maxN = 24): [number, number] {
  if (!isFinite(x) || x <= 0) return [1, 1];
  let bp = 1, bq = 1, be = Infinity;
  for (let q = 1; q <= maxN; q++) {
    const p = Math.round(x * q);
    if (p < 1) continue;
    const err = Math.abs(p / q - x);
    if (err < be) { be = err; bp = p; bq = q; }
  }
  const d = gcd(bp, bq);
  return [bp / d, bq / d];
}

function segmentInfo(len: number, fundHz: number, fundPc: number): SegmentInfo {
  const hz = fundHz / len;
  const ratio = hz / fundHz;         // = 1/len
  const cents = 1200 * Math.log2(ratio);

  const [p, q] = toIntegerRatio(ratio, 48);
  const ratioStr = q === 1 ? `${p}:1` : `${p}:${q}`;

  const semiFull = cents / 100;
  const semiMod  = ((Math.round(semiFull) % 12) + 12) % 12;
  const intervalName = INTERVAL_NAMES[semiMod] ?? 'Interval';

  const pitchClass = ((fundPc + Math.round(semiFull)) % 12 + 12) % 12;
  return {
    length: len,
    hz,
    ratioStr,
    intervalName,
    cents,
    pitchClass,
    noteName: noteName(pitchClass),
    color: getPitchClassColor(pitchClass),
  };
}

export function getBridgeInfo(t: number, fundHz: number, fundPc: number): BridgeInfo {
  t = Math.max(0.04, Math.min(0.96, t));
  const left  = segmentInfo(t,     fundHz, fundPc);
  const right = segmentInfo(1 - t, fundHz, fundPc);
  const beatHz = Math.abs(left.hz - right.hz);

  // Ratio between the two segments (higher/lower)
  const segRatio = Math.max(left.hz, right.hz) / Math.min(left.hz, right.hz);
  const [sp, sq] = toIntegerRatio(segRatio, 32);
  const segmentRatioStr = `${sp}:${sq}`;
  const segSemi = ((Math.round(1200 * Math.log2(sp / sq) / 100) % 12) + 12) % 12;
  const segmentIntervalName = INTERVAL_NAMES[segSemi] ?? 'Interval';

  // Nearest canonical ratio — snap within 2% of string length
  let nearestCanonical: CanonicalRatio | null = null;
  let nearestDist = 0.025;
  for (const cr of CANONICAL_RATIOS) {
    const d = Math.min(Math.abs(t - cr.position), Math.abs(t - (1 - cr.position)));
    if (d < nearestDist) { nearestDist = d; nearestCanonical = cr; }
  }

  return { position: t, left, right, beatHz, segmentRatioStr, segmentIntervalName, nearestCanonical };
}

// ── Lissajous ─────────────────────────────────────────────────────────────

/** Generate Lissajous curve points for frequency ratio p:q. */
export function lissajousPoints(
  p: number,
  q: number,
  numPoints = 1200,
  phase = Math.PI / 2,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    pts.push([Math.sin(p * t + phase), Math.sin(q * t)]);
  }
  return pts;
}

// ── Pythagorean comma stacker ─────────────────────────────────────────────

const FIFTH_NAMES = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'Ab', 'Eb', 'Bb', 'F', 'C',
];

/**
 * Stack n perfect fifths (3:2) from fundHz, octave-reduced.
 * After 12 steps the deviation from unison is the Pythagorean comma (≈ 23.46 ¢).
 */
export function stackFifths(steps: number, fundHz: number): CommaStep[] {
  const results: CommaStep[] = [];
  let hz = fundHz;
  for (let n = 1; n <= steps; n++) {
    hz *= 3 / 2;
    while (hz > fundHz * 2) hz /= 2;
    const centsFromStart = 1200 * Math.log2(hz / fundHz);
    const idealEtCents   = (n * 700) % 1200;
    results.push({
      n,
      hz,
      centsFromStart,
      centsDeviation: centsFromStart - idealEtCents,
      label: FIFTH_NAMES[n % 12] ?? '?',
    });
  }
  return results;
}

// ── Fundamental note table ────────────────────────────────────────────────

export const FUNDAMENTAL_NOTES: FundamentalNote[] = (() => {
  const roots = [
    { name: 'C', pc: 0 },  { name: 'D', pc: 2 },  { name: 'E', pc: 4 },
    { name: 'F', pc: 5 },  { name: 'G', pc: 7 },  { name: 'A', pc: 9 },
    { name: 'B', pc: 11 },
  ];
  const result: FundamentalNote[] = [];
  for (const oct of [1, 2, 3]) {
    for (const { name, pc } of roots) {
      const semi = pc + (oct + 1) * 12 - 69; // relative to A4 = 440 Hz
      result.push({ name: `${name}${oct}`, pitchClass: pc, octave: oct, hz: 440 * Math.pow(2, semi / 12) });
    }
  }
  return result;
})();

export const DEFAULT_FUNDAMENTAL =
  FUNDAMENTAL_NOTES.find(n => n.name === 'A2') ?? FUNDAMENTAL_NOTES[9]!;

// ── Standalone Web Audio ──────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function audioCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

/**
 * Pluck the monochord string at `hz`.
 * Pure sine with faint 2nd harmonic — mathematical, resonant.
 * Returns a stop() function.
 */
export function pluckMonochord(hz: number, duration = 4.5): () => void {
  const ctx = audioCtx();
  const now = ctx.currentTime;

  const osc  = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(hz, now);

  const osc2 = ctx.createOscillator();  // faint 2nd harmonic for warmth
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(hz * 2, now);

  const gain  = ctx.createGain();
  gain.gain.setValueAtTime(0.32, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.055, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + duration + 0.1);
  osc2.stop(now + duration * 0.35 + 0.1);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.001), t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
    osc.stop(t + 0.15);
    gain2.gain.cancelScheduledValues(t);
    gain2.gain.setValueAtTime(Math.max(gain2.gain.value, 0.001), t);
    gain2.gain.linearRampToValueAtTime(0.001, t + 0.12);
    osc2.stop(t + 0.15);
  };
}

/** Sustain a drone tone at `hz`. Returns a stop() function. */
export function startDrone(hz: number): () => void {
  const ctx = audioCtx();
  const now = ctx.currentTime;

  const osc  = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(hz, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);

  return () => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.18);
    osc.stop(t + 0.22);
  };
}
