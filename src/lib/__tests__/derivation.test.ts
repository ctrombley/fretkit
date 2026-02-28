import { describe, it, expect } from 'vitest';
import {
  GENERATOR_PRESETS,
  getDerivedNote,
  getDerivation,
  getRingPoint,
  getETRingPositions,
} from '../derivation';

describe('GENERATOR_PRESETS', () => {
  it('fifths generator is ~701.955 cents', () => {
    expect(GENERATOR_PRESETS.fifths.cents).toBeCloseTo(701.955, 1);
  });

  it('thirds generator is ~386.314 cents', () => {
    expect(GENERATOR_PRESETS.thirds.cents).toBeCloseTo(386.314, 1);
  });

  it('sevenths generator is ~968.826 cents', () => {
    expect(GENERATOR_PRESETS.sevenths.cents).toBeCloseTo(968.826, 1);
  });
});

describe('getDerivedNote', () => {
  const fifthsCents = GENERATOR_PRESETS.fifths.cents;
  const fundHz = 261.63; // ~C4
  const fundPc = 0;      // C

  it('step 0 is root at 0 cents', () => {
    const note = getDerivedNote(0, fifthsCents, fundHz, fundPc);
    expect(note.step).toBe(0);
    expect(note.totalCents).toBeCloseTo(0, 5);
    expect(note.centsInOctave).toBeCloseTo(0, 5);
    expect(note.nearestETStep).toBe(0);
    expect(note.nearestNoteName).toBe('C');
  });

  it('step 1 of fifths = ~701.955 cents, nearest step 7 (G from C)', () => {
    const note = getDerivedNote(1, fifthsCents, fundHz, fundPc);
    expect(note.centsInOctave).toBeCloseTo(701.955, 1);
    expect(note.nearestETStep).toBe(7);
    expect(note.nearestNoteName).toBe('G');
  });

  it('step 2 of fifths = ~203.91 cents (octave-reduced), nearest D', () => {
    const note = getDerivedNote(2, fifthsCents, fundHz, fundPc);
    // 2 * 701.955 = 1403.91 → mod 1200 = 203.91
    expect(note.centsInOctave).toBeCloseTo(203.91, 1);
    expect(note.nearestETStep).toBe(2);
    expect(note.nearestNoteName).toBe('D');
  });

  it('frequency is octave-reduced to one octave above fundamental', () => {
    const note = getDerivedNote(1, fifthsCents, fundHz, fundPc);
    expect(note.frequency).toBeGreaterThanOrEqual(fundHz);
    expect(note.frequency).toBeLessThan(fundHz * 2);
  });

  it('angleDeg is proportional to centsInOctave', () => {
    const note = getDerivedNote(1, fifthsCents, fundHz, fundPc);
    expect(note.angleDeg).toBeCloseTo((701.955 / 1200) * 360, 1);
  });

  it('19-TET: step 1 of fifths snaps to step 11 (nearest to 701.955¢ in 63.16¢ steps)', () => {
    const note = getDerivedNote(1, fifthsCents, fundHz, fundPc, 19);
    // 1200/19 ≈ 63.158, 701.955 / 63.158 ≈ 11.11 → nearest step 11
    expect(note.nearestETStep).toBe(11);
    // Deviation: 701.955 - 11 * 63.158 = 701.955 - 694.737 ≈ 7.22
    expect(note.centsDeviation).toBeCloseTo(7.22, 0);
    expect(note.nearestNoteName).toBe('Step 11');
  });

  it('19-TET: step 0 is root at step 0', () => {
    const note = getDerivedNote(0, fifthsCents, fundHz, fundPc, 19);
    expect(note.nearestETStep).toBe(0);
    expect(note.nearestNoteName).toBe('Step 0');
  });

  it('non-12 divisions show step numbers for note names', () => {
    const note = getDerivedNote(1, fifthsCents, fundHz, fundPc, 31);
    expect(note.nearestNoteName).toMatch(/^Step \d+$/);
  });
});

describe('getDerivation', () => {
  it('12-step fifths derivation covers all 12 pitch classes', () => {
    const result = getDerivation('fifths', 261.63, 0, 12);
    const steps = new Set(result.steps.map(s => s.nearestETStep));
    expect(steps.size).toBe(12);
  });

  it('comma gap for 12 fifths is ~23.46 cents', () => {
    const result = getDerivation('fifths', 261.63, 0, 12);
    expect(result.commaCents).toBeCloseTo(23.46, 0);
  });

  it('returns correct number of steps', () => {
    const result = getDerivation('fifths', 261.63, 0, 7);
    expect(result.steps).toHaveLength(7);
  });

  it('step 0 is always the root', () => {
    const result = getDerivation('thirds', 440, 9, 5);
    expect(result.steps[0]!.centsInOctave).toBeCloseTo(0, 5);
  });

  it('19-TET derivation uses 19 divisions for step snapping', () => {
    const result = getDerivation('fifths', 261.63, 0, 12, 19);
    // Step 1 should snap to ET step 11 in 19-TET
    expect(result.steps[1]!.nearestETStep).toBe(11);
  });
});

describe('getRingPoint', () => {
  const cx = 250, cy = 250, r = 200;

  it('0 cents is at 12 o\'clock (x=cx, y=cy-r)', () => {
    const pt = getRingPoint(0, cx, cy, r);
    expect(pt.x).toBeCloseTo(cx, 1);
    expect(pt.y).toBeCloseTo(cy - r, 1);
  });

  it('600 cents is at 6 o\'clock (x=cx, y=cy+r)', () => {
    const pt = getRingPoint(600, cx, cy, r);
    expect(pt.x).toBeCloseTo(cx, 1);
    expect(pt.y).toBeCloseTo(cy + r, 1);
  });

  it('300 cents is at 3 o\'clock (x=cx+r, y=cy)', () => {
    const pt = getRingPoint(300, cx, cy, r);
    expect(pt.x).toBeCloseTo(cx + r, 1);
    expect(pt.y).toBeCloseTo(cy, 1);
  });
});

describe('getETRingPositions', () => {
  it('returns 12 items for default 12-TET', () => {
    const positions = getETRingPositions(250, 250, 200, 0);
    expect(positions).toHaveLength(12);
  });

  it('first position is the fundamental pitch class', () => {
    const positions = getETRingPositions(250, 250, 200, 0);
    expect(positions[0]!.noteName).toBe('C');
    expect(positions[0]!.step).toBe(0);
  });

  it('12-TET positions are evenly spaced by 30 degrees', () => {
    const positions = getETRingPositions(250, 250, 200, 0);
    for (let i = 0; i < 12; i++) {
      expect(positions[i]!.angleDeg).toBeCloseTo(i * 30, 1);
    }
  });

  it('19-TET returns 19 items', () => {
    const positions = getETRingPositions(250, 250, 200, 0, 19);
    expect(positions).toHaveLength(19);
  });

  it('19-TET positions are evenly spaced by 1200/19 cents', () => {
    const positions = getETRingPositions(250, 250, 200, 0, 19);
    const centsPerStep = 1200 / 19;
    for (let i = 0; i < 19; i++) {
      expect(positions[i]!.cents).toBeCloseTo(i * centsPerStep, 5);
    }
  });

  it('19-TET labels are step numbers', () => {
    const positions = getETRingPositions(250, 250, 200, 0, 19);
    expect(positions[0]!.noteName).toBe('0');
    expect(positions[7]!.noteName).toBe('7');
    expect(positions[18]!.noteName).toBe('18');
  });

  it('53-TET returns 53 items', () => {
    const positions = getETRingPositions(250, 250, 200, 0, 53);
    expect(positions).toHaveLength(53);
  });
});
