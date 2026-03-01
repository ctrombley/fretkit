import tunings from '../lib/tunings';
import generate from '../lib/sequenceGenerator';
import { generateVoicings } from '../lib/voicingGenerator';
import termSearch from '../lib/termSearch';
import Chord from '../lib/Chord';
import getStrings from '../lib/getStrings';
import { getSynth } from '../lib/synth';
import { getArpeggiator } from '../lib/arpeggiator';
import { pluckMonochord } from '../lib/monochord';
import { optimalStartingFret } from '../lib/fretboardUtils';
import { latchVoices } from './latchVoices';
import { latchFrequencies } from './latchFrequencies';
import { strumPreviewVoices } from './strumPreviewVoices';
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

export const SANDBOX_PERSISTED_KEYS: (keyof AppState)[] = [
  'fretboards',
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
      latchFrequencies.clear();
      for (const voice of strumPreviewVoices) voice.stop();
      strumPreviewVoices.length = 0;
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
          latchFrequencies.delete(semitones);
        }
        set({ sandboxActiveNotes: state.sandboxActiveNotes.filter(s => s !== semitones) });
      } else {
        if (state.arpEnabled) {
          getArpeggiator().addNote(frequency, semitones);
        } else {
          if (state.view.name === 'monochord') {
            const stop = pluckMonochord(frequency);
            latchVoices.set(semitones, { stop });
          } else {
            latchVoices.set(semitones, getSynth().play(frequency));
          }
          latchFrequencies.set(semitones, frequency);
        }
        set({ sandboxActiveNotes: [...state.sandboxActiveNotes, semitones] });
      }
    },

    activateSandboxNote: (semitones: number, frequency: number) => {
      const state = get();
      if (state.sandboxActiveNotes.includes(semitones)) return;
      if (state.view.name === 'monochord') {
        const stop = pluckMonochord(frequency);
        latchVoices.set(semitones, { stop });
      } else {
        latchVoices.set(semitones, getSynth().play(frequency));
      }
      latchFrequencies.set(semitones, frequency);
      set({ sandboxActiveNotes: [...state.sandboxActiveNotes, semitones] });
    },

    deactivateSandboxNote: (semitones: number) => {
      latchVoices.get(semitones)?.stop();
      latchVoices.delete(semitones);
      latchFrequencies.delete(semitones);
      set((s: AppState) => ({ sandboxActiveNotes: s.sandboxActiveNotes.filter(st => st !== semitones) }));
    },

    strumVoicing: (notes: Array<{ semitones: number; frequency: number }>) => {
      // Stop any previous strum preview voices without touching sandbox latch state
      for (const voice of strumPreviewVoices) voice.stop();
      strumPreviewVoices.length = 0;

      // Let attack + decay complete, then trigger release so the ADSR envelope
      // controls the fadeout naturally — no artificial fixed timer.
      const synth = getSynth();
      const noteOnMs = Math.round((synth.params.attack + synth.params.decay) * 1000);

      // Play bass-to-treble with 28ms stagger; voices are tracked only in
      // strumPreviewVoices — sandboxActiveNotes / latchVoices are untouched.
      notes.forEach((n, i) => {
        setTimeout(() => {
          const voice = synth.play(n.frequency);
          strumPreviewVoices.push(voice);
          setTimeout(() => voice.stop(), noteOnMs);
        }, i * 28);
      });
    },

    strumActiveNotes: () => {
      const state = get();
      if (state.sandboxActiveNotes.length < 2) return;

      // Collect notes with frequencies, sort bass-to-treble (ascending frequency)
      const notes = state.sandboxActiveNotes
        .map(semi => ({ semitones: semi, frequency: latchFrequencies.get(semi) ?? 0 }))
        .filter(n => n.frequency > 0)
        .sort((a, b) => a.frequency - b.frequency);

      // Stop current voices and replay with stagger
      for (const voice of latchVoices.values()) voice.stop();
      latchVoices.clear();

      notes.forEach((n, i) => {
        setTimeout(() => {
          const voice = getSynth().play(n.frequency);
          latchVoices.set(n.semitones, voice);
        }, i * 28);
      });
    },

    createFretboard: () => {
      const existing = get().fretboards;
      const id = Math.max(0, ...Object.values(existing).map(fb => fb.id)) + 1;
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

      const autoStart =
        current?.type === 'Chord' && sequences.length > 0
          ? optimalStartingFret(sequences[0]!, 1, fb.fretCount)
          : undefined;

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
            sequenceEnabled: current?.type === 'Chord' && sequences.length > 0,
            ...(autoStart !== undefined && { startingFret: autoStart }),
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
