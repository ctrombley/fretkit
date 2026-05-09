import { getLoopEngine } from '../lib/loopEngine';
import { FACTORY_SAMPLER_PRESETS } from '../lib/samplerPresets';
import type { AppState, StoreSet, StoreGet } from './types';

/** Lead-in timers keyed by fretboardId — cancelled if user stops/clears before lead-in fires. */
const leadInTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function createLoopSlice(set: StoreSet, get: StoreGet) {
  // Wire the engine callbacks to store state so UI and visuals stay in sync
  const engine = getLoopEngine();

  engine.onRecordingChanged = (fbId, isRecording, hasLoop) => {
    set((s: AppState) => ({
      loopStatuses: {
        ...s.loopStatuses,
        [fbId]: isRecording ? 'recording' : hasLoop ? 'ready' : 'idle',
      },
    }));
  };

  engine.onPlaybackNoteOn = (fbId, semitones) => {
    set((s: AppState) => {
      const notes = s.sandboxActiveNotes[fbId] ?? [];
      if (notes.includes(semitones)) return {};
      return { sandboxActiveNotes: { ...s.sandboxActiveNotes, [fbId]: [...notes, semitones] } };
    });
  };

  engine.onPlaybackNoteOff = (fbId, semitones) => {
    set((s: AppState) => ({
      sandboxActiveNotes: {
        ...s.sandboxActiveNotes,
        [fbId]: (s.sandboxActiveNotes[fbId] ?? []).filter(n => n !== semitones),
      },
    }));
  };

  return {
    loopStatuses: {} as Record<string, 'idle' | 'waiting' | 'recording' | 'ready'>,
    loopLengthBars: {} as Record<string, number>,
    loopLeadIn: false,

    startRecordingLoop: (fretboardId: string) => {
      const state = get();
      const bpm = state.transportBpm;
      const beatsPerMeasure = state.transportBeatsPerMeasure;
      const bars = state.loopLengthBars[fretboardId] ?? 4;
      const lengthMs = (bars * beatsPerMeasure * 60 / bpm) * 1000;
      const leadInMs = state.loopLeadIn ? (beatsPerMeasure * 60 / bpm) * 1000 : 0;

      const fb = state.fretboards[fretboardId];
      const presetName = fb?.soundPreset ?? '';
      const isSampler =
        FACTORY_SAMPLER_PRESETS.some(p => p.name === presetName) ||
        state.samplerPresets.some(p => p.name === presetName);

      if (leadInMs > 0) {
        set((s: AppState) => ({
          loopStatuses: { ...s.loopStatuses, [fretboardId]: 'waiting' },
        }));
        const timer = setTimeout(() => {
          leadInTimers.delete(fretboardId);
          getLoopEngine().startRecording(fretboardId, lengthMs, isSampler ? 'sampler' : 'synth');
        }, leadInMs);
        leadInTimers.set(fretboardId, timer);
      } else {
        getLoopEngine().startRecording(fretboardId, lengthMs, isSampler ? 'sampler' : 'synth');
        set((s: AppState) => ({
          loopStatuses: { ...s.loopStatuses, [fretboardId]: 'recording' },
        }));
      }
    },

    stopRecordingLoop: (fretboardId: string) => {
      // Cancel lead-in if still waiting
      const timer = leadInTimers.get(fretboardId);
      if (timer !== undefined) {
        clearTimeout(timer);
        leadInTimers.delete(fretboardId);
        set((s: AppState) => ({
          loopStatuses: { ...s.loopStatuses, [fretboardId]: 'idle' },
        }));
        return;
      }
      getLoopEngine().stopRecording(fretboardId);
      // loopStatuses updated via onRecordingChanged callback
    },

    clearLoop: (fretboardId: string) => {
      // Cancel lead-in if still waiting
      const timer = leadInTimers.get(fretboardId);
      if (timer !== undefined) {
        clearTimeout(timer);
        leadInTimers.delete(fretboardId);
      }
      getLoopEngine().clearLoop(fretboardId);
      set((s: AppState) => ({
        loopStatuses: { ...s.loopStatuses, [fretboardId]: 'idle' },
      }));
    },

    setLoopLengthBars: (fretboardId: string, bars: number) => {
      set((s: AppState) => ({
        loopLengthBars: { ...s.loopLengthBars, [fretboardId]: bars },
      }));
    },

    setLoopLeadIn: (enabled: boolean) => {
      set({ loopLeadIn: enabled });
    },
  };
}
