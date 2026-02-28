import { noteName, usesSharps } from './harmony';
import type { HarmonicFamily } from './overtones';

// ── Types ────────────────────────────────────────────────────────────────

export type GeneratorPreset = 'fifths' | 'thirds' | 'sevenths';

export interface GeneratorConfig {
  name: string;
  ratio: [number, number];
  cents: number;
  family: HarmonicFamily;
}

export interface DerivedNote {
  step: number;
  totalCents: number;
  centsInOctave: number;
  nearestETStep: number;
  nearestNoteName: string;
  centsDeviation: number;
  frequency: number;
  angleDeg: number;
}

export interface DerivationResult {
  generator: GeneratorConfig;
  fundamentalHz: number;
  fundamentalPitchClass: number;
  steps: DerivedNote[];
  commaCents: number;
}

// ── Constants ────────────────────────────────────────────────────────────

export const GENERATOR_PRESETS: Record<GeneratorPreset, GeneratorConfig> = {
  fifths: {
    name: 'Perfect Fifths',
    ratio: [3, 2],
    cents: 1200 * Math.log2(3 / 2),   // ~701.955
    family: 'fifth',
  },
  thirds: {
    name: 'Major Thirds',
    ratio: [5, 4],
    cents: 1200 * Math.log2(5 / 4),   // ~386.314
    family: 'third',
  },
  sevenths: {
    name: 'Harmonic Sevenths',
    ratio: [7, 4],
    cents: 1200 * Math.log2(7 / 4),   // ~968.826
    family: 'seventh',
  },
};

// ── Functions ────────────────────────────────────────────────────────────

export function getDerivedNote(
  step: number,
  generatorCents: number,
  fundamentalHz: number,
  fundamentalPitchClass: number,
  divisions: number = 12,
): DerivedNote {
  const totalCents = step * generatorCents;
  const centsInOctave = ((totalCents % 1200) + 1200) % 1200;
  const centsPerStep = 1200 / divisions;
  const nearestETStep = Math.round(centsInOctave / centsPerStep) % divisions;
  const centsDeviation = centsInOctave - nearestETStep * centsPerStep;

  let nearestNoteName: string;
  if (divisions === 12) {
    const absolutePc = (fundamentalPitchClass + nearestETStep) % 12;
    const preferSharps = usesSharps(absolutePc);
    nearestNoteName = noteName(absolutePc, preferSharps);
  } else {
    nearestNoteName = `Step ${nearestETStep}`;
  }

  // Frequency: octave-reduce to one octave above fundamental
  const frequency = fundamentalHz * Math.pow(2, centsInOctave / 1200);

  // Angle: 0 cents = 12 o'clock (top), clockwise ascending
  const angleDeg = (centsInOctave / 1200) * 360;

  return {
    step,
    totalCents,
    centsInOctave,
    nearestETStep,
    nearestNoteName,
    centsDeviation,
    frequency,
    angleDeg,
  };
}

export function getDerivation(
  preset: GeneratorPreset,
  fundamentalHz: number,
  pitchClass: number,
  steps: number,
  divisions: number = 12,
): DerivationResult {
  const generator = GENERATOR_PRESETS[preset];
  const derivedSteps: DerivedNote[] = [];

  for (let i = 0; i < steps; i++) {
    derivedSteps.push(getDerivedNote(i, generator.cents, fundamentalHz, pitchClass, divisions));
  }

  // Comma: where the chain "should" return to 0 after `steps` stacked intervals
  const returnCents = (steps * generator.cents) % 1200;
  const commaCents = returnCents > 600 ? returnCents - 1200 : returnCents;

  return {
    generator,
    fundamentalHz,
    fundamentalPitchClass: pitchClass,
    steps: derivedSteps,
    commaCents,
  };
}

// ── Ring geometry helpers ────────────────────────────────────────────────

export function getRingPoint(
  centsInOctave: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } {
  const angle = (centsInOctave / 1200) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export interface ETRingPosition {
  step: number;
  noteName: string;
  x: number;
  y: number;
  angleDeg: number;
  cents: number;
}

export function getETRingPositions(
  cx: number,
  cy: number,
  radius: number,
  fundamentalPitchClass: number,
  divisions: number = 12,
): ETRingPosition[] {
  const positions: ETRingPosition[] = [];
  const centsPerStep = 1200 / divisions;

  for (let i = 0; i < divisions; i++) {
    const cents = i * centsPerStep;
    const pt = getRingPoint(cents, cx, cy, radius);

    let label: string;
    if (divisions === 12) {
      const pc = (fundamentalPitchClass + i) % 12;
      const preferSharps = usesSharps(pc);
      label = noteName(pc, preferSharps);
    } else {
      label = `${i}`;
    }

    positions.push({
      step: i,
      noteName: label,
      x: pt.x,
      y: pt.y,
      angleDeg: (cents / 1200) * 360,
      cents,
    });
  }

  return positions;
}
