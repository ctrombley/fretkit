import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppState } from './store/types';
import { createSandboxSlice, SANDBOX_PERSISTED_KEYS } from './store/sandboxSlice';
import { createArpSlice, ARP_PERSISTED_KEYS } from './store/arpSlice';
import { createTransportSlice, TRANSPORT_PERSISTED_KEYS } from './store/transportSlice';
import { createSynthSlice, SYNTH_PERSISTED_KEYS } from './store/synthSlice';
import { createSynthPresetsSlice, SYNTH_PRESETS_PERSISTED_KEYS } from './store/synthPresetsSlice';
import { createViewsSlice } from './store/viewsSlice';
import { createNavigationSlice, NAVIGATION_PERSISTED_KEYS } from './store/navigationSlice';
import { createSongsSlice, SONGS_PERSISTED_KEYS } from './store/songsSlice';
import { createBusSlice, BUS_PERSISTED_KEYS } from './store/busSlice';
import { createMidiSlice, MIDI_PERSISTED_KEYS } from './store/midiSlice';
import { createMonochordScalesSlice, MONOCHORD_SCALES_PERSISTED_KEYS } from './store/monochordScalesSlice';
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
  ...MONOCHORD_SCALES_PERSISTED_KEYS,
  ...NAVIGATION_PERSISTED_KEYS,
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
      ...createMonochordScalesSlice(set),
    }),
    {
      name: 'fretkit-storage',
      version: 5,
      migrate: (persisted, version) => {
        // v1 → v2: add bus/midi defaults to existing state
        // v2 → v3: add monochord scales defaults
        // v3 → v4: add fretboards + view persistence
        // v4 → v5: ensure fretboard entries always have sequences/litNotes/current
        //          (v4 could store them without those fields if saved before the fix)
        const state = { ...(persisted as Record<string, unknown>) };
        if (version < 5 && state.fretboards) {
          const boards = state.fretboards as Record<string, Record<string, unknown>>;
          const fixed: Record<string, object> = {};
          for (const [id, fb] of Object.entries(boards)) {
            fixed[id] = { litNotes: [], current: null, sequences: [], ...fb };
          }
          state.fretboards = fixed;
        }
        return state as unknown as AppState;
      },
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partial: Record<string, any> = {};
        for (const key of ALL_PERSISTED_KEYS) {
          partial[key] = state[key];
        }
        // Strip non-serializable Note/Sequence instances from fretboards.
        // Only store plain-data fields; litNotes/current/sequences are
        // regenerated from searchStr on rehydration.
        const safeBoards: Record<string, object> = {};
        for (const [fbId, fb] of Object.entries(state.fretboards)) {
          safeBoards[fbId] = {
            id: fb.id,
            fretCount: fb.fretCount,
            inversion: fb.inversion,
            // litNotes/current/sequences hold Note/Sequence class instances that
            // don't survive JSON round-trip; store safe defaults and regenerate
            // from searchStr in onRehydrateStorage instead.
            litNotes: [],
            current: null,
            sequences: [],
            position: fb.position,
            searchStr: fb.searchStr,
            sequenceEnabled: fb.sequenceEnabled,
            sequenceIdx: fb.sequenceIdx,
            startingFret: fb.startingFret,
            tuning: fb.tuning,
          };
        }
        partial['fretboards'] = safeBoards;
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
        // Re-derive litNotes/sequences/current from persisted searchStr
        for (const [fbId, fb] of Object.entries(state.fretboards)) {
          if (fb.searchStr) {
            state.search(fbId, fb.searchStr);
          }
        }
      },
    },
  ),
);
