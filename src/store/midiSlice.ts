import { getMidiRouter } from '../lib/midiRouter';
import { BUS_IDS } from '../lib/masterBus';
import type { MidiChannel, MidiBusConfig } from '../lib/midi';
import type { AppState, StoreSet } from './types';

export const MIDI_PERSISTED_KEYS: (keyof AppState)[] = [
  'midiBuses',
];

const DEFAULT_MIDI_BUSES: Record<string, MidiBusConfig> = {};
for (const id of BUS_IDS) {
  DEFAULT_MIDI_BUSES[id] = { enabled: false, receiveChannel: 'all', transmitChannel: 1 };
}

export function createMidiSlice(set: StoreSet) {
  return {
    midiBuses: { ...DEFAULT_MIDI_BUSES } as Record<string, MidiBusConfig>,

    setMidiEnabled: (toyId: string, enabled: boolean) => {
      set((s) => ({
        midiBuses: {
          ...s.midiBuses,
          [toyId]: { ...s.midiBuses[toyId]!, enabled },
        },
      }));
      getMidiRouter().updateConfig(toyId, { enabled });
    },

    setMidiReceiveChannel: (toyId: string, channel: MidiChannel) => {
      set((s) => ({
        midiBuses: {
          ...s.midiBuses,
          [toyId]: { ...s.midiBuses[toyId]!, receiveChannel: channel },
        },
      }));
      getMidiRouter().updateConfig(toyId, { receiveChannel: channel });
    },

    setMidiTransmitChannel: (toyId: string, channel: number) => {
      set((s) => ({
        midiBuses: {
          ...s.midiBuses,
          [toyId]: { ...s.midiBuses[toyId]!, transmitChannel: channel },
        },
      }));
      getMidiRouter().updateConfig(toyId, { transmitChannel: channel });
    },
  };
}
