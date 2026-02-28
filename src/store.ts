import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import tunings from './lib/tunings';
import Note from './lib/Note';
import generate from './lib/sequenceGenerator';
import termSearch from './lib/termSearch';
import getStrings from './lib/getStrings';
import type Sequence from './lib/Sequence';
import type { View, Song, ChordConfig, SongExport } from './types';
import type { GeneratorPreset } from './lib/derivation';
import type { SymmetricDivision } from './lib/coltrane';
import type { OscWaveform, SynthParams } from './lib/synth';
import { getSynth } from './lib/synth';

export interface FretboardState {
  id: number;
  current: { name: string; type: string; root?: Note } | null;
  fretCount: number;
  litNotes: Note[];
  position: number;
  searchStr: string;
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  sequences: Sequence[];
  startingFret: number;
  tuning: string[];
}

interface Settings {
  settingsId: string;
  sidebarOpen: boolean;
}

interface AppState {
  // Sandbox
  fretboards: Record<string, FretboardState>;
  settings: Settings;

  // Navigation
  view: View;

  // Songs
  songs: Record<string, Song>;
  activeSongChordId: string | null;

  // Spiral
  spiralRoot: number;
  spiralMode: 'major' | 'minor';
  spiralHighlightedChord: number | null;

  // Spiral actions
  setSpiralRoot: (root: number) => void;
  setSpiralMode: (mode: 'major' | 'minor') => void;
  setSpiralHighlightedChord: (degree: number | null) => void;

  // Overtones
  overtoneRoot: number;
  overtoneOctave: number;
  overtoneCount: number;
  overtoneShowET: boolean;
  overtoneMode: 'ji' | 'et' | 'derive';

  // Derivation
  derivationGenerator: GeneratorPreset;
  derivationSteps: number;
  derivationActiveStep: number | null;
  derivationDivisions: number;

  // Overtone actions
  setOvertoneRoot: (root: number) => void;
  setOvertoneOctave: (octave: number) => void;
  setOvertoneCount: (count: number) => void;
  setOvertoneShowET: (show: boolean) => void;
  setOvertoneMode: (mode: 'ji' | 'et' | 'derive') => void;

  // Derivation actions
  setDerivationGenerator: (preset: GeneratorPreset) => void;
  setDerivationSteps: (steps: number) => void;
  setDerivationActiveStep: (step: number | null) => void;
  setDerivationDivisions: (n: number) => void;

  // Coltrane
  coltraneRoot: number;
  coltraneDivision: SymmetricDivision;
  coltraneMode: 'circle' | 'mandala';
  coltraneOrdering: 'fifths' | 'chromatic';
  coltraneShowCadences: boolean;
  coltraneHighlightedAxis: number | null;

  // Synth
  synthPanelOpen: boolean;
  synthWaveform: OscWaveform;
  synthFilterCutoff: number;
  synthFilterResonance: number;
  synthAttack: number;
  synthDecay: number;
  synthSustain: number;
  synthRelease: number;
  synthPan: number;
  synthReverbSend: number;
  synthDelaySend: number;
  synthDelayTime: number;
  synthDelayFeedback: number;
  synthMasterVolume: number;
  synthKeyboardMode: 'classic' | 'isomorphic';

  // Synth actions
  setSynthPanelOpen: (open: boolean) => void;
  setSynthParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setSynthKeyboardMode: (mode: 'classic' | 'isomorphic') => void;

  // Coltrane actions
  setColtraneRoot: (root: number) => void;
  setColtraneDivision: (division: SymmetricDivision) => void;
  setColtraneMode: (mode: 'circle' | 'mandala') => void;
  setColtraneOrdering: (ordering: 'fifths' | 'chromatic') => void;
  setColtraneShowCadences: (show: boolean) => void;
  setColtraneHighlightedAxis: (axis: number | null) => void;

  // Sandbox actions
  createFretboard: () => void;
  updateFretboard: (id: string, data: Partial<FretboardState>) => void;
  deleteFretboard: (id: string) => void;
  search: (id: string, searchTerm: string) => void;
  openSettings: (id: string) => void;
  updateSettings: (data: Partial<Settings>) => void;

  // Navigation actions
  navigate: (view: View) => void;

  // Song actions
  createSong: (title: string) => void;
  deleteSong: (id: string) => void;
  renameSong: (id: string, title: string) => void;
  addChordToSong: (songId: string) => void;
  updateSongChord: (songId: string, chordId: string, data: Partial<ChordConfig>) => void;
  removeSongChord: (songId: string, chordId: string) => void;
  reorderSongChords: (songId: string, from: number, to: number) => void;
  setActiveSongChordId: (id: string | null) => void;
  importSongs: (data: SongExport) => void;
  exportSongs: (songIds: string[]) => SongExport;
}

const defaultFretboard: Omit<FretboardState, 'id'> = {
  current: null,
  fretCount: 12,
  litNotes: [],
  position: 1,
  searchStr: '',
  sequenceEnabled: false,
  sequenceIdx: null,
  sequences: [],
  startingFret: 1,
  tuning: tunings['guitar']!['standard']!,
};

const defaultChordConfig: Omit<ChordConfig, 'id'> = {
  searchStr: '',
  tuning: tunings['guitar']!['standard']!,
  fretCount: 12,
  startingFret: 1,
  position: 1,
  sequenceEnabled: false,
  sequenceIdx: null,
};

let nextId = 1;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      fretboards: {
        '0': { id: 0, ...defaultFretboard },
      },
      settings: {
        settingsId: '0',
        sidebarOpen: false,
      },
      view: { name: 'sandbox' } as View,
      songs: {},
      activeSongChordId: null,
      spiralRoot: 0,
      spiralMode: 'major' as const,
      spiralHighlightedChord: null,
      overtoneRoot: 9,
      overtoneOctave: 2,
      overtoneCount: 16,
      overtoneShowET: false,
      overtoneMode: 'ji' as const,
      derivationGenerator: 'fifths' as GeneratorPreset,
      derivationSteps: 12,
      derivationActiveStep: null,
      derivationDivisions: 12,
      synthPanelOpen: false,
      synthWaveform: 'sawtooth' as OscWaveform,
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
      synthMasterVolume: 0.5,
      synthKeyboardMode: 'classic' as const,

      setSynthPanelOpen: (open) => set({ synthPanelOpen: open }),
      setSynthParam: (key, value) => {
        const storeKey = `synth${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof AppState;
        set({ [storeKey]: value } as Partial<AppState>);
        getSynth().updateParams({ [key]: value });
      },
      setSynthKeyboardMode: (mode) => set({ synthKeyboardMode: mode }),

      coltraneRoot: 0,
      coltraneDivision: 3 as SymmetricDivision,
      coltraneMode: 'circle' as const,
      coltraneOrdering: 'fifths' as const,
      coltraneShowCadences: false,
      coltraneHighlightedAxis: null,

      setSpiralRoot: (root) => {
        set({ spiralRoot: root, spiralHighlightedChord: null });
      },

      setSpiralMode: (mode) => {
        set({ spiralMode: mode, spiralHighlightedChord: null });
      },

      setSpiralHighlightedChord: (degree) => {
        set({ spiralHighlightedChord: degree });
      },

      setOvertoneRoot: (root) => set({ overtoneRoot: root }),
      setOvertoneOctave: (octave) => set({ overtoneOctave: octave }),
      setOvertoneCount: (count) => set({ overtoneCount: count }),
      setOvertoneShowET: (show) => set({ overtoneShowET: show }),
      setOvertoneMode: (mode) => set({ overtoneMode: mode }),
      setDerivationGenerator: (preset) => set({ derivationGenerator: preset }),
      setDerivationSteps: (steps) => set({ derivationSteps: steps }),
      setDerivationActiveStep: (step) => set({ derivationActiveStep: step }),
      setDerivationDivisions: (n) => set({ derivationDivisions: n }),
      setColtraneRoot: (root) => set({ coltraneRoot: root, coltraneHighlightedAxis: null }),
      setColtraneDivision: (division) => set({ coltraneDivision: division, coltraneHighlightedAxis: null }),
      setColtraneMode: (mode) => set({ coltraneMode: mode }),
      setColtraneOrdering: (ordering) => set({ coltraneOrdering: ordering }),
      setColtraneShowCadences: (show) => set({ coltraneShowCadences: show }),
      setColtraneHighlightedAxis: (axis) => set({ coltraneHighlightedAxis: axis }),

      createFretboard: () => {
        const id = nextId++;
        set(state => ({
          fretboards: {
            ...state.fretboards,
            [id]: { id, ...defaultFretboard },
          },
        }));
      },

      updateFretboard: (id, data) => {
        set(state => ({
          fretboards: {
            ...state.fretboards,
            [id]: { ...state.fretboards[id]!, ...data },
          },
        }));
      },

      deleteFretboard: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.fretboards;
          return { fretboards: rest };
        });
      },

      search: (id, searchTerm) => {
        const state = get();
        const fb = state.fretboards[id]!;
        const { current, notes } = termSearch(searchTerm);
        const strings = getStrings(fb.fretCount, fb.tuning);
        const sequences = current ? generate(notes, strings, fb.position) : [];

        set(state => ({
          fretboards: {
            ...state.fretboards,
            [id]: {
              ...state.fretboards[id]!,
              litNotes: notes,
              current: current ?? null,
              searchStr: searchTerm,
              sequences,
              sequenceIdx: sequences.length > 0 ? 0 : null,
            },
          },
        }));
      },

      openSettings: (id) => {
        set({ settings: { settingsId: id, sidebarOpen: true } });
      },

      updateSettings: (data) => {
        set(state => ({
          settings: { ...state.settings, ...data },
        }));
      },

      // Navigation
      navigate: (view) => {
        set({ view, activeSongChordId: null });
      },

      // Song CRUD
      createSong: (title) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        set(state => ({
          songs: {
            ...state.songs,
            [id]: { id, title, createdAt: now, updatedAt: now, chords: [] },
          },
          view: { name: 'songDetail', songId: id },
        }));
      },

      deleteSong: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.songs;
          const nextView: View = state.view.name === 'songDetail' && state.view.songId === id
            ? { name: 'songList' }
            : state.view;
          return { songs: rest, view: nextView };
        });
      },

      renameSong: (id, title) => {
        set(state => {
          const song = state.songs[id];
          if (!song) return state;
          return {
            songs: {
              ...state.songs,
              [id]: { ...song, title, updatedAt: Date.now() },
            },
          };
        });
      },

      addChordToSong: (songId) => {
        const chordId = crypto.randomUUID();
        set(state => {
          const song = state.songs[songId];
          if (!song) return state;
          const newChord: ChordConfig = { id: chordId, ...defaultChordConfig };
          return {
            songs: {
              ...state.songs,
              [songId]: {
                ...song,
                chords: [...song.chords, newChord],
                updatedAt: Date.now(),
              },
            },
            activeSongChordId: chordId,
          };
        });
      },

      updateSongChord: (songId, chordId, data) => {
        set(state => {
          const song = state.songs[songId];
          if (!song) return state;
          return {
            songs: {
              ...state.songs,
              [songId]: {
                ...song,
                chords: song.chords.map(c =>
                  c.id === chordId ? { ...c, ...data } : c,
                ),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      removeSongChord: (songId, chordId) => {
        set(state => {
          const song = state.songs[songId];
          if (!song) return state;
          return {
            songs: {
              ...state.songs,
              [songId]: {
                ...song,
                chords: song.chords.filter(c => c.id !== chordId),
                updatedAt: Date.now(),
              },
            },
            activeSongChordId: state.activeSongChordId === chordId ? null : state.activeSongChordId,
          };
        });
      },

      reorderSongChords: (songId, from, to) => {
        set(state => {
          const song = state.songs[songId];
          if (!song) return state;
          const chords = [...song.chords];
          const [moved] = chords.splice(from, 1);
          chords.splice(to, 0, moved!);
          return {
            songs: {
              ...state.songs,
              [songId]: { ...song, chords, updatedAt: Date.now() },
            },
          };
        });
      },

      setActiveSongChordId: (id) => {
        set({ activeSongChordId: id });
      },

      importSongs: (data) => {
        set(state => {
          const newSongs = { ...state.songs };
          for (const song of data.songs) {
            // Generate new IDs to avoid collisions
            const newId = crypto.randomUUID();
            newSongs[newId] = {
              ...song,
              id: newId,
              chords: song.chords.map(c => ({ ...c, id: crypto.randomUUID() })),
            };
          }
          return { songs: newSongs };
        });
      },

      exportSongs: (songIds) => {
        const state = get();
        const songs = songIds
          .map(id => state.songs[id])
          .filter((s): s is Song => s !== undefined);
        return {
          version: 1,
          exportedAt: Date.now(),
          songs,
        };
      },
    }),
    {
      name: 'fretkit-storage',
      partialize: (state) => ({
        songs: state.songs,
        synthWaveform: state.synthWaveform,
        synthFilterCutoff: state.synthFilterCutoff,
        synthFilterResonance: state.synthFilterResonance,
        synthAttack: state.synthAttack,
        synthDecay: state.synthDecay,
        synthSustain: state.synthSustain,
        synthRelease: state.synthRelease,
        synthPan: state.synthPan,
        synthReverbSend: state.synthReverbSend,
        synthDelaySend: state.synthDelaySend,
        synthDelayTime: state.synthDelayTime,
        synthDelayFeedback: state.synthDelayFeedback,
        synthMasterVolume: state.synthMasterVolume,
        synthKeyboardMode: state.synthKeyboardMode,
      }),
    },
  ),
);
