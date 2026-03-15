/**
 * Harmonic consonance analysis using the Plomp & Levelt (1965) roughness model,
 * as refined by Vassilakis (2001).
 *
 * Dissonance between two pure tones is a function of their frequency difference
 * relative to the critical bandwidth at the lower frequency. Summing pairwise
 * roughness across all string pairs gives an overall dissonance score.
 */

export interface DroneString {
  label: string;  // e.g. "E2 (Guitar 1)"
  freq: number;   // Hz, after any detune applied
}

export interface IntervalPair {
  labelA: string;
  labelB: string;
  freqA: number;
  freqB: number;
  intervalName: string;   // nearest named interval
  intervalCents: number;  // actual cents between the two frequencies (reduced to 0–1200)
  dissonance: number;     // 0–1 (0 = pure consonance, 1 = max roughness)
  beatFrequency: number | null; // Hz — non-null when < 20 Hz (audible beating)
}

export interface DroneAnalysis {
  score: number;               // 0–1 (1 = maximally consonant)
  scoreLabel: string;          // human-readable category
  pairs: IntervalPair[];       // all unique pairs, sorted by dissonance asc
  mostConsonant: IntervalPair[];
  mostDissonant: IntervalPair[];
  beatPairs: IntervalPair[];   // pairs with audible beating (0.5–20 Hz)
}

// ── Interval naming ──────────────────────────────────────────────────────────

const NAMED_INTERVALS: Array<{ cents: number; name: string }> = [
  { cents: 0,    name: 'Unison' },
  { cents: 100,  name: 'Minor 2nd' },
  { cents: 200,  name: 'Major 2nd' },
  { cents: 300,  name: 'Minor 3rd' },
  { cents: 400,  name: 'Major 3rd' },
  { cents: 500,  name: 'Perfect 4th' },
  { cents: 600,  name: 'Tritone' },
  { cents: 700,  name: 'Perfect 5th' },
  { cents: 800,  name: 'Minor 6th' },
  { cents: 900,  name: 'Major 6th' },
  { cents: 1000, name: 'Minor 7th' },
  { cents: 1100, name: 'Major 7th' },
  { cents: 1200, name: 'Octave' },
];

function intervalCentsAndName(
  freqA: number,
  freqB: number,
): { cents: number; name: string } {
  const ratio = freqB > freqA ? freqB / freqA : freqA / freqB;
  // Reduce to within an octave
  let r = ratio;
  while (r > 2) r /= 2;
  while (r < 1) r *= 2;
  const cents = Math.round(1200 * Math.log2(r));
  let nearest = NAMED_INTERVALS[0]!;
  let minDist = Math.abs(cents - nearest.cents);
  for (const iv of NAMED_INTERVALS) {
    const dist = Math.abs(cents - iv.cents);
    if (dist < minDist) { minDist = dist; nearest = iv; }
  }
  return { cents, name: nearest.name };
}

// ── Plomp & Levelt roughness ─────────────────────────────────────────────────

// Critical bandwidth scaling constant
function cbwScale(fLow: number): number {
  return 0.24 / (0.0207 * fLow + 18.96);
}

// Roughness between two pure tones (un-normalized, peaks at ~0.15 for typical freqs)
function pairRoughness(f1: number, f2: number): number {
  if (f1 <= 0 || f2 <= 0 || f1 === f2) return 0;
  const fLow = Math.min(f1, f2);
  const fHigh = Math.max(f1, f2);
  const df = fHigh - fLow;
  const s = cbwScale(fLow);
  const r = Math.exp(-3.5 * s * df) - Math.exp(-5.75 * s * df);
  return Math.max(0, r);
}

// Peak roughness for a given fLow (analytical maximum of the roughness curve)
function peakRoughness(fLow: number): number {
  // d(roughness)/d(df) = 0 → dfPeak = ln(5.75/3.5) / (2.25 * s)
  const s = cbwScale(fLow);
  const dfPeak = Math.log(5.75 / 3.5) / (2.25 * s);
  return pairRoughness(fLow, fLow + dfPeak);
}

// Normalized dissonance 0–1 for a pair
function pairDissonance(f1: number, f2: number): number {
  const fLow = Math.min(f1, f2);
  const peak = peakRoughness(fLow);
  if (peak <= 0) return 0;
  return Math.min(1, pairRoughness(f1, f2) / peak);
}

// ── Public API ───────────────────────────────────────────────────────────────

export function analyzeFrequencies(strings: DroneString[]): DroneAnalysis {
  if (strings.length < 2) {
    return {
      score: 1,
      scoreLabel: 'No pairs',
      pairs: [],
      mostConsonant: [],
      mostDissonant: [],
      beatPairs: [],
    };
  }

  const pairs: IntervalPair[] = [];

  for (let i = 0; i < strings.length; i++) {
    for (let j = i + 1; j < strings.length; j++) {
      const a = strings[i]!;
      const b = strings[j]!;
      const dissonance = pairDissonance(a.freq, b.freq);
      const { cents, name } = intervalCentsAndName(a.freq, b.freq);
      const df = Math.abs(a.freq - b.freq);
      const beatFrequency = df < 20 && df >= 0.1 ? df : null;

      pairs.push({
        labelA: a.label,
        labelB: b.label,
        freqA: a.freq,
        freqB: b.freq,
        intervalName: name,
        intervalCents: cents,
        dissonance,
        beatFrequency,
      });
    }
  }

  pairs.sort((a, b) => a.dissonance - b.dissonance);

  const meanDissonance = pairs.reduce((s, p) => s + p.dissonance, 0) / pairs.length;
  const score = 1 - meanDissonance;

  let scoreLabel: string;
  if (score >= 0.8)      scoreLabel = 'Very Consonant';
  else if (score >= 0.6) scoreLabel = 'Consonant';
  else if (score >= 0.4) scoreLabel = 'Neutral';
  else if (score >= 0.2) scoreLabel = 'Dissonant';
  else                   scoreLabel = 'Very Dissonant';

  return {
    score,
    scoreLabel,
    pairs,
    mostConsonant: pairs.slice(0, 3),
    mostDissonant: pairs.slice(-3).reverse(),
    beatPairs: pairs.filter(p => p.beatFrequency !== null),
  };
}
