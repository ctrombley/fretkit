import type { StoreSet } from './types';
import type { ScaleEntry, UserScalePreset } from '../lib/monochordScales';
import { FACTORY_SCALE_PRESETS } from '../lib/monochordScales';

export const MONOCHORD_SCALES_PERSISTED_KEYS = [
  'monochordScaleId',
  'monochordCustomEntries',
  'monochordUserPresets',
] as const;

export function createMonochordScalesSlice(set: StoreSet) {
  return {
    monochordScaleId:      FACTORY_SCALE_PRESETS[1]!.id,  // default: JI Major
    monochordCustomEntries: [] as ScaleEntry[],
    monochordUserPresets:   [] as UserScalePreset[],

    setMonochordScaleId: (id: string) => set({ monochordScaleId: id }),

    addMonochordCustomEntry: (entry: ScaleEntry) =>
      set(s => ({
        monochordCustomEntries: s.monochordCustomEntries.some(
          e => Math.abs(e.pos - entry.pos) < 0.002,
        )
          ? s.monochordCustomEntries
          : [...s.monochordCustomEntries, entry],
        // Switch active scale to custom so the pin is immediately visible
        monochordScaleId: 'custom',
      })),

    removeMonochordCustomEntry: (pos: number) =>
      set(s => ({
        monochordCustomEntries: s.monochordCustomEntries.filter(
          e => Math.abs(e.pos - pos) >= 0.002,
        ),
      })),

    clearMonochordCustomEntries: () => set({ monochordCustomEntries: [] }),

    saveMonochordUserPreset: (name: string, entries: ScaleEntry[]) =>
      set(s => ({
        monochordUserPresets: [
          ...s.monochordUserPresets,
          { id: `user-${Date.now()}`, name, entries } satisfies UserScalePreset,
        ],
      })),

    deleteMonochordUserPreset: (id: string) =>
      set(s => ({
        monochordUserPresets: s.monochordUserPresets.filter(p => p.id !== id),
        // Reset to first factory preset if the deleted preset was active
        monochordScaleId:
          s.monochordScaleId === id
            ? FACTORY_SCALE_PRESETS[1]!.id
            : s.monochordScaleId,
      })),
  };
}
