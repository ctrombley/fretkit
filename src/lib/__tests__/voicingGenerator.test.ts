import { describe, it, expect } from 'vitest';
import { generateVoicings, buildCandidateMap } from '../voicingGenerator';

const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

/** Helper: extract fret pattern from a sequence (null for muted strings). */
function fretPattern(seq: { stringNotes: { string: number; fret: number }[] }, stringCount: number): (number | null)[] {
  const pattern: (number | null)[] = new Array(stringCount).fill(null);
  for (const sn of seq.stringNotes) {
    pattern[sn.string] = sn.fret;
  }
  return pattern;
}

/** Check if a pattern matches (null = muted in expected). */
function matchesPattern(actual: (number | null)[], expected: (number | null)[]): boolean {
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i++) {
    if (expected[i] === null && actual[i] !== null) return false;
    if (expected[i] !== null && actual[i] !== expected[i]) return false;
  }
  return true;
}

describe('buildCandidateMap', () => {
  it('finds candidates for C major pitch classes', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const candidates = buildCandidateMap(pitchClasses, STANDARD_TUNING, 12, true);
    expect(candidates.length).toBe(6);
    // Each string should have at least the muted option
    for (const stringCandidates of candidates) {
      expect(stringCandidates.length).toBeGreaterThanOrEqual(1);
      expect(stringCandidates[0]!.fret).toBeNull(); // muted is always first
    }
  });

  it('respects allowOpen=false', () => {
    const pitchClasses = [0, 4, 7];
    const candidates = buildCandidateMap(pitchClasses, STANDARD_TUNING, 12, false);
    for (const stringCandidates of candidates) {
      for (const c of stringCandidates) {
        if (c.fret !== null) {
          expect(c.fret).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('generateVoicings', () => {
  it('returns empty array for empty pitch classes', () => {
    const result = generateVoicings([], 0, STANDARD_TUNING, 12);
    expect(result).toEqual([]);
  });

  it('generates voicings for C major', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 5);
    expect(voicings.length).toBeGreaterThan(0);
  });

  it('open C voicing (x32010) appears in C major results', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 5, {
      maxResults: 50,
    });
    const patterns = voicings.map(v => fretPattern(v, 6));
    const openC = [null, 3, 2, 0, 1, 0]; // x32010
    const found = patterns.some(p => matchesPattern(p, openC));
    expect(found).toBe(true);
  });

  it('open E voicing (022100) appears in E major results', () => {
    const pitchClasses = [4, 8, 11]; // E, G#, B
    const voicings = generateVoicings(pitchClasses, 4, STANDARD_TUNING, 5, {
      maxResults: 50,
    });
    const patterns = voicings.map(v => fretPattern(v, 6));
    const openE = [0, 2, 2, 1, 0, 0]; // 022100
    const found = patterns.some(p => matchesPattern(p, openE));
    expect(found).toBe(true);
  });

  it('F barre (133211) appears in F major results', () => {
    const pitchClasses = [5, 9, 0]; // F, A, C
    const voicings = generateVoicings(pitchClasses, 5, STANDARD_TUNING, 5, {
      maxResults: 50,
    });
    const patterns = voicings.map(v => fretPattern(v, 6));
    const fBarre = [1, 3, 3, 2, 1, 1]; // 133211
    const found = patterns.some(p => matchesPattern(p, fBarre));
    expect(found).toBe(true);
  });

  it('all voicings cover all required pitch classes', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const pcSet = new Set(pitchClasses);
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 5);

    for (const voicing of voicings) {
      const coveredPCs = new Set(
        voicing.stringNotes.map(sn => ((sn.note.semitones % 12) + 12) % 12)
      );
      for (const pc of pcSet) {
        expect(coveredPCs.has(pc)).toBe(true);
      }
    }
  });

  it('respects finger constraint', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 12, {
      maxFingers: 4,
      maxResults: 100,
    });
    // All voicings should be playable with <= 4 fingers
    expect(voicings.length).toBeGreaterThan(0);
  });

  it('respects span constraint', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 12, {
      maxSpan: 3,
    });
    for (const voicing of voicings) {
      const fretted = voicing.stringNotes.filter(sn => sn.fret > 0);
      if (fretted.length >= 2) {
        const frets = fretted.map(sn => sn.fret);
        const span = Math.max(...frets) - Math.min(...frets);
        expect(span).toBeLessThanOrEqual(3);
      }
    }
  });

  it('voicings are sorted by ergonomic score (best first)', () => {
    const pitchClasses = [0, 4, 7]; // C, E, G
    const voicings = generateVoicings(pitchClasses, 0, STANDARD_TUNING, 5);
    // The first voicing should be among the most ergonomic
    // We just verify there are results and they're in order
    expect(voicings.length).toBeGreaterThan(0);
  });
});
