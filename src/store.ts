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
import type { OscWaveform, SynthParams, LfoWaveform, LfoTargetParam } from './lib/synth';
import { getSynth } from './lib/synth';
import { FACTORY_PRESETS, randomizeParams } from './lib/synthPresets';
import type { SynthPreset } from './lib/synthPresets';

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
  // Osc2
  synthOsc2Waveform: OscWaveform;
  synthOsc2Detune: number;
  synthOsc2Mix: number;
  // FM
  synthFmMode: boolean;
  synthFmDepth: number;
  // LFO1
  synthLfo1Rate: number;
  synthLfo1Depth: number;
  synthLfo1Waveform: LfoWaveform;
  synthLfo1Target: LfoTargetParam;
  // LFO2
  synthLfo2Rate: number;
  synthLfo2Depth: number;
  synthLfo2Waveform: LfoWaveform;
  synthLfo2Target: LfoTargetParam;
  // Presets
  synthPresets: SynthPreset[];
  synthActivePresetIndex: number | null;

  // Synth actions
  setSynthPanelOpen: (open: boolean) => void;
  setSynthParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setSynthKeyboardMode: (mode: 'classic' | 'isomorphic') => void;
  setSynthLfoTarget: (lfo: 1 | 2, target: LfoTargetParam) => void;
  loadPreset: (index: number) => void;
  savePreset: (index: number, name: string) => void;
  deletePreset: (index: number) => void;
  randomizeSynth: () => void;

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

// Helper to apply all synth params to store state
function synthParamsToStoreState(params: SynthParams): Partial<AppState> {
  return {
    synthWaveform: params.waveform,
    synthFilterCutoff: params.filterCutoff,
    synthFilterResonance: params.filterResonance,
    synthAttack: params.attack,
    synthDecay: params.decay,
    synthSustain: params.sustain,
    synthRelease: params.release,
    synthPan: params.pan,
    synthReverbSend: params.reverbSend,
    synthDelaySend: params.delaySend,
    synthDelayTime: params.delayTime,
    synthDelayFeedback: params.delayFeedback,
    synthMasterVolume: params.masterVolume,
    synthOsc2Waveform: params.osc2Waveform,
    synthOsc2Detune: params.osc2Detune,
    synthOsc2Mix: params.osc2Mix,
    synthFmMode: params.fmMode,
    synthFmDepth: params.fmDepth,
    synthLfo1Rate: params.lfo1Rate,
    synthLfo1Depth: params.lfo1Depth,
    synthLfo1Waveform: params.lfo1Waveform,
    synthLfo1Target: params.lfo1Target,
    synthLfo2Rate: params.lfo2Rate,
    synthLfo2Depth: params.lfo2Depth,
    synthLfo2Waveform: params.lfo2Waveform,
    synthLfo2Target: params.lfo2Target,
  };
}

function gatherSynthParams(state: AppState): SynthParams {
  return {
    waveform: state.synthWaveform,
    filterCutoff: state.synthFilterCutoff,
    filterResonance: state.synthFilterResonance,
    attack: state.synthAttack,
    decay: state.synthDecay,
    sustain: state.synthSustain,
    release: state.synthRelease,
    pan: state.synthPan,
    reverbSend: state.synthReverbSend,
    delaySend: state.synthDelaySend,
    delayTime: state.synthDelayTime,
    delayFeedback: state.synthDelayFeedback,
    masterVolume: state.synthMasterVolume,
    osc2Waveform: state.synthOsc2Waveform,
    osc2Detune: state.synthOsc2Detune,
    osc2Mix: state.synthOsc2Mix,
    fmMode: state.synthFmMode,
    fmDepth: state.synthFmDepth,
    lfo1Rate: state.synthLfo1Rate,
    lfo1Depth: state.synthLfo1Depth,
    lfo1Waveform: state.synthLfo1Waveform,
    lfo1Target: state.synthLfo1Target,
    lfo2Rate: state.synthLfo2Rate,
    lfo2Depth: state.synthLfo2Depth,
    lfo2Waveform: state.synthLfo2Waveform,
    lfo2Target: state.synthLfo2Target,
  };
}

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
      synthOsc2Waveform: 'sine' as OscWaveform,
      synthOsc2Detune: 0,
      synthOsc2Mix: 0,
      synthFmMode: false,
      synthFmDepth: 200,
      synthLfo1Rate: 2,
      synthLfo1Depth: 0,
      synthLfo1Waveform: 'sine' as LfoWaveform,
      synthLfo1Target: null as LfoTargetParam,
      synthLfo2Rate: 0.5,
      synthLfo2Depth: 0,
      synthLfo2Waveform: 'triangle' as LfoWaveform,
      synthLfo2Target: null as LfoTargetParam,
      synthPresets: [...FACTORY_PRESETS],
      synthActivePresetIndex: null,

      setSynthPanelOpen: (open) => set({ synthPanelOpen: open }),
      setSynthParam: (key, value) => {
        const storeKey = `synth${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof AppState;
        set({ [storeKey]: value, synthActivePresetIndex: null } as Partial<AppState>);
        getSynth().updateParams({ [key]: value });
      },
      setSynthKeyboardMode: (mode) => set({ synthKeyboardMode: mode }),

      setSynthLfoTarget: (lfo, target) => {
        const synth = getSynth();
        synth.resetLfoBase(lfo);
        if (lfo === 1) {
          set({ synthLfo1Target: target });
          synth.updateParams({ lfo1Target: target });
        } else {
          set({ synthLfo2Target: target });
          synth.updateParams({ lfo2Target: target });
        }
      },

      loadPreset: (index) => {
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

      savePreset: (index, name) => {
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

      deletePreset: (index) => {
        const state = get();
        const preset = state.synthPresets[index];
        if (!preset || preset.isFactory) return;
        const presets = state.synthPresets.filter((_, i) => i !== index);
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
        synthOsc2Waveform: state.synthOsc2Waveform,
        synthOsc2Detune: state.synthOsc2Detune,
        synthOsc2Mix: state.synthOsc2Mix,
        synthFmMode: state.synthFmMode,
        synthFmDepth: state.synthFmDepth,
        synthLfo1Rate: state.synthLfo1Rate,
        synthLfo1Depth: state.synthLfo1Depth,
        synthLfo1Waveform: state.synthLfo1Waveform,
        synthLfo1Target: state.synthLfo1Target,
        synthLfo2Rate: state.synthLfo2Rate,
        synthLfo2Depth: state.synthLfo2Depth,
        synthLfo2Waveform: state.synthLfo2Waveform,
        synthLfo2Target: state.synthLfo2Target,
        synthPresets: state.synthPresets,
      }),
    },
  ),
);
