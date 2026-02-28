import { getSynth } from '../lib/synth';
import type { MetronomeTimbre } from '../lib/metronome';
import type { AppState, StoreSet } from './types';

export const TRANSPORT_PERSISTED_KEYS: (keyof AppState)[] = [
  'transportBpm',
  'transportBeatsPerMeasure',
  'transportBeatUnit',
  'metronomeVolume',
  'metronomeMuted',
  'metronomeTimbre',
  'metronomeSubdivision',
  'metronomeSubdivisionAccent',
  'keyboardPanelOpen',
  'transportBarOpen',
];

export function createTransportSlice(set: StoreSet) {
  return {
    transportPlaying: false,
    transportBpm: 120,
    transportBeatsPerMeasure: 4,
    transportBeatUnit: 4,
    transportCurrentBeat: 0,
    transportCurrentMeasure: 0,
    metronomeVolume: 0.7,
    metronomeMuted: false,
    metronomeTimbre: 'click' as MetronomeTimbre,
    metronomeSubdivision: 1,
    metronomeSubdivisionAccent: true,
    keyboardPanelOpen: false,
    transportBarOpen: true,

    setTransportPlaying: (playing: boolean) => set({ transportPlaying: playing }),
    setTransportBpm: (bpm: number) => {
      set({ transportBpm: bpm });
      getSynth().setBpmBase(bpm);
    },
    setTransportTimeSignature: (beats: number, unit: number) =>
      set({ transportBeatsPerMeasure: beats, transportBeatUnit: unit }),
    setTransportBeat: (beat: number, measure: number) =>
      set({ transportCurrentBeat: beat, transportCurrentMeasure: measure }),
    setMetronomeVolume: (volume: number) => set({ metronomeVolume: volume }),
    setMetronomeMuted: (muted: boolean) => set({ metronomeMuted: muted }),
    setMetronomeTimbre: (timbre: MetronomeTimbre) => set({ metronomeTimbre: timbre }),
    setMetronomeSubdivision: (subdivision: number) => set({ metronomeSubdivision: subdivision }),
    setMetronomeSubdivisionAccent: (accent: boolean) => set({ metronomeSubdivisionAccent: accent }),
    setKeyboardPanelOpen: (open: boolean) => set({ keyboardPanelOpen: open }),
    setTransportBarOpen: (open: boolean) => set({ transportBarOpen: open }),
  };
}
