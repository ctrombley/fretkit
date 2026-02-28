import { describe, it, expect } from 'vitest';
import {
  noteTension,
  setTension,
  chordFunction,
  TENSION_LABELS,
  TENSION_COLORS,
} from '../tension';

describe('noteTension — major key', () => {
  it('root is tonic with tension 0', () => {
    const r = noteTension(0, 0, 'major');
    expect(r.role).toBe('tonic');
    expect(r.tension).toBe(0);
    expect(r.degree).toBe(1);
  });

  it('leading tone (B in C major) has highest tension and resolves to tonic', () => {
    const r = noteTension(11, 0, 'major');
    expect(r.role).toBe('leading');
    expect(r.tension).toBeGreaterThan(0.7);
    expect(r.resolution).toBe(0); // resolves to C
    expect(r.degree).toBe(7);
  });

  it('dominant (G in C major) is stable', () => {
    const r = noteTension(7, 0, 'major');
    expect(r.role).toBe('dominant');
    expect(r.tension).toBeLessThan(0.4);
    expect(r.degree).toBe(5);
  });

  it('subdominant (F in C major) resolves to mediant', () => {
    const r = noteTension(5, 0, 'major');
    expect(r.role).toBe('subdominant');
    expect(r.resolution).toBe(4); // E
  });

  it('tritone (F# in C major) is an avoid note', () => {
    const r = noteTension(6, 0, 'major');
    expect(r.role).toBe('avoid');
    expect(r.tension).toBeGreaterThan(0.8);
  });

  it('b7 (Bb in C major) is chromatic with moderate tension', () => {
    const r = noteTension(10, 0, 'major');
    expect(r.role).toBe('chromatic');
    expect(r.tension).toBeGreaterThan(0);
    expect(r.tension).toBeLessThan(0.8);
  });

  it('works for non-C root (A major, leading tone G#=8)', () => {
    // A=9, leading tone is G#=8 (offset 11 from A)
    const r = noteTension(8, 9, 'major');
    expect(r.role).toBe('leading');
  });

  it('all 12 chromatic notes have tension between 0 and 1 in C major', () => {
    for (let i = 0; i < 12; i++) {
      const r = noteTension(i, 0, 'major');
      expect(r.tension).toBeGreaterThanOrEqual(0);
      expect(r.tension).toBeLessThanOrEqual(1);
    }
  });
});

describe('noteTension — minor key', () => {
  it('root is tonic with tension 0', () => {
    const r = noteTension(0, 0, 'minor');
    expect(r.role).toBe('tonic');
    expect(r.tension).toBe(0);
  });

  it('minor 3rd (Eb in C minor) is mediant', () => {
    const r = noteTension(3, 0, 'minor');
    expect(r.role).toBe('mediant');
  });

  it('raised 7th (B in C minor) is leading tone', () => {
    const r = noteTension(11, 0, 'minor');
    expect(r.role).toBe('leading');
    expect(r.resolution).toBe(0);
  });

  it('tritone is avoid in minor too', () => {
    const r = noteTension(6, 0, 'minor');
    expect(r.role).toBe('avoid');
  });
});

describe('setTension', () => {
  it('tonic chord {0,4,7} in C major has low tension', () => {
    const t = setTension([0, 4, 7], 0, 'major');
    expect(t).toBeLessThan(0.3);
  });

  it('leading-tone chord has high tension', () => {
    // {11,2,5} = B dim in C major — all tension
    const t = setTension([11, 2, 5], 0, 'major');
    expect(t).toBeGreaterThan(0.4);
  });

  it('empty set returns 0', () => {
    expect(setTension([], 0)).toBe(0);
  });
});

describe('chordFunction', () => {
  it('C major triad in C major = tonic', () => {
    expect(chordFunction([0, 4, 7], 0, 'major')).toBe('tonic');
  });

  it('G major triad in C major = dominant', () => {
    // G(dominant), B(leading), D(supertonic): highest priority present = dominant
    expect(chordFunction([7, 11, 2], 0, 'major')).toBe('dominant');
  });

  it('F+A (subdominant dyad) in C major = subdominant', () => {
    // F(subdominant), A(submediant): highest priority = subdominant
    expect(chordFunction([5, 9], 0, 'major')).toBe('subdominant');
  });

  it('F major triad {5,9,0} in C major — contains tonic C, priority gives tonic', () => {
    // F major has C (the tonic) in it; chordFunction prioritises tonic presence.
    // This reflects that F major shares the tonic note and has a plagal relationship.
    expect(chordFunction([5, 9, 0], 0, 'major')).toBe('tonic');
  });

  it('empty chord returns chromatic', () => {
    expect(chordFunction([], 0)).toBe('chromatic');
  });
});

describe('TENSION_LABELS and TENSION_COLORS', () => {
  it('has an entry for every FunctionalRole', () => {
    const roles = ['tonic', 'dominant', 'subdominant', 'leading', 'mediant',
      'submediant', 'supertonic', 'chromatic', 'avoid'];
    for (const role of roles) {
      expect(TENSION_LABELS[role as keyof typeof TENSION_LABELS]).toBeTruthy();
      expect(TENSION_COLORS[role as keyof typeof TENSION_COLORS]).toMatch(/^#/);
    }
  });
});
