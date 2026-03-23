import type { OscWaveform, SynthParams, LfoWaveform, LfoTargetParam } from '../lib/synth';
import { getSynth } from '../lib/synth';
import { getEngineForFretboard } from '../lib/fretboardEngines';
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
      const state = get();
      const fbId = state.settings.settingsId;
      // Update global store state (drives SynthView UI)
      set({ [storeKey]: value, synthActivePresetIndex: null } as Partial<AppState>);
      // Update the settings fretboard's own engine + persisted synthParams
      const entry = getEngineForFretboard(fbId);
      entry.synth.updateParams({ [key]: value });
      set((s: AppState) => ({
        fretboards: {
          ...s.fretboards,
          [fbId]: {
            ...s.fretboards[fbId]!,
            synthParams: { ...s.fretboards[fbId]!.synthParams, [key]: value },
          },
        },
      }));
      // Also keep global synth in sync (used by drone, arp timing)
      getSynth().updateParams({ [key]: value });
    },

    setSynthKeyboardMode: (mode: 'classic' | 'isomorphic') => set({ synthKeyboardMode: mode }),

    setSynthLfoTarget: (lfo: 1 | 2, target: LfoTargetParam) => {
      const state = get();
      const fbId = state.settings.settingsId;
      const entry = getEngineForFretboard(fbId);
      entry.synth.resetLfoBase(lfo);
      const lfoKey = lfo === 1 ? 'lfo1Target' : 'lfo2Target';
      const storeKey = lfo === 1 ? 'synthLfo1Target' : 'synthLfo2Target';
      set({ [storeKey]: target } as Partial<AppState>);
      entry.synth.updateParams({ [lfoKey]: target });
      set((s: AppState) => ({
        fretboards: {
          ...s.fretboards,
          [fbId]: {
            ...s.fretboards[fbId]!,
            synthParams: { ...s.fretboards[fbId]!.synthParams, [lfoKey]: target },
          },
        },
      }));
      // Keep global synth in sync
      const synth = getSynth();
      synth.resetLfoBase(lfo);
      synth.updateParams({ [lfoKey]: target });
      if (target === 'bpm') {
        entry.synth.setBpmBase(state.transportBpm);
        synth.setBpmBase(state.transportBpm);
      }
    },
  };
}
