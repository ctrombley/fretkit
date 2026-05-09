import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

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
import { createSamplerSlice, SAMPLER_PERSISTED_KEYS } from './store/samplerSlice';
import { createDroneSlice, DRONE_PERSISTED_KEYS } from './store/droneSlice';
import { createLoopSlice } from './store/loopSlice';
import { getMasterBus } from './lib/masterBus';
import { getSampler } from './lib/sampler';
import { getArpeggiator } from './lib/arpeggiator';
import { getPatternById } from './lib/fingerPickingPatterns';
import { getInstrument } from './lib/instrument'; // boot instrument so it subscribes to the bus at startup
import { bootSamplerInstrument } from './lib/samplerInstrument';
import { applyPresetByName, applyPresetByNameToFretboard } from './store/sandboxSlice';
import { initEngineForFretboard, DEFAULT_PARAMS } from './lib/fretboardEngines';
getInstrument();
// Note: open strings are re-added via setArpUseOpenStrings on rehydration if persisted as true

export type { AppState, FretboardState, Settings } from './store/types';

// Boot sampler instrument — subscribes to bus and routes noteOn/noteOff to SamplerEngine
bootSamplerInstrument(() => {
  const s = useStore.getState();
  return {
    samplerKeyMap: s.samplerKeyMap,
    samplerSlotParams: s.samplerSlotParams,
    samplerSlotRootNotes: s.samplerSlotRootNotes,
  };
});

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
  ...SAMPLER_PERSISTED_KEYS,
  ...DRONE_PERSISTED_KEYS,
  ...NAVIGATION_PERSISTED_KEYS,
];

export const useStore = create<AppState>()(
  devtools(
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
      ...createSamplerSlice(set),
      ...createDroneSlice(set, get),
      ...createLoopSlice(set, get),
    }),
    {
      name: 'fretkit-storage',
      // Shallow merge: persisted top-level keys fully replace initial-state keys.
      // Zustand 5 deep-merges by default, which causes the initial '0' fretboard
      // to bleed through alongside any persisted fretboards on every page load.
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
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
            fretCount: fb.fretCount ?? 12,
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
            startingFret: fb.startingFret ?? 1,
            tuning: fb.tuning ?? ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
            showStringLabels: fb.showStringLabels,
            soundPreset: fb.soundPreset ?? 'Nylon Strings',
            edoMode: fb.edoMode ?? '12',
            quartertoneThresholdCents: fb.quartertoneThresholdCents ?? 1500,
            synthParams: fb.synthParams ?? { ...DEFAULT_PARAMS },
            showEnharmonic: fb.showEnharmonic ?? false,
            showOctaves: fb.showOctaves ?? false,
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
        // Initialize per-fretboard engines and apply each fretboard's sound preset
        for (const [fbId, fb] of Object.entries(state.fretboards)) {
          const params = fb.synthParams ?? { ...DEFAULT_PARAMS };
          initEngineForFretboard(fbId, params);
          if (fb.soundPreset) {
            applyPresetByNameToFretboard(fb.soundPreset, state, fbId);
          }
        }
        // Re-derive litNotes/sequences/current from persisted searchStr
        for (const [fbId, fb] of Object.entries(state.fretboards)) {
          if (fb.searchStr) {
            state.search(fbId, fb.searchStr);
          }
        }
        // Reload sampler audio buffers from persisted URLs
        const sampler = getSampler();
        state.samplerSlots.forEach((slot, i) => {
          if (slot?.url) {
            sampler.loadSample(i, slot.url).catch(console.error);
          }
        });
        // Recover samplerSlotRootNotes from slot definitions — handles the case where
        // samplerSlotRootNotes was missing from an older persisted state but slot.rootNote
        // was already being stored correctly.
        const rootNotes = [...state.samplerSlotRootNotes];
        let rootNotesUpdated = false;
        state.samplerSlots.forEach((slot, i) => {
          if (slot?.rootNote != null && rootNotes[i] == null) {
            rootNotes[i] = slot.rootNote;
            rootNotesUpdated = true;
          }
        });
        if (rootNotesUpdated) {
          state.samplerSlotRootNotes = rootNotes;
        }
        // Restore arp mode + finger picking pattern to engine
        const arp = getArpeggiator();
        arp.mode = state.arpMode ?? 'standard';
        const fp = getPatternById(state.arpFingerPickingPatternId);
        if (fp) {
          arp.fingerPickingSequence = fp.sequence;
          arp.fingerPickingFingers = fp.fingers;
        }
        // Restore crossfade position
        const cf = state.samplerCrossfade ?? 0.5;
        master.getBus('synth').setCrossfadeGain(Math.cos(cf * Math.PI / 2));
        master.getBus('sampler').setCrossfadeGain(Math.sin(cf * Math.PI / 2));
        // Apply sound preset for each unique fretboard preset — last wins for shared engine state
        const appliedPresets = new Set<string>();
        for (const [, fb] of Object.entries(state.fretboards)) {
          const presetName = fb.soundPreset ?? 'Nylon Strings';
          if (!appliedPresets.has(presetName)) {
            appliedPresets.add(presetName);
            applyPresetByName(presetName, state);
          }
        }
      },
    },
  ),
  { name: 'FretKit' },
  ),
);
