import tunings from '../lib/tunings';
import { initEngineForFretboard } from '../lib/fretboardEngines';
import { DEFAULT_PARAMS } from '../lib/fretboardEngines';
import type { AppState, PagePreset, StoreSet, StoreGet } from './types';

export const PAGE_PRESETS_PERSISTED_KEYS: (keyof AppState)[] = ['pagePresets'];

const STD = tunings['guitar']!['standard']!;

const FACTORY_PAGE_PRESETS: PagePreset[] = [
  {
    id: 'factory-blank',
    name: 'Blank',
    isFactory: true,
    fretboards: [
      { searchStr: '', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
    ],
  },
  {
    id: 'factory-c-major',
    name: 'C Major Scale',
    isFactory: true,
    fretboards: [
      { searchStr: 'C major', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
    ],
  },
  {
    id: 'factory-pentatonic',
    name: 'A Minor Pentatonic',
    isFactory: true,
    fretboards: [
      { searchStr: 'A pentatonic minor', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
    ],
  },
  {
    id: 'factory-i-iv-v',
    name: 'I – IV – V',
    isFactory: true,
    fretboards: [
      { searchStr: 'C M', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
      { searchStr: 'F M', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
      { searchStr: 'G M', tuning: STD, startingFret: 1, fretCount: 12, soundPreset: 'Nylon Strings', inversion: 0 },
    ],
  },
];

const RANDOM_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'Eb', 'F#', 'Ab', 'Bb'];
const RANDOM_CHORD_QUALITIES = ['M', 'm', 'm7', 'maj7', '7', 'dim', 'sus2', 'sus4', '9'];
const RANDOM_SCALE_TYPES = ['major', 'minor', 'pentatonic minor', 'pentatonic major', 'blues', 'dorian', 'mixolydian'];

function randomSearchStr(): string {
  const root = RANDOM_ROOTS[Math.floor(Math.random() * RANDOM_ROOTS.length)]!;
  const isChord = Math.random() > 0.4;
  if (isChord) {
    const q = RANDOM_CHORD_QUALITIES[Math.floor(Math.random() * RANDOM_CHORD_QUALITIES.length)]!;
    return `${root} ${q}`;
  }
  const s = RANDOM_SCALE_TYPES[Math.floor(Math.random() * RANDOM_SCALE_TYPES.length)]!;
  return `${root} ${s}`;
}

export function createPagePresetsSlice(set: StoreSet, get: StoreGet) {
  return {
    pagePresets: [...FACTORY_PAGE_PRESETS] as PagePreset[],
    activePagePresetId: null as string | null,

    savePagePreset: (name: string) => {
      const state = get();
      const id = `user-${Date.now()}`;
      const fretboards = Object.values(state.fretboards).map(fb => ({
        searchStr: fb.searchStr,
        tuning: fb.tuning,
        startingFret: fb.startingFret,
        fretCount: fb.fretCount,
        soundPreset: fb.soundPreset,
        inversion: fb.inversion,
      }));
      const preset: PagePreset = { id, name, fretboards };
      const existing = state.pagePresets.find(p => p.name === name && !p.isFactory);
      if (existing) {
        set({ pagePresets: state.pagePresets.map(p => p.id === existing.id ? { ...preset, id: existing.id } : p), activePagePresetId: existing.id });
      } else {
        set({ pagePresets: [...state.pagePresets, preset], activePagePresetId: id });
      }
    },

    loadPagePreset: (id: string) => {
      const state = get();
      const preset = state.pagePresets.find(p => p.id === id);
      if (!preset) return;

      // Clear active notes
      get().killAllNotes();

      // Rebuild fretboards from preset
      const newFretboards: AppState['fretboards'] = {};
      preset.fretboards.forEach((cfg, i) => {
        const fbId = String(i);
        newFretboards[fbId] = {
          id: i,
          searchStr: cfg.searchStr,
          tuning: cfg.tuning ?? STD,
          startingFret: cfg.startingFret ?? 1,
          fretCount: cfg.fretCount ?? 12,
          soundPreset: cfg.soundPreset ?? 'Nylon Strings',
          inversion: cfg.inversion ?? 0,
          current: null,
          litNotes: [],
          sequences: [],
          sequenceIdx: null,
          sequenceEnabled: false,
          position: 1,
          showStringLabels: false,
          edoMode: '12',
          quartertoneThresholdCents: 1500,
          synthParams: { ...DEFAULT_PARAMS },
          showEnharmonic: false,
          showOctaves: false,
        };
        initEngineForFretboard(fbId, DEFAULT_PARAMS);
      });

      set({
        fretboards: newFretboards,
        settings: { settingsId: '0', sidebarOpen: false },
        activePagePresetId: id,
      });

      // Re-run search for each fretboard
      setTimeout(() => {
        preset.fretboards.forEach((cfg, i) => {
          if (cfg.searchStr) get().search(String(i), cfg.searchStr);
        });
      }, 0);
    },

    deletePagePreset: (id: string) => {
      const state = get();
      const preset = state.pagePresets.find(p => p.id === id);
      if (!preset || preset.isFactory) return;
      set({
        pagePresets: state.pagePresets.filter(p => p.id !== id),
        activePagePresetId: state.activePagePresetId === id ? null : state.activePagePresetId,
      });
    },

    randomizeFretboard: (fretboardId: string) => {
      const str = randomSearchStr();
      get().search(fretboardId, str);
    },
  };
}
