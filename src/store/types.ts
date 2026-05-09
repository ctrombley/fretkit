import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import type { View, Song, ChordConfig, SongExport } from '../types';
import type { GeneratorPreset } from '../lib/derivation';
import type { SymmetricDivision } from '../lib/coltrane';
import type { OscWaveform, SynthParams, LfoWaveform, LfoTargetParam } from '../lib/synth';
import type { SynthPreset } from '../lib/synthPresets';
import type { MetronomeTimbre } from '../lib/metronome';
import type { ArpPattern, ArpMode } from '../lib/arpeggiator';
import type { FingerLabel } from '../lib/fingerPickingPatterns';
import type { MidiChannel, MidiBusConfig } from '../lib/midi';
import type { ScaleEntry, UserScalePreset } from '../lib/monochordScales';
import type { SamplerParams } from '../lib/sampler';
import type { SamplerSlotDef, SamplerPreset } from '../lib/samplerPresets';
import type { DroneAnalysis } from '../lib/harmonicAnalysis';

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
  showStringLabels: boolean;
  soundPreset: string;
  edoMode: '12' | 'angine';
  quartertoneThresholdCents: number;
  synthParams: SynthParams;
  showEnharmonic: boolean;
  showOctaves: boolean;
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

  // Drone
  droneActive: boolean;
  droneDetuneRange: number;
  droneOffsets: number[];
  droneFrets: Record<string, (number | null)[]>;
  droneLegatoEnabled: boolean;
  dronePortamentoMs: number;
  droneAnalysis: DroneAnalysis | null;

  // Drone actions
  activateDrone: () => void;
  deactivateDrone: () => void;
  retriggerDrone: () => void;
  setDroneFret: (fretboardId: string, stringNumber: number, semitones: number | null) => void;
  setDroneDetuneRange: (range: number) => void;
  randomizeDroneOffsets: () => void;
  setDroneLegatoEnabled: (enabled: boolean) => void;
  setDronePortamentoMs: (ms: number) => void;

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
  synthHpCutoff: number;
  synthHpResonance: number;
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

  // Bus
  buses: Record<string, { volume: number; muted: boolean }>;
  masterBusVolume: number;
  masterBusMuted: boolean;
  setBusVolume: (busId: string, volume: number) => void;
  setBusMuted: (busId: string, muted: boolean) => void;
  setMasterBusVolume: (volume: number) => void;
  setMasterBusMuted: (muted: boolean) => void;

  // MIDI
  midiBuses: Record<string, MidiBusConfig>;
  setMidiEnabled: (toyId: string, enabled: boolean) => void;
  setMidiReceiveChannel: (toyId: string, channel: MidiChannel) => void;
  setMidiTransmitChannel: (toyId: string, channel: number) => void;

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
  sandboxActiveNotes: Record<string, number[]>;
  sandboxActiveFretPositions: Record<string, Array<[number, number]>>;
  strumPreviewSemitones: number[];
  sandboxSoundingStrings: number[];

  // Arpeggiator
  arpEnabled: boolean;
  arpPattern: ArpPattern;
  arpOctaveRange: number;
  arpSync: boolean;
  arpSyncSpeed: number;
  arpFreeMs: number;
  arpStrikeNotes: number[];
  arpStrikeCount: number;
  arpStrikeFingers: Record<number, FingerLabel | null>;
  arpMode: ArpMode;
  arpFingerPickingPatternId: string;

  // Series/cycle playback — separate flags per toy
  coltraneSeriesPlaying: boolean;
  setColtraneSeriesPlaying: (playing: boolean) => void;
  overtoneSeriesPlaying: boolean;
  setOvertoneSeriesPlaying: (playing: boolean) => void;

  // Monochord persistent state
  monochordDroneOn: boolean;
  monochordBinaural: boolean;
  monochordFundamentalName: string;
  monochordBridgePos: number;
  setMonochordDroneOn: (on: boolean) => void;
  setMonochordBinaural: (on: boolean) => void;
  setMonochordFundamentalName: (name: string) => void;
  setMonochordBridgePos: (pos: number) => void;

  // Monochord scales
  monochordScaleId: string;
  monochordCustomEntries: ScaleEntry[];
  monochordUserPresets: UserScalePreset[];
  setMonochordScaleId: (id: string) => void;
  addMonochordCustomEntry: (entry: ScaleEntry) => void;
  removeMonochordCustomEntry: (pos: number) => void;
  clearMonochordCustomEntries: () => void;
  saveMonochordUserPreset: (name: string, entries: ScaleEntry[]) => void;
  deleteMonochordUserPreset: (id: string) => void;

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
  toggleSandboxNote: (semitones: number, frequency: number, stringNumber?: number, fretboardId?: string) => void;
  activateSandboxNote: (semitones: number, frequency: number, stringNumber?: number, fretboardId?: string) => void;
  deactivateSandboxNote: (semitones: number, stringNumber?: number, fretboardId?: string) => void;
  slideSandboxNote: (prevSemitones: number, newSemitones: number, newFrequency: number, stringNumber?: number, fretboardId?: string) => void;
  strumVoicing: (notes: Array<{ semitones: number; frequency: number; string?: number }>, fretboardId?: string) => void;
  strumActiveNotes: () => void;
  setFretboardSoundPreset: (fretboardId: string, presetName: string) => void;

  // Arpeggiator actions
  setArpEnabled: (enabled: boolean) => void;
  setArpPattern: (pattern: ArpPattern) => void;
  setArpOctaveRange: (range: number) => void;
  setArpSync: (sync: boolean) => void;
  setArpSyncSpeed: (speed: number) => void;
  setArpFreeMs: (ms: number) => void;
  setArpMode: (mode: ArpMode) => void;
  setArpFingerPickingPatternId: (id: string) => void;
  loadVoicingIntoArp: (fretboardId: string, overrideSeqIdx?: number) => void;
  syncArpToFretboard: (fretboardId: string) => void;

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

  // Sampler
  samplerMode: 'synth' | 'sampler';
  samplerSlots: (SamplerSlotDef | null)[];
  samplerKeyMap: (number | null)[];
  samplerSlotParams: SamplerParams[];
  samplerSlotRootNotes: (number | null)[];
  samplerSelectedSlot: number | null;
  samplerPresets: SamplerPreset[];
  samplerActivePresetIndex: number | null;
  samplerAutoSave: { slots: (SamplerSlotDef | null)[]; keyMap: (number | null)[]; params: SamplerParams[]; rootNotes: (number | null)[]; timestamp: number } | null;
  samplerCrossfade: number;

  // Sampler actions
  setSamplerMode: (mode: 'synth' | 'sampler') => void;
  setSamplerCrossfade: (v: number) => void;
  setSamplerSlot: (idx: number, slot: SamplerSlotDef | null) => void;
  setSamplerSlotUrl: (idx: number, url: string) => void;
  setSamplerSlotFile: (idx: number, file: File) => void;
  setSamplerSlotParam: (idx: number, key: keyof SamplerParams, val: SamplerParams[keyof SamplerParams]) => void;
  setSamplerKeyMap: (keyMap: (number | null)[]) => void;
  mapSlotToKey: (slotIdx: number, midiNote: number) => void;
  unmapSlot: (slotIdx: number) => void;
  setSamplerSelectedSlot: (idx: number | null) => void;
  saveSamplerPreset: (name: string) => void;
  loadSamplerPreset: (idx: number) => void;
  deleteSamplerPreset: (idx: number) => void;
  renameSamplerPreset: (idx: number, name: string) => void;
  triggerSamplerAutoSave: () => void;

  // Loop recording
  loopStatuses: Record<string, 'idle' | 'waiting' | 'recording' | 'ready'>;
  loopLengthBars: Record<string, number>;
  loopLeadIn: boolean;
  startRecordingLoop: (fretboardId: string) => void;
  stopRecordingLoop: (fretboardId: string) => void;
  clearLoop: (fretboardId: string) => void;
  setLoopLengthBars: (fretboardId: string, bars: number) => void;
  setLoopLeadIn: (enabled: boolean) => void;

  // Navigation actions
  navigate: (view: View) => void;

  // Song actions
  createSong: (title: string) => void;
  addConfiguredChordToSong: (songId: string, config: Omit<import('../types').ChordConfig, 'id'>) => void;
  removeSavedChord: (songId: string, chordId: string) => void;
  addSavedChordToProgression: (songId: string, savedChordId: string) => void;
  addSavedChordToProgressionAt: (songId: string, savedChordId: string, atIndex: number) => void;
  setSongGridStep: (songId: string, step: number, chord: ChordConfig | null) => void;
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
