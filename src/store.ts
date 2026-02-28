import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import tunings from './lib/tunings';
import Note from './lib/Note';
import generate from './lib/sequenceGenerator';
import termSearch from './lib/termSearch';
import getStrings from './lib/getStrings';
import type Sequence from './lib/Sequence';
import type { View, Song, ChordConfig, SongExport } from './types';

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
  overtoneUseET: boolean;

  // Overtone actions
  setOvertoneRoot: (root: number) => void;
  setOvertoneOctave: (octave: number) => void;
  setOvertoneCount: (count: number) => void;
  setOvertoneShowET: (show: boolean) => void;
  setOvertoneUseET: (use: boolean) => void;

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
      overtoneUseET: false,

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
      setOvertoneUseET: (use) => set({ overtoneUseET: use }),

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
      partialize: (state) => ({ songs: state.songs }),
    },
  ),
);
