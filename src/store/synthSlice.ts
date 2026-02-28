import type { OscWaveform, SynthParams, LfoWaveform, LfoTargetParam } from '../lib/synth';
import { getSynth } from '../lib/synth';
import type { AppState, StoreSet, StoreGet } from './types';

export const SYNTH_PERSISTED_KEYS: (keyof AppState)[] = [
  'synthWaveform', 'synthHpCutoff', 'synthHpResonance', 'synthFilterCutoff', 'synthFilterResonance',
  'synthAttack', 'synthDecay', 'synthSustain', 'synthRelease',
  'synthPan', 'synthReverbSend', 'synthDelaySend', 'synthDelayTime', 'synthDelayFeedback', 'synthDelayPingPong',
  'synthMasterVolume', 'synthKeyboardMode',
  'synthOsc2Waveform', 'synthOsc2Detune', 'synthOsc2Mix',
  'synthFmMode', 'synthFmDepth',
  'synthLfo1Rate', 'synthLfo1Depth', 'synthLfo1Waveform', 'synthLfo1Target', 'synthLfo1Bloom',
  'synthLfo2Rate', 'synthLfo2Depth', 'synthLfo2Waveform', 'synthLfo2Target', 'synthLfo2Bloom',
];

export function createSynthSlice(set: StoreSet, get: StoreGet) {
  return {
    synthWaveform: 'sawtooth' as OscWaveform,
    synthHpCutoff: 80,
    synthHpResonance: 0.7,
    synthFilterCutoff: 2000,
    synthFilterResonance: 1,
    synthAttack: 0.01,
    synthDecay: 0.2,
    synthSustain: 0.6,
    synthRelease: 0.3,
    synthPan: 0,
    synthReverbSend: 0.15,
    synthDelaySend: 0,
    synthDelayTime: 0.3,
    synthDelayFeedback: 0.4,
    synthDelayPingPong: false,
    synthMasterVolume: 0.5,
    synthKeyboardMode: 'classic' as const,
    synthOsc2Waveform: 'sine' as OscWaveform,
    synthOsc2Detune: 0,
    synthOsc2Mix: 0,
    synthFmMode: false,
    synthFmDepth: 200,
    synthLfo1Rate: 2,
    synthLfo1Depth: 0,
    synthLfo1Waveform: 'sine' as LfoWaveform,
    synthLfo1Target: null as LfoTargetParam,
    synthLfo1Bloom: true,
    synthLfo2Rate: 0.5,
    synthLfo2Depth: 0,
    synthLfo2Waveform: 'triangle' as LfoWaveform,
    synthLfo2Target: null as LfoTargetParam,
    synthLfo2Bloom: true,

    setSynthParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => {
      const storeKey = `synth${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof AppState;
      set({ [storeKey]: value, synthActivePresetIndex: null } as Partial<AppState>);
      getSynth().updateParams({ [key]: value });
    },

    setSynthKeyboardMode: (mode: 'classic' | 'isomorphic') => set({ synthKeyboardMode: mode }),

    setSynthLfoTarget: (lfo: 1 | 2, target: LfoTargetParam) => {
      const synth = getSynth();
      synth.resetLfoBase(lfo);
      if (lfo === 1) {
        set({ synthLfo1Target: target });
        synth.updateParams({ lfo1Target: target });
      } else {
        set({ synthLfo2Target: target });
        synth.updateParams({ lfo2Target: target });
      }
      if (target === 'bpm') {
        synth.setBpmBase(get().transportBpm);
      }
    },
  };
}
