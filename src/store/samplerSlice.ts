import type { AppState, StoreSet } from './types';
import type { SamplerParams } from '../lib/sampler';
import { getSampler, DEFAULT_SAMPLER_PARAMS } from '../lib/sampler';
import type { SamplerSlotDef, SamplerPreset } from '../lib/samplerPresets';
import { getMasterBus } from '../lib/masterBus';

export type { SamplerSlotDef, SamplerPreset };

export const SAMPLER_PERSISTED_KEYS: (keyof AppState)[] = [
  'samplerMode',
  'samplerSlots',
  'samplerKeyMap',
  'samplerSlotParams',
  'samplerSlotRootNotes',
  'samplerSelectedSlot',
  'samplerPresets',
  'samplerActivePresetIndex',
  'samplerAutoSave',
  'samplerCrossfade',
];

// Equal-power crossfade: 0 = full synth, 1 = full sampler
function applyCrossfade(v: number): void {
  const master = getMasterBus();
  master.getBus('synth').setCrossfadeGain(Math.cos(v * Math.PI / 2));
  master.getBus('sampler').setCrossfadeGain(Math.sin(v * Math.PI / 2));
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function createSamplerSlice(set: StoreSet) {
  return {
    samplerMode: 'synth' as 'synth' | 'sampler',
    samplerSlots: new Array<SamplerSlotDef | null>(16).fill(null) as (SamplerSlotDef | null)[],
    samplerKeyMap: new Array<number | null>(128).fill(null) as (number | null)[],
    samplerSlotParams: new Array<SamplerParams>(16).fill({ ...DEFAULT_SAMPLER_PARAMS }) as SamplerParams[],
    samplerSlotRootNotes: new Array<number | null>(16).fill(null) as (number | null)[],
    samplerSelectedSlot: null as number | null,
    samplerPresets: [] as SamplerPreset[],
    samplerActivePresetIndex: null as number | null,
    samplerAutoSave: null as { slots: (SamplerSlotDef | null)[]; keyMap: (number | null)[]; params: SamplerParams[]; rootNotes: (number | null)[]; timestamp: number } | null,
    samplerCrossfade: 0.5,

    setSamplerMode: (mode: 'synth' | 'sampler') => set({ samplerMode: mode }),

    setSamplerCrossfade: (v: number) => {
      set({ samplerCrossfade: v });
      applyCrossfade(v);
    },

    setSamplerSlot: (idx: number, slot: SamplerSlotDef | null) =>
      set(s => {
        const slots = [...s.samplerSlots];
        slots[idx] = slot;
        const rootNotes = [...s.samplerSlotRootNotes];
        rootNotes[idx] = slot?.rootNote ?? null;
        const params = [...s.samplerSlotParams];
        params[idx] = slot?.params ?? { ...DEFAULT_SAMPLER_PARAMS };
        return { samplerSlots: slots, samplerSlotRootNotes: rootNotes, samplerSlotParams: params };
      }),

    setSamplerSlotUrl: (idx: number, url: string) => {
      set(s => {
        const slots = [...s.samplerSlots];
        const existing = slots[idx];
        slots[idx] = {
          name: existing?.name ?? url.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? 'Sample',
          url,
          color: existing?.color ?? '#888888',
          rootNote: existing?.rootNote ?? null,
          params: existing?.params ?? { ...DEFAULT_SAMPLER_PARAMS },
        };
        return { samplerSlots: slots };
      });
      getSampler().loadSample(idx, url).catch(console.error);
    },

    setSamplerSlotFile: (idx: number, file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result;
        if (!(buf instanceof ArrayBuffer)) return;
        set(s => {
          const slots = [...s.samplerSlots];
          const existing = slots[idx];
          slots[idx] = {
            name: existing?.name ?? file.name.replace(/\.[^/.]+$/, ''),
            url: '',
            color: existing?.color ?? '#888888',
            rootNote: existing?.rootNote ?? null,
            params: existing?.params ?? { ...DEFAULT_SAMPLER_PARAMS },
          };
          return { samplerSlots: slots };
        });
        getSampler().loadSample(idx, buf).catch(console.error);
      };
      reader.readAsArrayBuffer(file);
    },

    setSamplerSlotParam: (idx: number, key: keyof SamplerParams, val: SamplerParams[keyof SamplerParams]) =>
      set(s => {
        const params = [...s.samplerSlotParams];
        params[idx] = { ...(params[idx] ?? DEFAULT_SAMPLER_PARAMS), [key]: val };
        scheduleAutoSave(set, s, params);
        return { samplerSlotParams: params };
      }),

    setSamplerKeyMap: (keyMap: (number | null)[]) => {
      set(s => {
        scheduleAutoSave(set, s, s.samplerSlotParams, keyMap);
        return { samplerKeyMap: keyMap };
      });
    },

    mapSlotToKey: (slotIdx: number, dropNote: number) =>
      set(s => {
        const keyMap = [...s.samplerKeyMap];

        // Find lower bound: first note < dropNote that maps to a DIFFERENT slot
        let lowerBound = 0;
        for (let n = dropNote - 1; n >= 0; n--) {
          if (keyMap[n] !== null && keyMap[n] !== slotIdx) {
            lowerBound = n + 1;
            break;
          }
        }

        // Fill from dropNote down to lowerBound
        for (let n = lowerBound; n <= dropNote; n++) {
          keyMap[n] = slotIdx;
        }

        // Set root note on the slot
        const rootNotes = [...s.samplerSlotRootNotes];
        rootNotes[slotIdx] = dropNote;

        // Update the slot's rootNote field too
        const slots = [...s.samplerSlots];
        if (slots[slotIdx]) {
          slots[slotIdx] = { ...slots[slotIdx]!, rootNote: dropNote };
        }

        scheduleAutoSave(set, s, s.samplerSlotParams, keyMap);
        return { samplerKeyMap: keyMap, samplerSlotRootNotes: rootNotes, samplerSlots: slots };
      }),

    unmapSlot: (slotIdx: number) =>
      set(s => {
        const keyMap = s.samplerKeyMap.map(v => v === slotIdx ? null : v);
        scheduleAutoSave(set, s, s.samplerSlotParams, keyMap);
        return { samplerKeyMap: keyMap };
      }),

    setSamplerSelectedSlot: (idx: number | null) => set({ samplerSelectedSlot: idx }),

    saveSamplerPreset: (name: string) =>
      set(s => ({
        samplerPresets: [
          ...s.samplerPresets,
          {
            name,
            isFactory: false,
            slots: [...s.samplerSlots],
            keyMap: [...s.samplerKeyMap],
          } satisfies SamplerPreset,
        ],
      })),

    loadSamplerPreset: (idx: number) =>
      set(s => {
        const preset = s.samplerPresets[idx];
        if (!preset) return {};
        // Load all samples from preset URLs
        preset.slots.forEach((slot, i) => {
          if (slot?.url) {
            getSampler().loadSample(i, slot.url).catch(console.error);
          }
        });
        return {
          samplerSlots: [...preset.slots],
          samplerKeyMap: [...preset.keyMap],
          samplerActivePresetIndex: idx,
          samplerSlotParams: preset.slots.map(s => s?.params ?? { ...DEFAULT_SAMPLER_PARAMS }),
          samplerSlotRootNotes: preset.slots.map(s => s?.rootNote ?? null),
        };
      }),

    deleteSamplerPreset: (idx: number) =>
      set(s => ({
        samplerPresets: s.samplerPresets.filter((_, i) => i !== idx),
        samplerActivePresetIndex:
          s.samplerActivePresetIndex === idx ? null : s.samplerActivePresetIndex,
      })),

    renameSamplerPreset: (idx: number, name: string) =>
      set(s => {
        const presets = [...s.samplerPresets];
        const p = presets[idx];
        if (p) presets[idx] = { ...p, name };
        return { samplerPresets: presets };
      }),

    triggerSamplerAutoSave: () =>
      set(s => ({
        samplerAutoSave: {
          slots: [...s.samplerSlots],
          keyMap: [...s.samplerKeyMap],
          params: [...s.samplerSlotParams],
          rootNotes: [...s.samplerSlotRootNotes],
          timestamp: Date.now(),
        },
      })),
  };
}

function scheduleAutoSave(
  set: StoreSet,
  _state: AppState,
  params: SamplerParams[],
  keyMap?: (number | null)[],
): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    set(s => ({
      samplerAutoSave: {
        slots: [...s.samplerSlots],
        keyMap: keyMap ? [...keyMap] : [...s.samplerKeyMap],
        params: [...params],
        rootNotes: [...s.samplerSlotRootNotes],
        timestamp: Date.now(),
      },
    }));
  }, 2000);
}
