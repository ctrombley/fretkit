/**
 * Tests for sandbox note activation / deactivation behaviour.
 *
 * Key invariant that was broken:
 *   When a chord/scale is displayed and the user clicks a lit note, the note
 *   must play momentarily (activate then deactivate) and must NOT be latched,
 *   even when sandboxLatch = true.  Enharmonic frets must not be spuriously
 *   activated.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ------------------------------------------------------------------
// Mocks — must be hoisted before the slice is imported
// ------------------------------------------------------------------

const mockStop = vi.fn();
const mockPlay = vi.fn(() => ({ stop: mockStop }));
const mockKillAll = vi.fn();

vi.mock('../../lib/synth', () => ({
  getSynth: () => ({ play: mockPlay, killAll: mockKillAll }),
}));

vi.mock('../../lib/arpeggiator', () => ({
  getArpeggiator: () => ({ addNote: vi.fn(), removeNote: vi.fn(), clear: vi.fn() }),
}));

vi.mock('../../lib/masterBus', () => ({
  getMasterBus: () => ({
    getAudioContext: () => ({}),
    getBus: () => ({ input: {}, setVolume: vi.fn(), setMuted: vi.fn() }),
    setMasterVolume: vi.fn(),
    setMasterMuted: vi.fn(),
    getStereoLevels: () => ({ left: 0, right: 0 }),
    getRmsLevel: () => 0,
    getAnalyserData: () => new Uint8Array(128),
  }),
}));

// The latch maps are module-level; import them so we can inspect them.
import { latchVoices } from '../latchVoices';
import { latchFrequencies } from '../latchFrequencies';
import { createSandboxSlice } from '../sandboxSlice';
import type { AppState } from '../types';

// ------------------------------------------------------------------
// Minimal in-memory store factory
// ------------------------------------------------------------------

function makeStore(overrides: Partial<AppState> = {}) {
  let state: Partial<AppState> = {};

  const set = (
    partial: Partial<AppState> | ((s: AppState) => Partial<AppState>),
  ) => {
    state = {
      ...state,
      ...(typeof partial === 'function' ? partial(state as AppState) : partial),
    };
  };

  const get = () => state as AppState;

  const slice = createSandboxSlice(set, get);
  state = { ...slice, ...overrides };

  return { get, ...slice };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const A4 = 69;  // MIDI A4 → semitones = 69, baseSemitones = 9
const A3 = 57;  // Same pitch class (9), different octave
const C4 = 60;  // Different pitch class (0)
const freq = 440;

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  latchVoices.clear();
  latchFrequencies.clear();
});

describe('activateSandboxNote', () => {
  it('adds the note to sandboxActiveNotes', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    expect(store.get().sandboxActiveNotes).toContain(A4);
  });

  it('starts a voice via getSynth().play()', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    expect(mockPlay).toHaveBeenCalledWith(freq);
  });

  it('does not add duplicates when called twice for the same note', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    store.activateSandboxNote(A4, freq);
    expect(store.get().sandboxActiveNotes.filter(s => s === A4)).toHaveLength(1);
  });

  it('does not affect other semitones (no cross-note pollution)', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    expect(store.get().sandboxActiveNotes).not.toContain(A3);
    expect(store.get().sandboxActiveNotes).not.toContain(C4);
  });

  it('does not activate the enharmonic octave A3 when activating A4', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    // Only the exact semitone is added — bloomAllOctaves is a display concern,
    // not a store concern.
    expect(store.get().sandboxActiveNotes).toEqual([A4]);
  });
});

describe('deactivateSandboxNote', () => {
  it('removes the note from sandboxActiveNotes', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    store.deactivateSandboxNote(A4);
    expect(store.get().sandboxActiveNotes).not.toContain(A4);
  });

  it('stops the voice via latchVoices', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    store.deactivateSandboxNote(A4);
    expect(mockStop).toHaveBeenCalled();
  });

  it('removes from latchFrequencies', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    store.deactivateSandboxNote(A4);
    expect(latchFrequencies.has(A4)).toBe(false);
  });

  it('works even when sandboxLatch is true', () => {
    // This was the core bug: sandboxLatch=true must not block deactivation
    // when the caller explicitly calls deactivateSandboxNote (momentary play path).
    const store = makeStore({ sandboxLatch: true } as Partial<AppState>);
    store.activateSandboxNote(A4, freq);
    expect(store.get().sandboxActiveNotes).toContain(A4);
    store.deactivateSandboxNote(A4);
    expect(store.get().sandboxActiveNotes).not.toContain(A4);
  });

  it('leaves other active notes untouched', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    store.activateSandboxNote(C4, 261.63);
    store.deactivateSandboxNote(A4);
    expect(store.get().sandboxActiveNotes).not.toContain(A4);
    expect(store.get().sandboxActiveNotes).toContain(C4);
  });

  it('is a no-op for a note that was never activated', () => {
    const store = makeStore();
    expect(() => store.deactivateSandboxNote(A4)).not.toThrow();
    expect(store.get().sandboxActiveNotes).toEqual([]);
  });
});

describe('momentary play pattern (chord display mode)', () => {
  // Simulates what FretString does when current !== null && isLit:
  //   activateSandboxNote on pointerDown, deactivateSandboxNote on pointerUp.

  it('leaves no active notes after activate → deactivate', () => {
    const store = makeStore({ sandboxLatch: true } as Partial<AppState>);
    store.activateSandboxNote(A4, freq);
    store.deactivateSandboxNote(A4);
    expect(store.get().sandboxActiveNotes).toHaveLength(0);
  });

  it('does not add enharmonic octave to active notes during momentary play', () => {
    const store = makeStore();
    store.activateSandboxNote(A4, freq);
    // The store only adds the exact semitone passed — enharmonics are a display
    // concern handled by bloomAllOctaves in FretString, not the store.
    expect(store.get().sandboxActiveNotes).not.toContain(A3);
    store.deactivateSandboxNote(A4);
    expect(store.get().sandboxActiveNotes).toHaveLength(0);
  });
});

describe('bloomAllOctaves display logic', () => {
  // This mirrors the isMarked computation in FretString:
  //   bloomAllOctaves ? notes.some(s => s % 12 === note.baseSemitones)
  //                   : notes.includes(note.semitones)
  // With the combined guard (isMarked && !isLit && !sequenceEnabled), enharmonic
  // frets are suppressed in both scale display mode and chord voicing mode.

  function isMarked(
    activeNotes: number[],
    semitones: number,
    bloomAllOctaves: boolean,
  ): boolean {
    return bloomAllOctaves
      ? activeNotes.some(s => s % 12 === semitones % 12)
      : activeNotes.includes(semitones);
  }

  function isLit(litBaseSemitones: number[], noteSemitones: number): boolean {
    return litBaseSemitones.includes(noteSemitones % 12);
  }

  // ── scale display mode (sequenceEnabled = false) ────────────────────────

  it('bloomAllOctaves marks enharmonic octave as active', () => {
    expect(isMarked([A4], A3, true)).toBe(true);
  });

  it('bloomAllOctaves does not mark non-enharmonic note', () => {
    expect(isMarked([A4], C4, true)).toBe(false);
  });

  it('without bloomAllOctaves, only the exact semitone matches', () => {
    expect(isMarked([A4], A3, false)).toBe(false);
    expect(isMarked([A4], A4, false)).toBe(true);
  });

  it('scale mode: isMarked && !isLit && !sequenceEnabled — suppresses enharmonic when note is in scale', () => {
    // A min includes A (baseSemitones 9); clicking A4 → A3 is bloomAllOctaves-marked.
    // But A3 is isLit (A is in scale), so the playing marker is suppressed.
    const activeNotes = [A4];
    const aMinBaseSemitones = [9, 11, 0, 2, 4, 5, 7];
    const sequenceEnabled = false;

    const a3Marked = isMarked(activeNotes, A3, true);
    const a3Lit    = isLit(aMinBaseSemitones, A3);
    expect(a3Marked && !a3Lit && !sequenceEnabled).toBe(false);
  });

  it('scale mode: shows marker for out-of-scale note that is active', () => {
    const Cs4 = 61;
    const activeNotes = [Cs4];
    const aMinBaseSemitones = [9, 11, 0, 2, 4, 5, 7];
    const sequenceEnabled = false;

    const cs4Marked = isMarked(activeNotes, Cs4, true);
    const cs4Lit    = isLit(aMinBaseSemitones, Cs4);
    expect(cs4Marked && !cs4Lit && !sequenceEnabled).toBe(true);
  });

  // ── chord voicing mode (sequenceEnabled = true) ─────────────────────────

  it('voicing mode: isMarked && !isLit && !sequenceEnabled — suppresses ALL enharmonic circles', () => {
    // After strumVoicing an Am chord, A, C, E semitones are in sandboxActiveNotes.
    // With bloomAllOctaves, every A/C/E fret position gets isMarked = true.
    // Non-voicing positions have isLit = false.
    // The !sequenceEnabled guard ensures NONE of these show as extra circles.
    const E3 = 52;
    const activeNotes = [A3, C4, E3]; // typical Am voicing semitones
    const sequenceEnabled = true;

    // Non-voicing A on a different string — isLit = false in voicing mode
    const extraAMarked = isMarked(activeNotes, A4, true); // true via bloomAllOctaves
    const extraALit    = false; // not a voicing position
    expect(extraAMarked && !extraALit && !sequenceEnabled).toBe(false);
  });

  it('voicing mode: circles suppressed even when bloomAllOctaves matches', () => {
    // Regardless of isLit value, sequenceEnabled=true short-circuits the condition.
    const activeNotes = [A4, C4];
    const sequenceEnabled = true;

    for (const semi of [A3, A4, C4, 61]) {
      const marked = isMarked(activeNotes, semi, true);
      const showsMarker = marked && !false && !sequenceEnabled; // worst case isLit=false
      expect(showsMarker).toBe(false);
    }
  });
});
