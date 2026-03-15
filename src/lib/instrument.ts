import { getSynth } from './synth';
import type { SynthVoice } from './synth';
import { getInternalMidiBus } from './internalMidiBus';

/**
 * Polyphonic instrument that subscribes to the internal MIDI bus and manages
 * audio voices. Latch voices (user-held notes) and arp voices are kept in
 * separate maps so arp note-offs never clobber a held note.
 *
 * The playFn can be swapped out (e.g. for monochord mode) without touching
 * the bus wiring.
 */
class PolyphonicInstrument {
  /** Factory for creating a new voice — defaults to the main synth. */
  playFn: (frequency: number) => SynthVoice = freq => getSynth().play(freq);

  private latchVoices = new Map<number, SynthVoice>();
  private arpVoices = new Map<number, SynthVoice>();

  constructor() {
    const bus = getInternalMidiBus();

    bus.onNoteOn(({ semitones, frequency, source }) => {
      if (source === 'latch-sampler') return;
      if (source === 'arp') {
        this.arpVoices.get(semitones)?.stop();
        this.arpVoices.set(semitones, this.playFn(frequency));
      } else {
        // latch / latch-synth (or untagged)
        this.latchVoices.get(semitones)?.stop();
        this.latchVoices.set(semitones, this.playFn(frequency));
      }
    });

    bus.onNoteOff(({ semitones, source }) => {
      if (source === 'latch-sampler') return;
      if (source === 'arp') {
        this.arpVoices.get(semitones)?.stop();
        this.arpVoices.delete(semitones);
      } else {
        this.latchVoices.get(semitones)?.stop();
        this.latchVoices.delete(semitones);
      }
    });

    bus.onAllNotesOff(() => this.stopAll());
  }

  /** Stop and release all voices across both maps. */
  stopAll(): void {
    for (const v of this.latchVoices.values()) v.stop();
    this.latchVoices.clear();
    for (const v of this.arpVoices.values()) v.stop();
    this.arpVoices.clear();
  }

  /** Portamento-slide an already-playing latch voice to a new frequency. */
  setLatchFrequency(semitones: number, frequency: number, portamentoSeconds: number): void {
    this.latchVoices.get(semitones)?.setFrequency(frequency, portamentoSeconds);
  }
}

let instance: PolyphonicInstrument | null = null;

export function getInstrument(): PolyphonicInstrument {
  if (!instance) instance = new PolyphonicInstrument();
  return instance;
}
