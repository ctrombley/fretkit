import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppState } from './store/types';
import { createSandboxSlice, SANDBOX_PERSISTED_KEYS } from './store/sandboxSlice';
import { createArpSlice, ARP_PERSISTED_KEYS } from './store/arpSlice';
import { createTransportSlice, TRANSPORT_PERSISTED_KEYS } from './store/transportSlice';
import { createSynthSlice, SYNTH_PERSISTED_KEYS } from './store/synthSlice';
import { createSynthPresetsSlice, SYNTH_PRESETS_PERSISTED_KEYS } from './store/synthPresetsSlice';
import { createViewsSlice } from './store/viewsSlice';
import { createNavigationSlice } from './store/navigationSlice';
import { createSongsSlice, SONGS_PERSISTED_KEYS } from './store/songsSlice';
import { createBusSlice, BUS_PERSISTED_KEYS } from './store/busSlice';
import { createMidiSlice, MIDI_PERSISTED_KEYS } from './store/midiSlice';
import { getMasterBus } from './lib/masterBus';

export type { AppState, FretboardState, Settings } from './store/types';

const ALL_PERSISTED_KEYS: (keyof AppState)[] = [
  ...SANDBOX_PERSISTED_KEYS,
  ...ARP_PERSISTED_KEYS,
  ...TRANSPORT_PERSISTED_KEYS,
  ...SYNTH_PERSISTED_KEYS,
  ...SYNTH_PRESETS_PERSISTED_KEYS,
  ...SONGS_PERSISTED_KEYS,
  ...BUS_PERSISTED_KEYS,
  ...MIDI_PERSISTED_KEYS,
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSandboxSlice(set, get),
      ...createArpSlice(set, get),
      ...createTransportSlice(set),
      ...createSynthSlice(set, get),
      ...createSynthPresetsSlice(set, get),
      ...createViewsSlice(set),
      ...createNavigationSlice(set, get),
      ...createSongsSlice(set, get),
      ...createBusSlice(set),
      ...createMidiSlice(set),
    }),
    {
      name: 'fretkit-storage',
      version: 2,
      migrate: (persisted, version) => {
        // v1 → v2: add bus/midi defaults to existing state
        if (version < 2) {
          return { ...(persisted as object) };
        }
        return persisted as AppState;
      },
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partial: Record<string, any> = {};
        for (const key of ALL_PERSISTED_KEYS) {
          partial[key] = state[key];
        }
        return partial;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const master = getMasterBus();
        for (const [id, bs] of Object.entries(state.buses)) {
          master.getBus(id).setVolume(bs.volume);
          master.getBus(id).setMuted(bs.muted);
        }
        master.setMasterVolume(state.masterBusVolume);
        master.setMasterMuted(state.masterBusMuted);
      },
    },
  ),
);
