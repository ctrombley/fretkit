/**
 * Per-fretboard loop recorder and playback engine.
 *
 * Loops are stored in-memory (not persisted). Each fretboard gets one loop slot.
 * Recording captures note-on/off events with millisecond timestamps relative to
 * the loop start. Playback uses setTimeout scheduling (±25 ms accuracy).
 *
 * Synth fretboard notes are played directly via their per-fretboard SynthEngine.
 * Sampler notes are routed through the InternalMidiBus (same path as strumVoicing).
 */

import type { SynthVoice } from './synth';
import { getEngineForFretboard } from './fretboardEngines';
import { getInternalMidiBus } from './internalMidiBus';

export interface LoopEvent {
  type: 'noteOn' | 'noteOff';
  semitones: number;
  frequency: number;
  timeMs: number; // ms from loop start
}

export interface FretboardLoop {
  events: LoopEvent[];
  lengthMs: number;
  source: 'synth' | 'sampler';
  fretboardId: string;
}

interface RecordingState {
  startMs: number;
  lengthMs: number;
  source: 'synth' | 'sampler';
  events: LoopEvent[];
  stopTimer: ReturnType<typeof setTimeout>;
}

export class LoopEngine {
  loops = new Map<string, FretboardLoop>();
  private recording = new Map<string, RecordingState>();
  private playbackVoices = new Map<string, Map<number, SynthVoice>>();
  private playbackTimers: ReturnType<typeof setTimeout>[] = [];
  private playbackStartMs = 0;
  private _isPlaying = false;
  /** Tracks which semitones loop playback added to the store's sandboxActiveNotes. */
  private playbackAddedNotes = new Map<string, Set<number>>();

  /** Called whenever recording starts/stops or a loop is cleared — use to sync store state. */
  onRecordingChanged: ((fbId: string, isRecording: boolean, hasLoop: boolean) => void) | null = null;
  /** Called when loop playback plays a note — use to update visual markers. */
  onPlaybackNoteOn: ((fbId: string, semitones: number) => void) | null = null;
  /** Called when loop playback releases a note — use to update visual markers. */
  onPlaybackNoteOff: ((fbId: string, semitones: number) => void) | null = null;

  startRecording(fbId: string, lengthMs: number, source: 'synth' | 'sampler'): void {
    this.stopRecording(fbId);
    const startMs = performance.now();
    const stopTimer = setTimeout(() => this.stopRecording(fbId), lengthMs);
    this.recording.set(fbId, { startMs, lengthMs, source, events: [], stopTimer });
    this.onRecordingChanged?.(fbId, true, this.loops.has(fbId));
  }

  stopRecording(fbId: string): void {
    const rec = this.recording.get(fbId);
    if (!rec) return;
    clearTimeout(rec.stopTimer);
    this.recording.delete(fbId);
    if (rec.events.length > 0) {
      this.loops.set(fbId, {
        events: rec.events,
        lengthMs: rec.lengthMs,
        source: rec.source,
        fretboardId: fbId,
      });
    }
    this.onRecordingChanged?.(fbId, false, this.loops.has(fbId));
  }

  recordNoteOn(fbId: string, semitones: number, frequency: number): void {
    const rec = this.recording.get(fbId);
    if (!rec) return;
    rec.events.push({ type: 'noteOn', semitones, frequency, timeMs: performance.now() - rec.startMs });
  }

  recordNoteOff(fbId: string, semitones: number): void {
    const rec = this.recording.get(fbId);
    if (!rec) return;
    rec.events.push({ type: 'noteOff', semitones, frequency: 0, timeMs: performance.now() - rec.startMs });
  }

  startPlayback(): void {
    this.stopPlayback();
    this._isPlaying = true;
    this.playbackStartMs = performance.now();
    for (const [fbId, loop] of this.loops) {
      this.scheduleLoop(fbId, loop, 0);
    }
  }

  private scheduleLoop(fbId: string, loop: FretboardLoop, cycleOffsetMs: number): void {
    if (!this._isPlaying) return;
    const baseMs = this.playbackStartMs + cycleOffsetMs;
    const nowMs = performance.now();

    for (const event of loop.events) {
      const delayMs = baseMs + event.timeMs - nowMs;
      const timer = setTimeout(() => {
        if (!this._isPlaying) return;
        if (event.type === 'noteOn') {
          this.doNoteOn(fbId, event.semitones, event.frequency, loop.source);
        } else {
          this.doNoteOff(fbId, event.semitones, loop.source);
        }
      }, Math.max(0, delayMs));
      this.playbackTimers.push(timer);
    }

    // Reschedule next cycle
    const nextCycleDelay = baseMs + loop.lengthMs - nowMs;
    const cycleTimer = setTimeout(() => {
      this.scheduleLoop(fbId, loop, cycleOffsetMs + loop.lengthMs);
    }, Math.max(0, nextCycleDelay));
    this.playbackTimers.push(cycleTimer);
  }

  private doNoteOn(fbId: string, semitones: number, frequency: number, source: 'synth' | 'sampler'): void {
    if (source === 'synth') {
      const entry = getEngineForFretboard(fbId);
      const voice = entry.synth.play(frequency);
      let voices = this.playbackVoices.get(fbId);
      if (!voices) { voices = new Map(); this.playbackVoices.set(fbId, voices); }
      voices.get(semitones)?.stop(); // stop stale voice if any
      voices.set(semitones, voice);
    } else {
      getInternalMidiBus().noteOn(semitones, frequency, 'latch-sampler');
    }
    let added = this.playbackAddedNotes.get(fbId);
    if (!added) { added = new Set(); this.playbackAddedNotes.set(fbId, added); }
    added.add(semitones);
    this.onPlaybackNoteOn?.(fbId, semitones);
  }

  private doNoteOff(fbId: string, semitones: number, source: 'synth' | 'sampler'): void {
    if (source === 'synth') {
      const voices = this.playbackVoices.get(fbId);
      voices?.get(semitones)?.stop();
      voices?.delete(semitones);
    } else {
      getInternalMidiBus().noteOff(semitones, 'latch-sampler');
    }
    this.playbackAddedNotes.get(fbId)?.delete(semitones);
    this.onPlaybackNoteOff?.(fbId, semitones);
  }

  stopPlayback(): void {
    this._isPlaying = false;
    for (const timer of this.playbackTimers) clearTimeout(timer);
    this.playbackTimers = [];
    for (const voices of this.playbackVoices.values()) {
      for (const v of voices.values()) v.stop();
      voices.clear();
    }
    this.playbackVoices.clear();
    // Emit noteOff for any notes still marked as playing so visuals clear
    for (const [fbId, notes] of this.playbackAddedNotes) {
      for (const semitones of notes) {
        this.onPlaybackNoteOff?.(fbId, semitones);
      }
    }
    this.playbackAddedNotes.clear();
  }

  clearLoop(fbId: string): void {
    this.stopRecording(fbId);
    this.loops.delete(fbId);
    this.onRecordingChanged?.(fbId, false, false);
  }

  isRecording(fbId: string): boolean { return this.recording.has(fbId); }
  hasLoop(fbId: string): boolean { return this.loops.has(fbId); }
}

let instance: LoopEngine | null = null;
export function getLoopEngine(): LoopEngine {
  if (!instance) instance = new LoopEngine();
  return instance;
}
