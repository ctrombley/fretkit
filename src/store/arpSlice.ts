import { getSynth } from '../lib/synth';
import { getArpeggiator } from '../lib/arpeggiator';
import type { ArpPattern } from '../lib/arpeggiator';
import { latchVoices } from './latchVoices';
import type { AppState, StoreSet, StoreGet } from './types';

export const ARP_PERSISTED_KEYS: (keyof AppState)[] = [
  'arpEnabled',
  'arpPattern',
  'arpOctaveRange',
  'arpSync',
  'arpSyncSpeed',
  'arpFreeMs',
];

export function createArpSlice(set: StoreSet, get: StoreGet) {
  return {
    arpEnabled: false,
    arpPattern: 'up' as ArpPattern,
    arpOctaveRange: 1,
    arpSync: true,
    arpSyncSpeed: 2,
    arpFreeMs: 200,
    arpStrikeNote: null as number | null,
    arpStrikeCount: 0,

    setArpEnabled: (enabled: boolean) => {
      const state = get();
      const arp = getArpeggiator();
      if (enabled) {
        for (const v of latchVoices.values()) v.stop();
        latchVoices.clear();
        arp.enable();
        for (const semi of state.sandboxActiveNotes) {
          const freq = 440 * Math.pow(2, (semi - 69) / 12);
          arp.addNote(freq, semi);
        }
      } else {
        arp.disable();
        arp.clear();
        for (const semi of state.sandboxActiveNotes) {
          const freq = 440 * Math.pow(2, (semi - 69) / 12);
          latchVoices.set(semi, getSynth().play(freq));
        }
      }
      set({ arpEnabled: enabled });
    },

    setArpPattern: (pattern: ArpPattern) => {
      set({ arpPattern: pattern });
      getArpeggiator().pattern = pattern;
    },

    setArpOctaveRange: (range: number) => {
      set({ arpOctaveRange: range });
      getArpeggiator().setOctaveRange(range);
    },

    setArpSync: (sync: boolean) => set({ arpSync: sync }),
    setArpSyncSpeed: (speed: number) => set({ arpSyncSpeed: speed }),
    setArpFreeMs: (ms: number) => set({ arpFreeMs: ms }),
  };
}
