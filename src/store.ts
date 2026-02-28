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

export type { AppState, FretboardState, Settings } from './store/types';

const ALL_PERSISTED_KEYS: (keyof AppState)[] = [
  ...SANDBOX_PERSISTED_KEYS,
  ...ARP_PERSISTED_KEYS,
  ...TRANSPORT_PERSISTED_KEYS,
  ...SYNTH_PERSISTED_KEYS,
  ...SYNTH_PRESETS_PERSISTED_KEYS,
  ...SONGS_PERSISTED_KEYS,
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
    }),
    {
      name: 'fretkit-storage',
      version: 1,
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partial: Record<string, any> = {};
        for (const key of ALL_PERSISTED_KEYS) {
          partial[key] = state[key];
        }
        return partial;
      },
    },
  ),
);
