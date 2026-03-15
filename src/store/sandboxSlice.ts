import tunings from '../lib/tunings';
import generate from '../lib/sequenceGenerator';
import { generateVoicings } from '../lib/voicingGenerator';
import termSearch from '../lib/termSearch';
import Chord from '../lib/Chord';
import getStrings from '../lib/getStrings';
import { getSynth } from '../lib/synth';
import { getArpeggiator } from '../lib/arpeggiator';
import { getSampler } from '../lib/sampler';
import { pluckMonochord } from '../lib/monochord';
import { optimalStartingFret } from '../lib/fretboardUtils';
import { getInternalMidiBus } from '../lib/internalMidiBus';
import type { NoteSource } from '../lib/internalMidiBus';
import { getInstrument } from '../lib/instrument';
import { FACTORY_SAMPLER_PRESETS } from '../lib/samplerPresets';
import { latchFrequencies } from './latchFrequencies';
import { strumPreviewVoices } from './strumPreviewVoices';
import type { AppState, FretboardState, Settings, StoreSet, StoreGet } from './types';

function noteSourceForFretboard(fretboardId: string | undefined, get: StoreGet): NoteSource {
  if (!fretboardId) return 'latch';
  const state = get();
  const presetName = state.fretboards[fretboardId]?.soundPreset;
  if (!presetName) return 'latch';
  const isSampler =
    FACTORY_SAMPLER_PRESETS.some(p => p.name === presetName) ||
    state.samplerPresets.some(p => p.name === presetName);
  return isSampler ? 'latch-sampler' : 'latch-synth';
}

export function applyPresetByName(presetName: string, state: AppState): void {
  const factorySamplerIdx = FACTORY_SAMPLER_PRESETS.findIndex(p => p.name === presetName);
  if (factorySamplerIdx >= 0) {
    const preset = FACTORY_SAMPLER_PRESETS[factorySamplerIdx]!;
    preset.slots.forEach((slot, i) => {
      state.setSamplerSlot(i, slot);
      if (slot?.url) getSampler().loadSample(i, slot.url).catch(console.error);
    });
    state.setSamplerKeyMap([...preset.keyMap]);
    state.setSamplerCrossfade(1); // sampler engine fully audible
    return;
  }
  const userSamplerIdx = state.samplerPresets.findIndex(p => p.name === presetName);
  if (userSamplerIdx >= 0) {
    state.loadSamplerPreset(userSamplerIdx);
    state.setSamplerCrossfade(1); // sampler engine fully audible
    return;
  }
  const synthIdx = state.synthPresets.findIndex(p => p.name === presetName);
  if (synthIdx >= 0) {
    state.loadPreset(synthIdx);
    state.setSamplerCrossfade(0); // synth engine fully audible
  }
}

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
  showStringLabels: false,
  soundPreset: 'Nylon Strings',
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
    strumPreviewSemitones: [] as number[],
    sandboxSoundingStrings: [] as number[],

    setBloomAllOctaves: (v: boolean) => set({ bloomAllOctaves: v }),

    setSandboxLatch: (latch: boolean) => {
      const prev = get().sandboxLatch;
      set({ sandboxLatch: latch });
      if (prev && !latch) {
        get().killAllNotes();
      }
    },

    killAllNotes: () => {
      getInternalMidiBus().allNotesOff();   // instrument clears all voices
      getSynth().killAll();                 // flush any lingering envelopes
      getSampler().stopAll();
      getArpeggiator().clear();
      latchFrequencies.clear();
      for (const voice of strumPreviewVoices) voice.stop();
      strumPreviewVoices.length = 0;
      set({ sandboxActiveNotes: [], sandboxSoundingStrings: [] });
    },

    toggleSandboxNote: (semitones: number, frequency: number, stringNumber?: number, fretboardId?: string) => {
      const state = get();
      const isActive = state.sandboxActiveNotes.includes(semitones);
      const source = noteSourceForFretboard(fretboardId, get);
      if (isActive) {
        if (state.arpEnabled) {
          getArpeggiator().removeNote(semitones);
        } else {
          getInternalMidiBus().noteOff(semitones, source);
          latchFrequencies.delete(semitones);
        }
        set((s: AppState) => ({
          sandboxActiveNotes: s.sandboxActiveNotes.filter(n => n !== semitones),
          sandboxSoundingStrings: stringNumber !== undefined
            ? s.sandboxSoundingStrings.filter(n => n !== stringNumber)
            : s.sandboxSoundingStrings,
        }));
      } else {
        if (state.arpEnabled) {
          getArpeggiator().addNote(frequency, semitones);
        } else {
          // Monochord mode: swap instrument playFn for this note
          if (state.view.name === 'monochord') {
            getInstrument().playFn = freq => ({ stop: pluckMonochord(freq), setFrequency: () => {} });
          } else {
            getInstrument().playFn = freq => getSynth().play(freq);
          }
          getInternalMidiBus().noteOn(semitones, frequency, source);
          latchFrequencies.set(semitones, frequency);
        }
        set((s: AppState) => ({
          sandboxActiveNotes: [...s.sandboxActiveNotes, semitones],
          sandboxSoundingStrings: stringNumber !== undefined && !s.sandboxSoundingStrings.includes(stringNumber)
            ? [...s.sandboxSoundingStrings, stringNumber]
            : s.sandboxSoundingStrings,
        }));
      }
    },

    activateSandboxNote: (semitones: number, frequency: number, stringNumber?: number, fretboardId?: string) => {
      const state = get();
      if (state.sandboxActiveNotes.includes(semitones)) return;
      const source = noteSourceForFretboard(fretboardId, get);
      if (state.view.name === 'monochord') {
        getInstrument().playFn = freq => ({ stop: pluckMonochord(freq), setFrequency: () => {} });
      } else {
        getInstrument().playFn = freq => getSynth().play(freq);
      }
      getInternalMidiBus().noteOn(semitones, frequency, source);
      latchFrequencies.set(semitones, frequency);
      set((s: AppState) => ({
        sandboxActiveNotes: [...s.sandboxActiveNotes, semitones],
        sandboxSoundingStrings: stringNumber !== undefined && !s.sandboxSoundingStrings.includes(stringNumber)
          ? [...s.sandboxSoundingStrings, stringNumber]
          : s.sandboxSoundingStrings,
      }));
    },

    deactivateSandboxNote: (semitones: number, stringNumber?: number, fretboardId?: string) => {
      const source = noteSourceForFretboard(fretboardId, get);
      getInternalMidiBus().noteOff(semitones, source);
      latchFrequencies.delete(semitones);
      set((s: AppState) => ({
        sandboxActiveNotes: s.sandboxActiveNotes.filter(n => n !== semitones),
        sandboxSoundingStrings: stringNumber !== undefined
          ? s.sandboxSoundingStrings.filter(n => n !== stringNumber)
          : s.sandboxSoundingStrings,
      }));
    },

    setFretboardSoundPreset: (fretboardId: string, presetName: string) => {
      set((state: AppState) => ({
        fretboards: {
          ...state.fretboards,
          [fretboardId]: { ...state.fretboards[fretboardId]!, soundPreset: presetName },
        },
      }));
      applyPresetByName(presetName, get());
    },

    strumVoicing: (notes: Array<{ semitones: number; frequency: number; string?: number }>, fretboardId?: string) => {
      // Stop any previous strum preview voices without touching sandbox latch state
      for (const voice of strumPreviewVoices) voice.stop();
      strumPreviewVoices.length = 0;

      // Let attack + decay complete, then trigger release so the ADSR envelope
      // controls the fadeout naturally — no artificial fixed timer.
      const synth = getSynth();
      const noteOnMs = Math.round((synth.params.attack + synth.params.decay) * 1000);
      const releaseMs = Math.round(synth.params.release * 1000);
      const strumSpreadMs = (notes.length - 1) * 28;
      const totalMs = strumSpreadMs + noteOnMs + releaseMs;

      // Mark specific strings as visually sounding for the duration of the strum
      const strumStringNums = notes.map(n => n.string).filter((s): s is number => s !== undefined);
      set({
        strumPreviewSemitones: notes.map(n => n.semitones),
        sandboxSoundingStrings: strumStringNums,
      });
      setTimeout(() => set({ strumPreviewSemitones: [], sandboxSoundingStrings: [] }), totalMs);

      // Play bass-to-treble with 28ms stagger through the bus so both synth
      // and sampler engines receive the notes; sandboxActiveNotes / latchVoices untouched.
      const bus = getInternalMidiBus();
      const source = noteSourceForFretboard(fretboardId, get);
      notes.forEach((n, i) => {
        setTimeout(() => {
          bus.noteOn(n.semitones, n.frequency, source);
          setTimeout(() => bus.noteOff(n.semitones, source), noteOnMs);
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

      const bus = getInternalMidiBus();

      // Stop all latch voices immediately, then retrigger with stagger through the bus
      for (const { semitones } of notes) bus.noteOff(semitones, 'latch');
      notes.forEach((n, i) => {
        setTimeout(() => bus.noteOn(n.semitones, n.frequency, 'latch'), i * 28);
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
      get().retriggerDrone();
    },

    updateFretboard: (id: string, data: Partial<FretboardState>) => {
      set((state: AppState) => ({
        fretboards: {
          ...state.fretboards,
          [id]: { ...state.fretboards[id]!, ...data },
        },
      }));
      get().retriggerDrone();
    },

    deleteFretboard: (id: string) => {
      set((state: AppState) => {
        const { [id]: _, ...rest } = state.fretboards;
        return { fretboards: rest };
      });
      get().retriggerDrone();
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
      get().syncArpToFretboard(id);
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
