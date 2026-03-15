import { getSampler } from './sampler';
import { getInternalMidiBus } from './internalMidiBus';
import type { SamplerParams } from './sampler';

type GetSamplerState = () => {
  samplerKeyMap: (number | null)[];
  samplerSlotParams: SamplerParams[];
  samplerSlotRootNotes: (number | null)[];
};

class SamplerInstrument {
  constructor(getState: GetSamplerState) {
    const bus = getInternalMidiBus();

    bus.onNoteOn(({ semitones, velocity, source }) => {
      if (source === 'latch-synth') return;
      const { samplerKeyMap, samplerSlotParams, samplerSlotRootNotes } = getState();
      getSampler().noteOn(semitones, velocity ?? 100, samplerKeyMap, samplerSlotParams, samplerSlotRootNotes);
    });

    bus.onNoteOff(({ semitones, source }) => {
      if (source === 'latch-synth') return;
      const { samplerKeyMap, samplerSlotParams } = getState();
      getSampler().noteOff(semitones, samplerSlotParams, samplerKeyMap);
    });

    bus.onAllNotesOff(() => {
      getSampler().stopAll();
    });
  }
}

let instance: SamplerInstrument | null = null;

export function bootSamplerInstrument(getState: GetSamplerState): void {
  if (!instance) instance = new SamplerInstrument(getState);
}
