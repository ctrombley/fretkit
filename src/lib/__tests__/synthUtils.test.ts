import { describe, it, expect } from 'vitest';
import { lfoFor, formatPan, synthParamsToStoreState, gatherSynthParams, lfoStoreKeys, SYNTH_PARAM_KEYS } from '../synthUtils';
import type { SynthParams } from '../synth';

describe('lfoFor', () => {
  it('returns 1 when t1 matches the param', () => {
    expect(lfoFor('pan', 'pan', null)).toBe(1);
  });

  it('returns 2 when t2 matches the param', () => {
    expect(lfoFor('pan', null, 'pan')).toBe(2);
  });

  it('returns null when neither matches', () => {
    expect(lfoFor('pan', 'reverbSend', 'delaySend')).toBeNull();
  });

  it('prefers LFO 1 when both match', () => {
    expect(lfoFor('pan', 'pan', 'pan')).toBe(1);
  });

  it('handles null targets', () => {
    expect(lfoFor('pan', null, null)).toBeNull();
  });
});

describe('formatPan', () => {
  it('returns C for center values', () => {
    expect(formatPan(0)).toBe('C');
    expect(formatPan(0.04)).toBe('C');
    expect(formatPan(-0.04)).toBe('C');
  });

  it('formats left pan', () => {
    expect(formatPan(-0.5)).toBe('L50');
    expect(formatPan(-1)).toBe('L100');
  });

  it('formats right pan', () => {
    expect(formatPan(0.5)).toBe('R50');
    expect(formatPan(1)).toBe('R100');
  });
});

const sampleParams: SynthParams = {
  waveform: 'sawtooth',
  filterCutoff: 2000,
  filterResonance: 1,
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
  pan: 0,
  reverbSend: 0.15,
  delaySend: 0,
  delayTime: 0.3,
  delayFeedback: 0.4,
  delayPingPong: false,
  masterVolume: 0.5,
  osc2Waveform: 'sine',
  osc2Detune: 0,
  osc2Mix: 0,
  fmMode: false,
  fmDepth: 200,
  lfo1Rate: 2,
  lfo1Depth: 0,
  lfo1Waveform: 'sine',
  lfo1Target: null,
  lfo2Rate: 0.5,
  lfo2Depth: 0,
  lfo2Waveform: 'triangle',
  lfo2Target: null,
};

describe('synthParamsToStoreState / gatherSynthParams', () => {
  it('round-trips params through store state and back', () => {
    const storeState = synthParamsToStoreState(sampleParams);
    const recovered = gatherSynthParams(storeState);
    expect(recovered).toEqual(sampleParams);
  });

  it('produces synth-prefixed keys', () => {
    const storeState = synthParamsToStoreState(sampleParams);
    expect(storeState).toHaveProperty('synthWaveform', 'sawtooth');
    expect(storeState).toHaveProperty('synthFilterCutoff', 2000);
    expect(storeState).toHaveProperty('synthMasterVolume', 0.5);
  });

  it('SYNTH_PARAM_KEYS covers all SynthParams keys', () => {
    expect(SYNTH_PARAM_KEYS.length).toBe(Object.keys(sampleParams).length);
    for (const key of SYNTH_PARAM_KEYS) {
      expect(sampleParams).toHaveProperty(key);
    }
  });
});

describe('lfoStoreKeys', () => {
  it('returns correct keys for LFO 1', () => {
    const keys = lfoStoreKeys(1);
    expect(keys.rateKey).toBe('synthLfo1Rate');
    expect(keys.depthKey).toBe('synthLfo1Depth');
    expect(keys.waveformKey).toBe('synthLfo1Waveform');
    expect(keys.targetKey).toBe('synthLfo1Target');
    expect(keys.bloomKey).toBe('synthLfo1Bloom');
    expect(keys.paramRate).toBe('lfo1Rate');
    expect(keys.paramDepth).toBe('lfo1Depth');
    expect(keys.paramWaveform).toBe('lfo1Waveform');
  });

  it('returns correct keys for LFO 2', () => {
    const keys = lfoStoreKeys(2);
    expect(keys.rateKey).toBe('synthLfo2Rate');
    expect(keys.depthKey).toBe('synthLfo2Depth');
    expect(keys.waveformKey).toBe('synthLfo2Waveform');
    expect(keys.targetKey).toBe('synthLfo2Target');
    expect(keys.bloomKey).toBe('synthLfo2Bloom');
    expect(keys.paramRate).toBe('lfo2Rate');
    expect(keys.paramDepth).toBe('lfo2Depth');
    expect(keys.paramWaveform).toBe('lfo2Waveform');
  });
});
