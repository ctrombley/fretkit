import { SynthEngine } from './synth';
import type { SynthParams } from './synth';
import { getMasterBus } from './masterBus';

// Dedicated synth for the Spiral view, routed through the 'spiral' bus
// so mixer muting the Fretboard bus doesn't silence spiral playback.
let spiralSynth: SynthEngine | null = null;

function getSpiralSynth(): SynthEngine {
  if (!spiralSynth) {
    spiralSynth = new SynthEngine();
    // Disconnect from the default sandbox bus and reconnect to spiral bus
    spiralSynth['masterGain'].disconnect();
    spiralSynth['masterGain'].connect(getMasterBus().getBus('spiral').input);
  }
  return spiralSynth;
}

export function play(frequency: number): { stop: () => void } {
  return getSpiralSynth().play(frequency);
}

export function updateSpiralParams(partial: Partial<SynthParams>): void {
  getSpiralSynth().updateParams(partial);
}
