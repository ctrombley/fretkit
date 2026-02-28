import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import type { View, Song, ChordConfig, SongExport } from '../types';
import type { GeneratorPreset } from '../lib/derivation';
import type { SymmetricDivision } from '../lib/coltrane';
import type { OscWaveform, SynthParams, LfoWaveform, LfoTargetParam } from '../lib/synth';
import type { SynthPreset } from '../lib/synthPresets';
import type { MetronomeTimbre } from '../lib/metronome';
import type { ArpPattern } from '../lib/arpeggiator';

export interface FretboardState {
  id: number;
  current: { name: string; type: string; root?: Note } | null;
  fretCount: number;
  inversion: number;
  litNotes: Note[];
  position: number;
  searchStr: string;
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  sequences: Sequence[];
  startingFret: number;
  tuning: string[];
}

export interface Settings {
  settingsId: string;
  sidebarOpen: boolean;
}

export type StoreSet = (
  partial: Partial<AppState> | ((state: AppState) => Partial<AppState>),
) => void;

export type StoreGet = () => AppState;

export interface AppState {
  // Sandbox
  fretboards: Record<string, FretboardState>;
  settings: Settings;

  // Navigation
  view: View;

  // Songs
  songs: Record<string, Song>;
  activeSongChordId: string | null;

  // Spiral
  spiralRoot: number;
  spiralMode: 'major' | 'minor';
  spiralHighlightedChord: number | null;

  // Spiral actions
  setSpiralRoot: (root: number) => void;
  setSpiralMode: (mode: 'major' | 'minor') => void;
  setSpiralHighlightedChord: (degree: number | null) => void;

  // Overtones
  overtoneRoot: number;
  overtoneOctave: number;
  overtoneCount: number;
  overtoneShowET: boolean;
  overtoneMode: 'ji' | 'et' | 'derive';

  // Derivation
  derivationGenerator: GeneratorPreset;
  derivationSteps: number;
  derivationActiveStep: number | null;
  derivationDivisions: number;

  // Overtone actions
  setOvertoneRoot: (root: number) => void;
  setOvertoneOctave: (octave: number) => void;
  setOvertoneCount: (count: number) => void;
  setOvertoneShowET: (show: boolean) => void;
  setOvertoneMode: (mode: 'ji' | 'et' | 'derive') => void;

  // Derivation actions
  setDerivationGenerator: (preset: GeneratorPreset) => void;
  setDerivationSteps: (steps: number) => void;
  setDerivationActiveStep: (step: number | null) => void;
  setDerivationDivisions: (n: number) => void;

  // Coltrane
  coltraneRoot: number;
  coltraneDivision: SymmetricDivision;
  coltraneMode: 'circle' | 'mandala';
  coltraneOrdering: 'fifths' | 'chromatic';
  coltraneShowCadences: boolean;
  coltraneHighlightedAxis: number | null;

  // Transport
  transportPlaying: boolean;
  transportBpm: number;
  transportBeatsPerMeasure: number;
  transportBeatUnit: number;
  transportCurrentBeat: number;
  transportCurrentMeasure: number;

  // Metronome
  metronomeVolume: number;
  metronomeMuted: boolean;
  metronomeTimbre: MetronomeTimbre;
  metronomeSubdivision: number;
  metronomeSubdivisionAccent: boolean;

  // Synth
  synthWaveform: OscWaveform;
  synthFilterCutoff: number;
  synthFilterResonance: number;
  synthAttack: number;
  synthDecay: number;
  synthSustain: number;
  synthRelease: number;
  synthPan: number;
  synthReverbSend: number;
  synthDelaySend: number;
  synthDelayTime: number;
  synthDelayFeedback: number;
  synthDelayPingPong: boolean;
  synthMasterVolume: number;
  synthKeyboardMode: 'classic' | 'isomorphic';
  // Osc2
  synthOsc2Waveform: OscWaveform;
  synthOsc2Detune: number;
  synthOsc2Mix: number;
  // FM
  synthFmMode: boolean;
  synthFmDepth: number;
  // LFO1
  synthLfo1Rate: number;
  synthLfo1Depth: number;
  synthLfo1Waveform: LfoWaveform;
  synthLfo1Target: LfoTargetParam;
  synthLfo1Bloom: boolean;
  // LFO2
  synthLfo2Rate: number;
  synthLfo2Depth: number;
  synthLfo2Waveform: LfoWaveform;
  synthLfo2Target: LfoTargetParam;
  synthLfo2Bloom: boolean;
  // Presets
  synthPresets: SynthPreset[];
  synthActivePresetIndex: number | null;

  // Per-view synth snapshots
  viewSynthSnapshots: Record<string, { params: SynthParams; presetIndex: number | null }>;

  // Transport actions
  setTransportPlaying: (playing: boolean) => void;
  setTransportBpm: (bpm: number) => void;
  setTransportTimeSignature: (beats: number, unit: number) => void;
  setTransportBeat: (beat: number, measure: number) => void;

  // Panels
  keyboardPanelOpen: boolean;
  transportBarOpen: boolean;

  // Bloom
  bloomAllOctaves: boolean;

  // Sandbox latch
  sandboxLatch: boolean;
  sandboxActiveNotes: number[];

  // Arpeggiator
  arpEnabled: boolean;
  arpPattern: ArpPattern;
  arpOctaveRange: number;
  arpSync: boolean;
  arpSyncSpeed: number;
  arpFreeMs: number;
  arpStrikeNote: number | null;
  arpStrikeCount: number;

  // Series/cycle playback
  seriesPlaying: boolean;
  setSeriesPlaying: (playing: boolean) => void;

  // Metronome actions
  setMetronomeVolume: (volume: number) => void;
  setMetronomeMuted: (muted: boolean) => void;
  setMetronomeTimbre: (timbre: MetronomeTimbre) => void;
  setMetronomeSubdivision: (subdivision: number) => void;
  setMetronomeSubdivisionAccent: (accent: boolean) => void;

  // Panel actions
  setKeyboardPanelOpen: (open: boolean) => void;
  setTransportBarOpen: (open: boolean) => void;

  // Bloom actions
  setBloomAllOctaves: (v: boolean) => void;

  // Sandbox latch actions
  setSandboxLatch: (latch: boolean) => void;
  killAllNotes: () => void;
  toggleSandboxNote: (semitones: number, frequency: number) => void;
  activateSandboxNote: (semitones: number, frequency: number) => void;
  deactivateSandboxNote: (semitones: number) => void;

  // Arpeggiator actions
  setArpEnabled: (enabled: boolean) => void;
  setArpPattern: (pattern: ArpPattern) => void;
  setArpOctaveRange: (range: number) => void;
  setArpSync: (sync: boolean) => void;
  setArpSyncSpeed: (speed: number) => void;
  setArpFreeMs: (ms: number) => void;

  // Synth actions
  setSynthParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setSynthKeyboardMode: (mode: 'classic' | 'isomorphic') => void;
  setSynthLfoTarget: (lfo: 1 | 2, target: LfoTargetParam) => void;
  loadPreset: (index: number) => void;
  savePreset: (index: number, name: string) => void;
  deletePreset: (index: number) => void;
  randomizeSynth: () => void;

  // Coltrane actions
  setColtraneRoot: (root: number) => void;
  setColtraneDivision: (division: SymmetricDivision) => void;
  setColtraneMode: (mode: 'circle' | 'mandala') => void;
  setColtraneOrdering: (ordering: 'fifths' | 'chromatic') => void;
  setColtraneShowCadences: (show: boolean) => void;
  setColtraneHighlightedAxis: (axis: number | null) => void;

  // Sandbox actions
  createFretboard: () => void;
  updateFretboard: (id: string, data: Partial<FretboardState>) => void;
  deleteFretboard: (id: string) => void;
  search: (id: string, searchTerm: string) => void;
  openSettings: (id: string) => void;
  updateSettings: (data: Partial<Settings>) => void;

  // Navigation actions
  navigate: (view: View) => void;

  // Song actions
  createSong: (title: string) => void;
  deleteSong: (id: string) => void;
  renameSong: (id: string, title: string) => void;
  addChordToSong: (songId: string) => void;
  updateSongChord: (songId: string, chordId: string, data: Partial<ChordConfig>) => void;
  removeSongChord: (songId: string, chordId: string) => void;
  reorderSongChords: (songId: string, from: number, to: number) => void;
  setActiveSongChordId: (id: string | null) => void;
  importSongs: (data: SongExport) => void;
  exportSongs: (songIds: string[]) => SongExport;
}
