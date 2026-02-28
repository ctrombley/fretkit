import type { SynthParams } from '../lib/synth';
import { getSynth } from '../lib/synth';
import { FACTORY_PRESETS, randomizeParams } from '../lib/synthPresets';
import type { SynthPreset } from '../lib/synthPresets';
import { synthParamsToStoreState, gatherSynthParams } from '../lib/synthUtils';
import type { AppState, StoreSet, StoreGet } from './types';

export const SYNTH_PRESETS_PERSISTED_KEYS: (keyof AppState)[] = [
  'synthPresets',
  'viewSynthSnapshots',
];

export function createSynthPresetsSlice(set: StoreSet, get: StoreGet) {
  return {
    synthPresets: [...FACTORY_PRESETS] as SynthPreset[],
    synthActivePresetIndex: null as number | null,
    viewSynthSnapshots: {} as Record<string, { params: SynthParams; presetIndex: number | null }>,

    loadPreset: (index: number) => {
      const state = get();
      const preset = state.synthPresets[index];
      if (!preset) return;
      const storeUpdate = synthParamsToStoreState(preset.params);
      set({ ...storeUpdate, synthActivePresetIndex: index } as Partial<AppState>);
      const synth = getSynth();
      synth.resetLfoBase(1);
      synth.resetLfoBase(2);
      synth.updateParams(preset.params);
    },

    savePreset: (index: number, name: string) => {
      const state = get();
      const params = gatherSynthParams(state);
      const newPreset: SynthPreset = { name, params, isFactory: false };
      const presets = [...state.synthPresets];
      if (index < presets.length) {
        presets[index] = newPreset;
      } else {
        presets.push(newPreset);
      }
      set({ synthPresets: presets, synthActivePresetIndex: index });
    },

    deletePreset: (index: number) => {
      const state = get();
      const preset = state.synthPresets[index];
      if (!preset || preset.isFactory) return;
      const presets = state.synthPresets.filter((_: SynthPreset, i: number) => i !== index);
      const activeIdx = state.synthActivePresetIndex;
      set({
        synthPresets: presets,
        synthActivePresetIndex: activeIdx === index ? null : activeIdx !== null && activeIdx > index ? activeIdx - 1 : activeIdx,
      });
    },

    randomizeSynth: () => {
      const params = randomizeParams();
      const storeUpdate = synthParamsToStoreState(params);
      set({ ...storeUpdate, synthActivePresetIndex: null } as Partial<AppState>);
      const synth = getSynth();
      synth.resetLfoBase(1);
      synth.resetLfoBase(2);
      synth.updateParams(params);
    },
  };
}
