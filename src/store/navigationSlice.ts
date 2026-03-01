import type { View } from '../types';
import { getSynth } from '../lib/synth';
import { synthParamsToStoreState, gatherSynthParams } from '../lib/synthUtils';
import type { AppState, StoreSet, StoreGet } from './types';

export const NAVIGATION_PERSISTED_KEYS: (keyof AppState)[] = ['view'];

const SYNTH_BUS_MAP: Partial<Record<string, string>> = {
  sandbox: 'sandbox',
  songList: 'songs',
  songDetail: 'songs',
  synth: 'synth',
};

export function createNavigationSlice(set: StoreSet, get: StoreGet) {
  return {
    view: { name: 'sandbox' } as View,

    navigate: (view: View) => {
      const state = get();
      const leavingSynth = state.view.name === 'synth';
      const enteringSynth = view.name === 'synth';

      const targetBusId = SYNTH_BUS_MAP[view.name];
      if (targetBusId) getSynth().setOutputBus(targetBusId);

      const updates: Partial<AppState> = { view, activeSongChordId: null };

      if (!leavingSynth) {
        updates.viewSynthSnapshots = {
          ...state.viewSynthSnapshots,
          [state.view.name]: {
            params: gatherSynthParams(state),
            presetIndex: state.synthActivePresetIndex,
          },
        };
      }

      const snapshots = updates.viewSynthSnapshots ?? state.viewSynthSnapshots;
      const targetSnap = snapshots[view.name];
      if (!enteringSynth && targetSnap) {
        Object.assign(updates, synthParamsToStoreState(targetSnap.params));
        updates.synthActivePresetIndex = targetSnap.presetIndex;
        const synth = getSynth();
        synth.resetLfoBase(1);
        synth.resetLfoBase(2);
        synth.updateParams(targetSnap.params);
      }

      set(updates as Partial<AppState>);
    },
  };
}
