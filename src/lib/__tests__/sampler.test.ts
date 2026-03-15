/**
 * Tests for SamplerEngine — noteOn, noteOff, pitch shifting, ADSR envelope.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { getSampler, DEFAULT_SAMPLER_PARAMS } from '../sampler';
import type { SamplerParams } from '../sampler';

// ── Web Audio API mock ───────────────────────────────────────────────────────
// mockCtx must be declared before vi.mock (hoisting rule: mock-prefixed vars only).

const mockCtx = {
  currentTime: 0,
  createGain: vi.fn(),
  createBufferSource: vi.fn(),
  createBuffer: vi.fn(),
  decodeAudioData: vi.fn(),
};

vi.mock('../masterBus', () => ({
  getMasterBus: () => ({
    getAudioContext: () => mockCtx,
    getBus: () => ({ input: {} }),
  }),
}));

// ── Fake AudioBuffer used for all tests ─────────────────────────────────────

const FAKE_BUFFER = {
  numberOfChannels: 1,
  length: 44100,
  sampleRate: 44100,
  duration: 1.0,
  getChannelData: () => new Float32Array(44100),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function keyMap(note: number, slotIdx: number): (number | null)[] {
  const m = new Array<number | null>(128).fill(null);
  m[note] = slotIdx;
  return m;
}

function params(overrides?: Partial<SamplerParams>): SamplerParams[] {
  return [{ ...DEFAULT_SAMPLER_PARAMS, ...overrides }];
}

function rootNotes(root: number | null): (number | null)[] {
  return [root];
}

/** Create fresh gain + source mocks and install them as createGain/createBufferSource return values. */
function setupMockNodes() {
  const gain = {
    gain: {
      value: 1,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const source = {
    buffer: null as unknown,
    playbackRate: { value: 1 },
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  mockCtx.createGain.mockReturnValue(gain);
  mockCtx.createBufferSource.mockReturnValue(source);
  return { gain, source };
}

// ── Global setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Load a real-ish buffer into slot 0 so noteOn tests can run.
  mockCtx.decodeAudioData.mockResolvedValue(FAKE_BUFFER);
  mockCtx.createBuffer.mockReturnValue(FAKE_BUFFER);
  await getSampler().loadSample(0, new ArrayBuffer(100));
});

beforeEach(() => {
  getSampler().stopAll(); // clear _activeNotes between tests
  vi.clearAllMocks();
  // Restore implementations cleared by clearAllMocks
  mockCtx.decodeAudioData.mockResolvedValue(FAKE_BUFFER);
  mockCtx.createBuffer.mockReturnValue(FAKE_BUFFER);
});

// ── noteOn: guard conditions ─────────────────────────────────────────────────

describe('noteOn — guard conditions', () => {
  it('does nothing when keyMap has no entry for the note', () => {
    const { gain } = setupMockNodes();
    const emptyMap = new Array<number | null>(128).fill(null);
    getSampler().noteOn(60, 100, emptyMap, params(), rootNotes(60));
    expect(gain.connect).not.toHaveBeenCalled();
  });

  it('does nothing when no buffer is loaded for the mapped slot', () => {
    // Slot 1 has never had a buffer loaded
    const { gain } = setupMockNodes();
    const map = keyMap(60, 1);
    getSampler().noteOn(60, 100, map, params(), rootNotes(60));
    expect(gain.connect).not.toHaveBeenCalled();
  });
});

// ── noteOn: basic playback ────────────────────────────────────────────────────

describe('noteOn — basic playback', () => {
  it('creates a gain node connected to the bus', () => {
    const { gain } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params(), rootNotes(60));
    expect(gain.connect).toHaveBeenCalledWith({} /* bus input */);
  });

  it('creates a source node connected to the gain node', () => {
    const { gain, source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params(), rootNotes(60));
    expect(source.connect).toHaveBeenCalledWith(gain);
  });

  it('calls source.start()', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params(), rootNotes(60));
    expect(source.start).toHaveBeenCalled();
  });
});

// ── noteOn: pitch shifting ────────────────────────────────────────────────────

describe('noteOn — pitch shifting', () => {
  it('sets playbackRate to 1 when midiNote equals rootNote', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(63, 100, keyMap(63, 0), params(), rootNotes(63));
    expect(source.playbackRate.value).toBeCloseTo(1);
  });

  it('shifts up one octave when midiNote is 12 semitones above root', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(75, 100, keyMap(75, 0), params(), rootNotes(63));
    expect(source.playbackRate.value).toBeCloseTo(2);
  });

  it('shifts down one octave when midiNote is 12 semitones below root', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(51, 100, keyMap(51, 0), params(), rootNotes(63));
    expect(source.playbackRate.value).toBeCloseTo(0.5);
  });

  it('falls back to midiNote as root when rootNotes[slot] is null (no pitch shift)', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params(), rootNotes(null));
    // midiNote - midiNote = 0 semitones → rate = 1
    expect(source.playbackRate.value).toBeCloseTo(1);
  });

  it('applies pitchSemitones offset on top of root-note shift', () => {
    const { source } = setupMockNodes();
    // root=60, note=60, pitchSemitones=+12 → rate = 2^(12/12) = 2
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ pitchSemitones: 12 }), rootNotes(60));
    expect(source.playbackRate.value).toBeCloseTo(2);
  });
});

// ── noteOn: ADSR envelope ─────────────────────────────────────────────────────

describe('noteOn — ADSR envelope', () => {
  it('sets gain to peak immediately when attack = 0', () => {
    const { gain } = setupMockNodes();
    // velocity=127 → peak = amplitude * 1 = 1
    getSampler().noteOn(60, 127, keyMap(60, 0), params({ attack: 0 }), rootNotes(60));
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 0); // peak, now
    expect(gain.gain.linearRampToValueAtTime).not.toHaveBeenCalledWith(
      expect.any(Number), expect.any(Number), // attack ramp should NOT exist
    );
  });

  it('ramps from 0 to peak when attack > 0', () => {
    const { gain } = setupMockNodes();
    getSampler().noteOn(60, 127, keyMap(60, 0), params({ attack: 0.1 }), rootNotes(60));
    // Should set to 0 at now, then ramp to peak at now+attack
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 0.1);
  });

  it('scales peak by velocity', () => {
    const { gain } = setupMockNodes();
    // velocity=64 → peak ≈ 0.504
    getSampler().noteOn(60, 64, keyMap(60, 0), params({ attack: 0 }), rootNotes(60));
    const peak = 1 * (64 / 127);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(peak, 3),
      0,
    );
  });

  it('adds decay ramp to sustain level when decay > 0', () => {
    const { gain } = setupMockNodes();
    // attack=0, decay=0.5, sustain=0.5 → ramp to 0.5 * 1 at 0 + 0.5
    getSampler().noteOn(60, 127, keyMap(60, 0), params({ attack: 0, decay: 0.5, sustain: 0.5 }), rootNotes(60));
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.5);
  });

  it('decay ramp target accounts for attack time', () => {
    const { gain } = setupMockNodes();
    // attack=0.2, decay=0.3, sustain=0.6 → ramp to 0.6 at 0.2+0.3=0.5
    getSampler().noteOn(60, 127, keyMap(60, 0), params({ attack: 0.2, decay: 0.3, sustain: 0.6 }), rootNotes(60));
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(0.6, 5),
      expect.closeTo(0.5, 5),
    );
  });

  it('does not add decay ramp when decay = 0', () => {
    const { gain } = setupMockNodes();
    getSampler().noteOn(60, 127, keyMap(60, 0), params({ attack: 0, decay: 0, sustain: 0.5 }), rootNotes(60));
    // Only one call: the setValueAtTime for attack=0 instant peak
    expect(gain.gain.linearRampToValueAtTime).not.toHaveBeenCalled();
  });
});

// ── noteOn: loop and reverse ──────────────────────────────────────────────────

describe('noteOn — loop', () => {
  it('sets source.loop = true when loop param is true', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ loop: true }), rootNotes(60));
    expect(source.loop).toBe(true);
  });

  it('sets loopStart and loopEnd from fractions', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0),
      params({ loop: true, loopStartFraction: 0.2, loopEndFraction: 0.8 }),
      rootNotes(60));
    expect(source.loopStart).toBeCloseTo(0.2); // 0.2 * 1.0s
    expect(source.loopEnd).toBeCloseTo(0.8);   // 0.8 * 1.0s
  });

  it('does not set loop when loop = false', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ loop: false }), rootNotes(60));
    expect(source.loop).toBe(false);
  });
});

describe('noteOn — reverse', () => {
  it('creates a reversed buffer and uses it on the source', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ reverse: true }), rootNotes(60));
    // createBuffer is called to build the reversed copy
    expect(mockCtx.createBuffer).toHaveBeenCalled();
    // The source buffer should be the created reversed buffer
    expect(source.buffer).toBe(FAKE_BUFFER);
  });
});

// ── noteOff ───────────────────────────────────────────────────────────────────

describe('noteOff', () => {
  it('is a no-op when the note is not active', () => {
    // Should not throw
    expect(() => {
      getSampler().noteOff(99, params(), keyMap(99, 0));
    }).not.toThrow();
  });

  it('is a no-op for a non-looping sample with release = 0 (let it play out)', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ loop: false, release: 0 }), rootNotes(60));
    getSampler().noteOff(60, params({ loop: false, release: 0 }), keyMap(60, 0));
    expect(source.stop).not.toHaveBeenCalled();
  });

  it('stops a looping sample immediately when release = 0', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ loop: true, release: 0 }), rootNotes(60));
    getSampler().noteOff(60, params({ loop: true, release: 0 }), keyMap(60, 0));
    expect(source.stop).toHaveBeenCalled();
  });

  it('triggers release ramp and schedules source stop when release > 0', () => {
    const { gain, source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ release: 0.5 }), rootNotes(60));
    getSampler().noteOff(60, params({ release: 0.5 }), keyMap(60, 0));
    // Gain should ramp to 0 at now + release = 0.5
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.5);
    // Source should stop at now + release
    expect(source.stop).toHaveBeenCalledWith(0.5);
  });

  it('applies release to non-looping samples too when release > 0', () => {
    const { source } = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params({ loop: false, release: 0.3 }), rootNotes(60));
    getSampler().noteOff(60, params({ loop: false, release: 0.3 }), keyMap(60, 0));
    expect(source.stop).toHaveBeenCalledWith(0.3);
  });
});

// ── stopAll ───────────────────────────────────────────────────────────────────

describe('stopAll', () => {
  it('stops all active sources', () => {
    const nodes1 = setupMockNodes();
    getSampler().noteOn(60, 100, keyMap(60, 0), params(), rootNotes(60));

    // Second note on a different MIDI note also mapped to slot 0
    const nodes2 = setupMockNodes();
    getSampler().noteOn(62, 100, keyMap(62, 0), params(), rootNotes(60));

    getSampler().stopAll();

    expect(nodes1.source.stop).toHaveBeenCalled();
    expect(nodes2.source.stop).toHaveBeenCalled();
  });

  it('does nothing if no notes are active', () => {
    expect(() => getSampler().stopAll()).not.toThrow();
  });
});

// ── loadSample ────────────────────────────────────────────────────────────────

describe('loadSample', () => {
  it('decodes an ArrayBuffer and stores it as the slot buffer', async () => {
    mockCtx.decodeAudioData.mockResolvedValue(FAKE_BUFFER);
    await getSampler().loadSample(2, new ArrayBuffer(200));
    expect(getSampler().getBuffer(2)).toBe(FAKE_BUFFER);
  });

  it('getBuffer returns null for a slot that has never been loaded', () => {
    expect(getSampler().getBuffer(15)).toBeNull();
  });
});
