import { SynthEngine } from './synth';
import type { SynthParams } from './synth';
import { getMasterBus } from './masterBus';

function makeSynth(busId: string): SynthEngine {
  const synth = new SynthEngine();
  synth['masterGain'].disconnect();
  synth['masterGain'].connect(getMasterBus().getBus(busId).input);
  return synth;
}

// Wheel view — 'spiral' bus
let spiralSynth: SynthEngine | null = null;
function getSpiralSynth(): SynthEngine {
  if (!spiralSynth) spiralSynth = makeSynth('spiral');
  return spiralSynth;
}

// Overtone Spiral view — 'overtones' bus
let overtoneSynth: SynthEngine | null = null;
function getOvertoneSynth(): SynthEngine {
  if (!overtoneSynth) overtoneSynth = makeSynth('overtones');
  return overtoneSynth;
}

/** Play a note through the Wheel view synth. */
export function play(frequency: number): { stop: () => void } {
  return getSpiralSynth().play(frequency);
}

/** Play a note through the Overtone Spiral synth. */
export function playOvertone(frequency: number): { stop: () => void } {
  return getOvertoneSynth().play(frequency);
}

export function updateSpiralParams(partial: Partial<SynthParams>): void {
  getSpiralSynth().updateParams(partial);
}

export function updateOvertoneParams(partial: Partial<SynthParams>): void {
  getOvertoneSynth().updateParams(partial);
}
