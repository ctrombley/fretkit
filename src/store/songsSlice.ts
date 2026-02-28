import tunings from '../lib/tunings';
import type { Song, ChordConfig, SongExport } from '../types';
import type { AppState, StoreSet, StoreGet } from './types';

const defaultChordConfig: Omit<ChordConfig, 'id'> = {
  searchStr: '',
  tuning: tunings['guitar']!['standard']!,
  fretCount: 12,
  startingFret: 1,
  position: 1,
  sequenceEnabled: false,
  sequenceIdx: null,
  inversion: 0,
};

export const SONGS_PERSISTED_KEYS: (keyof AppState)[] = [
  'songs',
];

export function createSongsSlice(set: StoreSet, get: StoreGet) {
  return {
    songs: {} as Record<string, Song>,
    activeSongChordId: null as string | null,
    setActiveSongChordId: (id: string | null) => set({ activeSongChordId: id }),

    createSong: (title: string) => {
      const id = crypto.randomUUID();
      const now = Date.now();
      set((state: AppState) => ({
        songs: {
          ...state.songs,
          [id]: { id, title, createdAt: now, updatedAt: now, chords: [] },
        },
      }));
      get().navigate({ name: 'songDetail', songId: id });
    },

    deleteSong: (id: string) => {
      const state = get();
      const needsNav = state.view.name === 'songDetail' && state.view.songId === id;
      set((state: AppState) => {
        const { [id]: _, ...rest } = state.songs;
        return { songs: rest };
      });
      if (needsNav) {
        get().navigate({ name: 'songList' });
      }
    },

    renameSong: (id: string, title: string) => {
      set((state: AppState) => {
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

    addChordToSong: (songId: string) => {
      const chordId = crypto.randomUUID();
      set((state: AppState) => {
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

    updateSongChord: (songId: string, chordId: string, data: Partial<ChordConfig>) => {
      set((state: AppState) => {
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

    removeSongChord: (songId: string, chordId: string) => {
      set((state: AppState) => {
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

    reorderSongChords: (songId: string, from: number, to: number) => {
      set((state: AppState) => {
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

    importSongs: (data: SongExport) => {
      set((state: AppState) => {
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

    exportSongs: (songIds: string[]) => {
      const state = get();
      const songs = songIds
        .map(id => state.songs[id])
        .filter((s): s is Song => s !== undefined);
      return {
        version: 1 as const,
        exportedAt: Date.now(),
        songs,
      };
    },
  };
}
