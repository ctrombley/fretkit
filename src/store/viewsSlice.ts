import type { GeneratorPreset } from '../lib/derivation';
import type { SymmetricDivision } from '../lib/coltrane';
import type { StoreSet } from './types';

export function createViewsSlice(set: StoreSet) {
  return {
    spiralRoot: 0,
    spiralMode: 'major' as const,
    spiralHighlightedChord: null as number | null,
    overtoneRoot: 9,
    overtoneOctave: 2,
    overtoneCount: 16,
    overtoneShowET: false,
    overtoneMode: 'ji' as const,
    derivationGenerator: 'fifths' as GeneratorPreset,
    derivationSteps: 12,
    derivationActiveStep: null as number | null,
    derivationDivisions: 12,
    coltraneRoot: 0,
    coltraneDivision: 3 as SymmetricDivision,
    coltraneMode: 'circle' as const,
    coltraneOrdering: 'fifths' as const,
    coltraneShowCadences: false,
    coltraneHighlightedAxis: null as number | null,
    coltraneSeriesPlaying: false,
    overtoneSeriesPlaying: false,

    // Monochord persistent state
    monochordDroneOn: false,
    monochordBinaural: false,
    monochordFundamentalName: 'A2',
    monochordBridgePos: 2 / 3,

    setSpiralRoot: (root: number) => set({ spiralRoot: root, spiralHighlightedChord: null }),
    setSpiralMode: (mode: 'major' | 'minor') => set({ spiralMode: mode, spiralHighlightedChord: null }),
    setSpiralHighlightedChord: (degree: number | null) => set({ spiralHighlightedChord: degree }),
    setOvertoneRoot: (root: number) => set({ overtoneRoot: root }),
    setOvertoneOctave: (octave: number) => set({ overtoneOctave: octave }),
    setOvertoneCount: (count: number) => set({ overtoneCount: count }),
    setOvertoneShowET: (show: boolean) => set({ overtoneShowET: show }),
    setOvertoneMode: (mode: 'ji' | 'et' | 'derive') => set({ overtoneMode: mode }),
    setDerivationGenerator: (preset: GeneratorPreset) => set({ derivationGenerator: preset }),
    setDerivationSteps: (steps: number) => set({ derivationSteps: steps }),
    setDerivationActiveStep: (step: number | null) => set({ derivationActiveStep: step }),
    setDerivationDivisions: (n: number) => set({ derivationDivisions: n }),
    setColtraneRoot: (root: number) => set({ coltraneRoot: root, coltraneHighlightedAxis: null }),
    setColtraneDivision: (division: SymmetricDivision) => set({ coltraneDivision: division, coltraneHighlightedAxis: null }),
    setColtraneMode: (mode: 'circle' | 'mandala') => set({ coltraneMode: mode }),
    setColtraneOrdering: (ordering: 'fifths' | 'chromatic') => set({ coltraneOrdering: ordering }),
    setColtraneShowCadences: (show: boolean) => set({ coltraneShowCadences: show }),
    setColtraneHighlightedAxis: (axis: number | null) => set({ coltraneHighlightedAxis: axis }),
    setColtraneSeriesPlaying: (playing: boolean) => set({ coltraneSeriesPlaying: playing }),
    setOvertoneSeriesPlaying: (playing: boolean) => set({ overtoneSeriesPlaying: playing }),
    setMonochordDroneOn: (on: boolean) => set({ monochordDroneOn: on }),
    setMonochordBinaural: (on: boolean) => set({ monochordBinaural: on }),
    setMonochordFundamentalName: (name: string) => set({ monochordFundamentalName: name }),
    setMonochordBridgePos: (pos: number) => set({ monochordBridgePos: pos }),
  };
}
