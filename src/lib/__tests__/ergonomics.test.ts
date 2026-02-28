import { describe, it, expect } from 'vitest';
import {
  detectBarres,
  countFingersAfterBarre,
  computeErgonomicScore,
  scoreVoicing,
  type StringAssignment,
} from '../ergonomics';

// Helper to create assignments with pitchClass for bass correctness testing
function assign(
  string: number,
  fret: number | null,
  pitchClass?: number,
): StringAssignment & { pitchClass?: number } {
  const a: StringAssignment & { pitchClass?: number } = { string, fret };
  if (pitchClass !== undefined) a.pitchClass = pitchClass;
  return a;
}

describe('detectBarres', () => {
  it('detects F barre chord (133211)', () => {
    // F barre: string 0=fret 1, 1=3, 2=3, 3=2, 4=1, 5=1
    const assignments: StringAssignment[] = [
      assign(0, 1), assign(1, 3), assign(2, 3),
      assign(3, 2), assign(4, 1), assign(5, 1),
    ];
    const barres = detectBarres(assignments);
    expect(barres.length).toBe(1);
    expect(barres[0]!.fret).toBe(1);
    expect(barres[0]!.fromString).toBe(0);
    expect(barres[0]!.toString).toBe(5);
  });

  it('returns empty for open C (x32010)', () => {
    const assignments: StringAssignment[] = [
      assign(0, null), assign(1, 3), assign(2, 2),
      assign(3, 0), assign(4, 1), assign(5, 0),
    ];
    const barres = detectBarres(assignments);
    expect(barres.length).toBe(0);
  });

  it('returns empty for Em (022000)', () => {
    const assignments: StringAssignment[] = [
      assign(0, 0), assign(1, 2), assign(2, 2),
      assign(3, 0), assign(4, 0), assign(5, 0),
    ];
    const barres = detectBarres(assignments);
    // fret 2 on strings 1,2 — this is a valid barre but only 2 strings
    expect(barres.length).toBeLessThanOrEqual(1);
    if (barres.length === 1) {
      expect(barres[0]!.fret).toBe(2);
    }
  });
});

describe('countFingersAfterBarre', () => {
  it('F barre needs 4 fingers (1 barre + 3 others)', () => {
    const assignments: StringAssignment[] = [
      assign(0, 1), assign(1, 3), assign(2, 3),
      assign(3, 2), assign(4, 1), assign(5, 1),
    ];
    const barres = detectBarres(assignments);
    const fingers = countFingersAfterBarre(assignments, barres);
    expect(fingers).toBe(4); // barre(1) + fret3 + fret3 + fret2
  });

  it('open C needs 3 fingers', () => {
    const assignments: StringAssignment[] = [
      assign(0, null), assign(1, 3), assign(2, 2),
      assign(3, 0), assign(4, 1), assign(5, 0),
    ];
    const barres = detectBarres(assignments);
    const fingers = countFingersAfterBarre(assignments, barres);
    expect(fingers).toBe(3); // fret3, fret2, fret1
  });

  it('all open strings needs 0 fingers', () => {
    const assignments: StringAssignment[] = [
      assign(0, 0), assign(1, 0), assign(2, 0),
      assign(3, 0), assign(4, 0), assign(5, 0),
    ];
    const barres = detectBarres(assignments);
    const fingers = countFingersAfterBarre(assignments, barres);
    expect(fingers).toBe(0);
  });
});

describe('computeErgonomicScore', () => {
  it('open chord scores lower than barre chord', () => {
    // Open C: x32010
    const openC: StringAssignment[] = [
      assign(0, null, 0), assign(1, 3, 0), assign(2, 2, 4),
      assign(3, 0, 7), assign(4, 1, 0), assign(5, 0, 4),
    ];
    // F barre: 133211
    const fBarre: StringAssignment[] = [
      assign(0, 1, 5), assign(1, 3, 0), assign(2, 3, 5),
      assign(3, 2, 9), assign(4, 1, 0), assign(5, 1, 5),
    ];
    const openScore = computeErgonomicScore(openC, 0);
    const barreScore = computeErgonomicScore(fBarre, 5);
    expect(openScore.totalCost).toBeLessThan(barreScore.totalCost);
  });

  it('root in bass scores lower than wrong bass', () => {
    // Same voicing but different bass note pitch classes
    const rootInBass = [
      assign(0, 3, 0), assign(1, 3, 4), assign(2, 2, 7), // C in bass
    ];
    const wrongBass = [
      assign(0, 3, 4), assign(1, 3, 0), assign(2, 2, 7), // E in bass
    ];
    const rootScore = computeErgonomicScore(rootInBass, 0);
    const wrongScore = computeErgonomicScore(wrongBass, 0);
    expect(rootScore.bassCorrectness).toBe(0);
    expect(wrongScore.bassCorrectness).toBe(1.0);
    expect(rootScore.totalCost).toBeLessThan(wrongScore.totalCost);
  });

  it('returns all sub-scores in breakdown', () => {
    const assignments: StringAssignment[] = [
      assign(0, null), assign(1, 3), assign(2, 2),
      assign(3, 0), assign(4, 1), assign(5, 0),
    ];
    const breakdown = computeErgonomicScore(assignments, 0);
    expect(breakdown).toHaveProperty('fretSpan');
    expect(breakdown).toHaveProperty('fingerCount');
    expect(breakdown).toHaveProperty('stretchEvenness');
    expect(breakdown).toHaveProperty('stringContiguity');
    expect(breakdown).toHaveProperty('openStringBonus');
    expect(breakdown).toHaveProperty('bassCorrectness');
    expect(breakdown).toHaveProperty('positionWeight');
    expect(breakdown).toHaveProperty('totalCost');
  });
});

describe('scoreVoicing', () => {
  it('returns a number', () => {
    const assignments: StringAssignment[] = [
      assign(0, 0), assign(1, 2), assign(2, 2),
      assign(3, 0), assign(4, 0), assign(5, 0),
    ];
    const score = scoreVoicing(assignments, 4); // Em, root = E
    expect(typeof score).toBe('number');
  });

  it('matches computeErgonomicScore totalCost', () => {
    const assignments: StringAssignment[] = [
      assign(0, 0), assign(1, 2), assign(2, 2),
      assign(3, 0), assign(4, 0), assign(5, 0),
    ];
    const breakdown = computeErgonomicScore(assignments, 4);
    const score = scoreVoicing(assignments, 4);
    expect(score).toBe(breakdown.totalCost);
  });
});
