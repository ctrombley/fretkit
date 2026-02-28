import type { SynthParams } from './synth';

export interface SynthPreset {
  name: string;
  params: SynthParams;
  isFactory: boolean;
}

export const MAX_PRESETS = 255;

const base: SynthParams = {
  waveform: 'sawtooth',
  filterCutoff: 2000,
  filterResonance: 1,
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
  pan: 0,
  reverbSend: 0.15,
  delaySend: 0,
  delayTime: 0.3,
  delayFeedback: 0.4,
  masterVolume: 0.5,
  osc2Waveform: 'sine',
  osc2Detune: 0,
  osc2Mix: 0,
  fmMode: false,
  fmDepth: 200,
  lfo1Rate: 2,
  lfo1Depth: 0,
  lfo1Waveform: 'sine',
  lfo1Target: null,
  lfo2Rate: 0.5,
  lfo2Depth: 0,
  lfo2Waveform: 'triangle',
  lfo2Target: null,
};

function preset(name: string, overrides: Partial<SynthParams>): SynthPreset {
  return { name, params: { ...base, ...overrides }, isFactory: true };
}

export const FACTORY_PRESETS: SynthPreset[] = [
  preset('Init', {}),
  preset('Clean Guitar', {
    waveform: 'triangle',
    filterCutoff: 3500,
    attack: 0.005,
    decay: 0.3,
    sustain: 0.4,
    release: 0.4,
  }),
  preset('Nylon Strings', {
    waveform: 'sine',
    osc2Waveform: 'triangle',
    osc2Mix: 0.3,
    filterCutoff: 1200,
    attack: 0.02,
    decay: 0.4,
    sustain: 0.3,
    release: 0.6,
  }),
  preset('Jazz Hollow Body', {
    waveform: 'triangle',
    filterCutoff: 1800,
    filterResonance: 3,
    attack: 0.01,
    decay: 0.3,
    sustain: 0.5,
    release: 0.5,
    reverbSend: 0.35,
  }),
  preset('Twangy Tele', {
    waveform: 'sawtooth',
    filterCutoff: 5000,
    attack: 0.003,
    decay: 0.15,
    sustain: 0.3,
    release: 0.2,
    delaySend: 0.15,
    delayTime: 0.12,
    delayFeedback: 0.2,
  }),
  preset('Overdriven', {
    waveform: 'square',
    filterCutoff: 3000,
    filterResonance: 8,
    attack: 0.005,
    decay: 0.1,
    sustain: 0.8,
    release: 0.15,
  }),
  preset('Ambient Pad', {
    waveform: 'sawtooth',
    osc2Waveform: 'sawtooth',
    osc2Detune: 7,
    osc2Mix: 0.5,
    filterCutoff: 1500,
    attack: 0.8,
    decay: 0.5,
    sustain: 0.7,
    release: 2.0,
    reverbSend: 0.5,
    delaySend: 0.3,
    delayTime: 0.4,
    delayFeedback: 0.5,
  }),
  preset('FM Bell', {
    waveform: 'sine',
    osc2Waveform: 'sine',
    fmMode: true,
    fmDepth: 600,
    filterCutoff: 8000,
    attack: 0.001,
    decay: 0.8,
    sustain: 0,
    release: 1.5,
    reverbSend: 0.3,
  }),
  preset('Bass Synth', {
    waveform: 'square',
    filterCutoff: 400,
    filterResonance: 4,
    attack: 0.005,
    decay: 0.15,
    sustain: 0.7,
    release: 0.05,
  }),
  preset('West Coast', {
    waveform: 'sine',
    osc2Waveform: 'sawtooth',
    fmMode: true,
    fmDepth: 350,
    filterCutoff: 2500,
    filterResonance: 5,
    attack: 0.01,
    decay: 0.3,
    sustain: 0.5,
    release: 0.4,
    lfo1Rate: 3,
    lfo1Depth: 0.3,
    lfo1Waveform: 'triangle',
    lfo1Target: 'filterCutoff',
  }),
];

function logRand(min: number, max: number): number {
  return min * Math.pow(max / min, Math.random());
}

export function randomizeParams(): SynthParams {
  const waveforms: SynthParams['waveform'][] = ['sine', 'triangle', 'sawtooth', 'square'];
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

  const fmMode = Math.random() < 0.25;

  return {
    waveform: pick(waveforms),
    filterCutoff: logRand(100, 15000),
    filterResonance: Math.random() * 15,
    attack: logRand(0.001, 1),
    decay: logRand(0.01, 1.5),
    sustain: Math.random(),
    release: logRand(0.01, 3),
    pan: (Math.random() - 0.5) * 0.6,
    reverbSend: Math.random() * 0.6,
    delaySend: Math.random() * 0.5,
    delayTime: logRand(0.05, 0.8),
    delayFeedback: Math.random() * 0.7,
    masterVolume: 0.3 + Math.random() * 0.4,
    osc2Waveform: pick(waveforms),
    osc2Detune: (Math.random() - 0.5) * 200,
    osc2Mix: Math.random() * 0.7,
    fmMode,
    fmDepth: fmMode ? logRand(50, 2000) : 200,
    lfo1Rate: logRand(0.1, 10),
    lfo1Depth: Math.random() < 0.5 ? Math.random() * 0.5 : 0,
    lfo1Waveform: pick(waveforms),
    lfo1Target: Math.random() < 0.4 ? pick(['filterCutoff', 'pan', 'osc2Detune'] as LfoTarget[]) : null,
    lfo2Rate: logRand(0.1, 8),
    lfo2Depth: Math.random() < 0.3 ? Math.random() * 0.4 : 0,
    lfo2Waveform: pick(waveforms),
    lfo2Target: null,
  };
}

type LfoTarget = keyof SynthParams;
