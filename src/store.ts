import { create } from 'zustand';
import tunings from './lib/tunings';
import Note from './lib/Note';
import generate from './lib/sequenceGenerator';
import termSearch from './lib/termSearch';
import type Sequence from './lib/Sequence';

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
  fretboards: Record<string, FretboardState>;
  settings: Settings;

  createFretboard: () => void;
  updateFretboard: (id: string, data: Partial<FretboardState>) => void;
  deleteFretboard: (id: string) => void;
  search: (id: string, searchTerm: string) => void;
  openSettings: (id: string) => void;
  updateSettings: (data: Partial<Settings>) => void;
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

let nextId = 1;

function getStrings(fretCount: number, tuning: string[]): Note[][] {
  const openNotes = tuning.map(noteStr => new Note(noteStr));
  return openNotes.map(note => {
    const notes: Note[] = [];
    for (let i = 1; i < fretCount; i++) {
      notes.push(new Note(note.semitones + i));
    }
    return notes;
  });
}

export const useStore = create<AppState>((set, get) => ({
  fretboards: {
    '0': { id: 0, ...defaultFretboard },
  },
  settings: {
    settingsId: '0',
    sidebarOpen: false,
  },

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
}));
