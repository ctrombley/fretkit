import Note from '../lib/Note';
import { getSynth } from '../lib/synth';
import type { SynthVoice } from '../lib/synth';
import { analyzeFrequencies } from '../lib/harmonicAnalysis';
import type { DroneAnalysis } from '../lib/harmonicAnalysis';
import type { AppState, FretboardState, StoreSet, StoreGet } from './types';

// Module-level voice registry — keyed by "${fretboardId}-${stringIdx}"
const droneVoices = new Map<string, SynthVoice>();

export const DRONE_PERSISTED_KEYS: (keyof AppState)[] = [
  'droneDetuneRange',
  'droneOffsets',
  'droneFrets',
  'droneLegatoEnabled',
  'dronePortamentoMs',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFreqForString(
  noteName: string,
  selectedSemitones: number | null,
  detuneOffset: number,
  detuneRange: number,
): number {
  const openNote = new Note(noteName);
  const baseFreq =
    selectedSemitones !== null
      ? 440 * Math.pow(2, (selectedSemitones - 69) / 12)
      : openNote.frequency;
  const detuneCents = detuneOffset * detuneRange;
  return baseFreq * Math.pow(2, detuneCents / 1200);
}

/** Returns the semitone for a given string index from the active chord voicing, or null. */
function getVoicingSemitones(fb: FretboardState, stringIdx: number): number | null {
  if (!fb.sequenceEnabled || fb.sequenceIdx === null) return null;
  const seq = fb.sequences[fb.sequenceIdx];
  if (!seq) return null;
  const sn = seq.stringNotes.find(s => s.string === stringIdx);
  return sn ? sn.semitones : null;
}

function buildStrings(
  fretboards: Record<string, FretboardState>,
  detuneRange: number,
  offsets: number[],
  droneFrets: Record<string, (number | null)[]>,
): Array<{ key: string; label: string; freq: number }> {
  const result: Array<{ key: string; label: string; freq: number }> = [];
  const ids = Object.keys(fretboards);
  const multiGuitar = ids.length > 1;
  let globalIdx = 0;

  for (let fi = 0; fi < ids.length; fi++) {
    const fbId = ids[fi]!;
    const fb = fretboards[fbId]!;
    const suffix = multiGuitar ? ` (Guitar ${fi + 1})` : '';
    const fbFrets = droneFrets[fbId] ?? [];

    for (let si = 0; si < fb.tuning.length; si++) {
      const noteName = fb.tuning[si]!;
      // Prefer chord voicing note → manual drone fret → open string
      const selectedSemitones = getVoicingSemitones(fb, si) ?? fbFrets[si] ?? null;
      const offsetFactor = offsets[globalIdx] ?? 0;
      const freq = getFreqForString(noteName, selectedSemitones, offsetFactor, detuneRange);
      const label = selectedSemitones !== null
        ? `${new Note(noteName).add(selectedSemitones - new Note(noteName).semitones)} (str ${si + 1}${suffix})`
        : `${noteName}${suffix}`;
      result.push({ key: `${fbId}-${si}`, label, freq });
      globalIdx++;
    }
  }

  return result;
}

function totalStringCount(fretboards: Record<string, FretboardState>): number {
  return Object.values(fretboards).reduce((n, fb) => n + fb.tuning.length, 0);
}

function ensureOffsets(existing: number[], needed: number): number[] {
  if (existing.length >= needed) return existing;
  return [
    ...existing,
    ...Array.from({ length: needed - existing.length }, () => Math.random() * 2 - 1),
  ];
}

function globalStringIndex(
  fretboards: Record<string, FretboardState>,
  fretboardId: string,
  stringIdx: number,
): number {
  let count = 0;
  for (const [fbId, fb] of Object.entries(fretboards)) {
    if (fbId === fretboardId) return count + stringIdx;
    count += fb.tuning.length;
  }
  return count + stringIdx;
}

function startVoices(strings: Array<{ key: string; freq: number }>) {
  for (const v of droneVoices.values()) v.stop();
  droneVoices.clear();
  const synth = getSynth();
  for (const { key, freq } of strings) {
    droneVoices.set(key, synth.play(freq));
  }
}

function stopVoices() {
  for (const v of droneVoices.values()) v.stop();
  droneVoices.clear();
}

function runAnalysis(
  state: Pick<AppState, 'fretboards' | 'droneDetuneRange' | 'droneOffsets' | 'droneFrets'>,
): DroneAnalysis {
  const strings = buildStrings(
    state.fretboards,
    state.droneDetuneRange,
    state.droneOffsets,
    state.droneFrets,
  );
  return analyzeFrequencies(strings.map(s => ({ label: s.label, freq: s.freq })));
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export function createDroneSlice(set: StoreSet, get: StoreGet) {
  return {
    droneActive: false,
    droneDetuneRange: 0 as number,
    droneOffsets: [] as number[],
    droneFrets: {} as Record<string, (number | null)[]>,
    droneLegatoEnabled: false,
    dronePortamentoMs: 150 as number,
    droneAnalysis: null as DroneAnalysis | null,

    activateDrone: () => {
      const state = get();
      const needed = totalStringCount(state.fretboards);
      const offsets = ensureOffsets(state.droneOffsets, needed);
      const strings = buildStrings(state.fretboards, state.droneDetuneRange, offsets, state.droneFrets);
      startVoices(strings);
      const analysis = analyzeFrequencies(strings.map(s => ({ label: s.label, freq: s.freq })));
      set({ droneActive: true, droneOffsets: offsets, droneAnalysis: analysis });
    },

    deactivateDrone: () => {
      stopVoices();
      set({ droneActive: false, droneAnalysis: null });
    },

    // Called when fretboard settings change (tuning, string count, fretboard add/remove)
    retriggerDrone: () => {
      const state = get();
      if (!state.droneActive) return;
      const needed = totalStringCount(state.fretboards);
      const offsets = ensureOffsets(state.droneOffsets, needed);
      const strings = buildStrings(state.fretboards, state.droneDetuneRange, offsets, state.droneFrets);
      startVoices(strings);
      const analysis = analyzeFrequencies(strings.map(s => ({ label: s.label, freq: s.freq })));
      set({ droneOffsets: offsets, droneAnalysis: analysis });
    },

    // Select a specific fret on a string in drone mode (one per string, enforced here)
    setDroneFret: (fretboardId: string, stringNumber: number, semitones: number | null) => {
      const state = get();
      const fb = state.fretboards[fretboardId];
      if (!fb) return;

      const prevFrets = state.droneFrets[fretboardId] ?? Array(fb.tuning.length).fill(null);
      const newFbFrets = [...prevFrets] as (number | null)[];
      // Toggle off if same selection clicked again
      newFbFrets[stringNumber] = newFbFrets[stringNumber] === semitones ? null : semitones;
      const newDroneFrets = { ...state.droneFrets, [fretboardId]: newFbFrets };
      set({ droneFrets: newDroneFrets });

      if (state.droneActive) {
        const noteName = fb.tuning[stringNumber]!;
        const globalIdx = globalStringIndex(state.fretboards, fretboardId, stringNumber);
        const offsetFactor = state.droneOffsets[globalIdx] ?? 0;
        const newFreq = getFreqForString(
          noteName,
          newFbFrets[stringNumber] ?? null,
          offsetFactor,
          state.droneDetuneRange,
        );
        const key = `${fretboardId}-${stringNumber}`;
        const voice = droneVoices.get(key);

        if (voice) {
          if (state.droneLegatoEnabled) {
            voice.setFrequency(newFreq, state.dronePortamentoMs / 1000);
          } else {
            voice.stop();
            droneVoices.set(key, getSynth().play(newFreq));
          }
        }

        const analysis = runAnalysis({ ...state, droneFrets: newDroneFrets });
        set({ droneAnalysis: analysis });
      }
    },

    setDroneDetuneRange: (range: number) => {
      const state = get();
      set({ droneDetuneRange: range });
      if (state.droneActive) {
        const strings = buildStrings(state.fretboards, range, state.droneOffsets, state.droneFrets);
        startVoices(strings);
        const analysis = analyzeFrequencies(strings.map(s => ({ label: s.label, freq: s.freq })));
        set({ droneAnalysis: analysis });
      }
    },

    randomizeDroneOffsets: () => {
      const state = get();
      const needed = totalStringCount(state.fretboards);
      const offsets = Array.from({ length: needed }, () => Math.random() * 2 - 1);
      set({ droneOffsets: offsets });
      if (state.droneActive) {
        const strings = buildStrings(state.fretboards, state.droneDetuneRange, offsets, state.droneFrets);
        startVoices(strings);
        const analysis = analyzeFrequencies(strings.map(s => ({ label: s.label, freq: s.freq })));
        set({ droneAnalysis: analysis });
      }
    },

    setDroneLegatoEnabled: (enabled: boolean) => set({ droneLegatoEnabled: enabled }),
    setDronePortamentoMs: (ms: number) => set({ dronePortamentoMs: ms }),
  };
}
