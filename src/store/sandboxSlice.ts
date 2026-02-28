import tunings from '../lib/tunings';
import generate from '../lib/sequenceGenerator';
import { generateVoicings } from '../lib/voicingGenerator';
import termSearch from '../lib/termSearch';
import Chord from '../lib/Chord';
import getStrings from '../lib/getStrings';
import { getSynth } from '../lib/synth';
import { getArpeggiator } from '../lib/arpeggiator';
import { latchVoices } from './latchVoices';
import type { AppState, FretboardState, Settings, StoreSet, StoreGet } from './types';

const defaultFretboard: Omit<FretboardState, 'id'> = {
  current: null,
  fretCount: 12,
  inversion: 0,
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

export const SANDBOX_PERSISTED_KEYS: (keyof AppState)[] = [
  'bloomAllOctaves',
  'sandboxLatch',
];

export function createSandboxSlice(set: StoreSet, get: StoreGet) {
  return {
    fretboards: {
      '0': { id: 0, ...defaultFretboard },
    } as Record<string, FretboardState>,
    settings: {
      settingsId: '0',
      sidebarOpen: false,
    } as Settings,
    bloomAllOctaves: true,
    sandboxLatch: true,
    sandboxActiveNotes: [] as number[],

    setBloomAllOctaves: (v: boolean) => set({ bloomAllOctaves: v }),

    setSandboxLatch: (latch: boolean) => {
      const prev = get().sandboxLatch;
      set({ sandboxLatch: latch });
      if (prev && !latch) {
        get().killAllNotes();
      }
    },

    killAllNotes: () => {
      getSynth().killAll();
      getArpeggiator().clear();
      for (const voice of latchVoices.values()) voice.stop();
      latchVoices.clear();
      set({ sandboxActiveNotes: [] });
    },

    toggleSandboxNote: (semitones: number, frequency: number) => {
      const state = get();
      const isActive = state.sandboxActiveNotes.includes(semitones);
      if (isActive) {
        if (state.arpEnabled) {
          getArpeggiator().removeNote(semitones);
        } else {
          latchVoices.get(semitones)?.stop();
          latchVoices.delete(semitones);
        }
        set({ sandboxActiveNotes: state.sandboxActiveNotes.filter(s => s !== semitones) });
      } else {
        if (state.arpEnabled) {
          getArpeggiator().addNote(frequency, semitones);
        } else {
          latchVoices.set(semitones, getSynth().play(frequency));
        }
        set({ sandboxActiveNotes: [...state.sandboxActiveNotes, semitones] });
      }
    },

    activateSandboxNote: (semitones: number, frequency: number) => {
      const state = get();
      if (state.sandboxActiveNotes.includes(semitones)) return;
      latchVoices.set(semitones, getSynth().play(frequency));
      set({ sandboxActiveNotes: [...state.sandboxActiveNotes, semitones] });
    },

    deactivateSandboxNote: (semitones: number) => {
      latchVoices.get(semitones)?.stop();
      latchVoices.delete(semitones);
      set((s: AppState) => ({ sandboxActiveNotes: s.sandboxActiveNotes.filter(st => st !== semitones) }));
    },

    createFretboard: () => {
      const id = nextId++;
      set((state: AppState) => ({
        fretboards: {
          ...state.fretboards,
          [id]: { id, ...defaultFretboard },
        },
      }));
    },

    updateFretboard: (id: string, data: Partial<FretboardState>) => {
      set((state: AppState) => ({
        fretboards: {
          ...state.fretboards,
          [id]: { ...state.fretboards[id]!, ...data },
        },
      }));
    },

    deleteFretboard: (id: string) => {
      set((state: AppState) => {
        const { [id]: _, ...rest } = state.fretboards;
        return { fretboards: rest };
      });
    },

    search: (id: string, searchTerm: string) => {
      const state = get();
      const fb = state.fretboards[id]!;
      const { current, notes } = termSearch(searchTerm);

      let effectiveNotes = notes;
      if (current?.type === 'Chord' && fb.inversion > 0) {
        const chordObj = new Chord(searchTerm);
        effectiveNotes = chordObj.invert(fb.inversion);
      }

      let sequences: import('../lib/Sequence').default[] = [];
      if (current?.type === 'Chord') {
        const pitchClasses = effectiveNotes.map(n => n.baseSemitones);
        const bassTarget = effectiveNotes[0]!.baseSemitones;
        sequences = generateVoicings(pitchClasses, bassTarget, fb.tuning, 15);
      } else if (current) {
        const strings = getStrings(fb.fretCount, fb.tuning);
        sequences = generate(effectiveNotes, strings, fb.position);
      }

      set((state: AppState) => ({
        fretboards: {
          ...state.fretboards,
          [id]: {
            ...state.fretboards[id]!,
            litNotes: effectiveNotes,
            current: current ?? null,
            searchStr: searchTerm,
            sequences,
            sequenceIdx: sequences.length > 0 ? 0 : null,
          },
        },
      }));
    },

    openSettings: (id: string) => {
      set({ settings: { settingsId: id, sidebarOpen: true } });
    },

    updateSettings: (data: Partial<Settings>) => {
      set((state: AppState) => ({
        settings: { ...state.settings, ...data },
      }));
    },
  };
}
