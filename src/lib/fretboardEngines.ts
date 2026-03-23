/**
 * Per-fretboard SynthEngine registry.
 *
 * Each fretboard in the sandbox gets its own SynthEngine instance so that
 * different fretboards can have independent synth parameters and note playback
 * without "last fretboard wins" races. The sampler stays global (shared).
 *
 * Engines share the single AudioContext from MasterBusEngine and all connect
 * to the 'sandbox' bus, so bus-level volume/mute still applies globally.
 */

import { SynthEngine, DEFAULT_PARAMS } from './synth';
import type { SynthParams, SynthVoice } from './synth';

interface FretboardEngineEntry {
  synth: SynthEngine;
  /** Latch voices keyed by semitones — for direct note-on/off without the bus */
  latchVoices: Map<number, SynthVoice>;
}

const registry = new Map<string, FretboardEngineEntry>();

/** Get (or lazily create) the engine entry for a fretboard. */
export function getEngineForFretboard(id: string): FretboardEngineEntry {
  if (!registry.has(id)) {
    const synth = new SynthEngine();
    registry.set(id, { synth, latchVoices: new Map() });
  }
  return registry.get(id)!;
}

/**
 * Create an engine entry for a new fretboard and apply the given params.
 * Calling this eagerly (on fretboard creation) avoids the lazy-init audio
 * context suspension that can happen if the context hasn't been resumed yet.
 */
export function initEngineForFretboard(id: string, params: SynthParams): void {
  const entry = getEngineForFretboard(id);
  entry.synth.updateParams(params);
}

/** Stop all voices and remove the engine when a fretboard is deleted. */
export function destroyEngineForFretboard(id: string): void {
  const entry = registry.get(id);
  if (!entry) return;
  for (const voice of entry.latchVoices.values()) voice.stop();
  entry.synth.killAll();
  registry.delete(id);
}

/** Apply SynthParams to a fretboard's engine (used by preset loading). */
export function applyParamsToEngine(id: string, params: SynthParams): void {
  const entry = getEngineForFretboard(id);
  entry.synth.resetLfoBase(1);
  entry.synth.resetLfoBase(2);
  entry.synth.updateParams(params);
}

/** Kill all latch voices across every registered engine (global kill-all). */
export function killAllEngines(): void {
  for (const entry of registry.values()) {
    for (const voice of entry.latchVoices.values()) voice.stop();
    entry.latchVoices.clear();
    entry.synth.killAll();
  }
}

export type { SynthParams };
export { DEFAULT_PARAMS };
