/**
 * Tests for samplerSlice — mapSlotToKey range-fill logic and unmapSlot.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/masterBus', () => ({
  getMasterBus: () => ({
    getBus: () => ({ setCrossfadeGain: vi.fn() }),
  }),
}));

vi.mock('../../lib/sampler', () => ({
  getSampler: () => ({ loadSample: vi.fn() }),
  DEFAULT_SAMPLER_PARAMS: {
    startFraction: 0, endFraction: 1, loop: false, loopStartFraction: 0,
    loopEndFraction: 1, reverse: false, amplitude: 1, pitchSemitones: 0,
    attack: 0, decay: 0, sustain: 1, release: 0,
  },
}));

import { createSamplerSlice } from '../samplerSlice';
import type { AppState } from '../types';

function makeStore() {
  let state: Partial<AppState> = {};
  const set = (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    state = { ...state, ...(typeof partial === 'function' ? partial(state as AppState) : partial) };
  };
  const get = () => state as AppState;
  const slice = createSamplerSlice(set);
  state = { ...slice } as Partial<AppState>;
  return { get, slice };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('mapSlotToKey', () => {
  it('maps drop note and all notes down to 0 when the map is empty', () => {
    const { get, slice } = makeStore();
    slice.mapSlotToKey(0, 60);
    const km = get().samplerKeyMap;
    for (let n = 0; n <= 60; n++) expect(km[n]).toBe(0);
    // Notes above drop note remain null
    expect(km[61]).toBeNull();
  });

  it('stops fill at a different slot boundary below the drop note', () => {
    const { get, slice } = makeStore();
    // Manually set only key 40 to slot 1 (lower boundary)
    const initialMap = new Array(128).fill(null) as (number | null)[];
    initialMap[40] = 1;
    slice.setSamplerKeyMap(initialMap);
    // Map slot 0 to 60; lower bound should be 41 (slot 1 at 40)
    slice.mapSlotToKey(0, 60);
    const km = get().samplerKeyMap;
    expect(km[40]).toBe(1);   // slot 1 still owns 40
    expect(km[41]).toBe(0);   // slot 0 range starts at 41
    expect(km[60]).toBe(0);   // slot 0 owns the drop note
    expect(km[61]).toBeNull(); // nothing filled above drop note
  });

  it('fills contiguously with no gaps between lowerBound and dropNote', () => {
    const { get, slice } = makeStore();
    slice.mapSlotToKey(2, 72);
    const km = get().samplerKeyMap;
    for (let n = 0; n <= 72; n++) expect(km[n]).toBe(2);
    expect(km[73]).toBeNull();
  });

  it('sets the root note on the slot entry', () => {
    const { get, slice } = makeStore();
    // Give slot 0 an actual slot definition first
    const fakeSlot = { name: 'test', url: '', color: '#f00', rootNote: null, params: {} as never };
    slice.setSamplerSlot(0, fakeSlot);
    slice.mapSlotToKey(0, 64);
    expect(get().samplerSlotRootNotes[0]).toBe(64);
    expect(get().samplerSlots[0]!.rootNote).toBe(64);
  });

  it('does not change root note when re-dragging an already-mapped slot', () => {
    const { get, slice } = makeStore();
    const fakeSlot = { name: 'test', url: '', color: '#f00', rootNote: null, params: {} as never };
    slice.setSamplerSlot(0, fakeSlot);
    slice.mapSlotToKey(0, 64);
    expect(get().samplerSlotRootNotes[0]).toBe(64);
    // Re-drag to a different key
    slice.mapSlotToKey(0, 72);
    // Root note must not change — changing it would shift pitch of all mapped keys
    expect(get().samplerSlotRootNotes[0]).toBe(64);
    expect(get().samplerSlots[0]!.rootNote).toBe(64);
  });
});

describe('unmapSlot', () => {
  it('removes all key-map entries for the given slot', () => {
    const { get, slice } = makeStore();
    slice.mapSlotToKey(0, 60);
    slice.unmapSlot(0);
    const km = get().samplerKeyMap;
    for (let n = 0; n <= 60; n++) expect(km[n]).toBeNull();
  });

  it('leaves other slots untouched', () => {
    const { get, slice } = makeStore();
    slice.mapSlotToKey(0, 48);
    slice.mapSlotToKey(1, 72);
    slice.unmapSlot(0);
    const km = get().samplerKeyMap;
    expect(km[48]).toBeNull();
    expect(km[72]).toBe(1);
  });
});
