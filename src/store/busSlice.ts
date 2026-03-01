import { getMasterBus, BUS_IDS } from '../lib/masterBus';
import type { AppState, StoreSet } from './types';

export const BUS_PERSISTED_KEYS: (keyof AppState)[] = [
  'buses',
  'masterBusVolume',
  'masterBusMuted',
];

const DEFAULT_BUSES: Record<string, { volume: number; muted: boolean }> = {};
for (const id of BUS_IDS) {
  DEFAULT_BUSES[id] = { volume: 1.0, muted: false };
}

export function createBusSlice(set: StoreSet) {
  return {
    buses: { ...DEFAULT_BUSES } as Record<string, { volume: number; muted: boolean }>,
    masterBusVolume: 0.8,
    masterBusMuted: false,

    setBusVolume: (busId: string, volume: number) => {
      set((s) => ({
        buses: {
          ...s.buses,
          [busId]: { ...s.buses[busId]!, volume },
        },
      }));
      getMasterBus().getBus(busId).setVolume(volume);
    },

    setBusMuted: (busId: string, muted: boolean) => {
      set((s) => ({
        buses: {
          ...s.buses,
          [busId]: { ...s.buses[busId]!, muted },
        },
      }));
      getMasterBus().getBus(busId).setMuted(muted);
    },

    setMasterBusVolume: (volume: number) => {
      set({ masterBusVolume: volume });
      getMasterBus().setMasterVolume(volume);
    },

    setMasterBusMuted: (muted: boolean) => {
      set({ masterBusMuted: muted });
      getMasterBus().setMasterMuted(muted);
    },
  };
}
