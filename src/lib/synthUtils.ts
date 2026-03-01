import type { SynthParams, LfoTargetParam } from './synth';

/** Which LFO (1 or 2) is targeting the given param, or null if neither. */
export function lfoFor(param: string, t1: LfoTargetParam, t2: LfoTargetParam): 1 | 2 | null {
  if (t1 === param) return 1;
  if (t2 === param) return 2;
  return null;
}

/** Format a pan value (-1..1) as "L50", "C", "R50" etc. */
export function formatPan(v: number): string {
  if (Math.abs(v) < 0.05) return 'C';
  return v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`;
}

/** All keys in SynthParams, in a stable order. */
export const SYNTH_PARAM_KEYS: (keyof SynthParams)[] = [
  'waveform', 'hpCutoff', 'hpResonance', 'filterCutoff', 'filterResonance',
  'attack', 'decay', 'sustain', 'release',
  'pan', 'reverbSend', 'delaySend', 'delayTime', 'delayFeedback', 'delayPingPong', 'masterVolume',
  'osc2Waveform', 'osc2Detune', 'osc2Mix',
  'fmMode', 'fmDepth',
  'lfo1Rate', 'lfo1Depth', 'lfo1Waveform', 'lfo1Target',
  'lfo2Rate', 'lfo2Depth', 'lfo2Waveform', 'lfo2Target',
];

/**
 * Map from SynthParams key to the corresponding store key (prefixed with "synth").
 * e.g. "waveform" → "synthWaveform", "filterCutoff" → "synthFilterCutoff"
 */
function toStoreKey(paramKey: string): string {
  return `synth${paramKey.charAt(0).toUpperCase()}${paramKey.slice(1)}`;
}

/** Convert SynthParams into a partial store state with synth-prefixed keys.
 *  Skips keys whose value is undefined so that stale persisted snapshots/presets
 *  (saved before a param was added) don't overwrite the store's current defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function synthParamsToStoreState(params: SynthParams): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const key of SYNTH_PARAM_KEYS) {
    if (params[key] !== undefined) {
      result[toStoreKey(key)] = params[key];
    }
  }
  return result;
}

/** Gather synth-prefixed store state back into a SynthParams object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gatherSynthParams(state: Record<string, any>): SynthParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const key of SYNTH_PARAM_KEYS) {
    result[key] = state[toStoreKey(key)];
  }
  return result as SynthParams;
}

/** Return the store keys and SynthParams keys for a given LFO number. */
export function lfoStoreKeys(lfoNum: 1 | 2) {
  return {
    rateKey: lfoNum === 1 ? 'synthLfo1Rate' : 'synthLfo2Rate',
    depthKey: lfoNum === 1 ? 'synthLfo1Depth' : 'synthLfo2Depth',
    waveformKey: lfoNum === 1 ? 'synthLfo1Waveform' : 'synthLfo2Waveform',
    targetKey: lfoNum === 1 ? 'synthLfo1Target' : 'synthLfo2Target',
    bloomKey: lfoNum === 1 ? 'synthLfo1Bloom' : 'synthLfo2Bloom',
    paramRate: (lfoNum === 1 ? 'lfo1Rate' : 'lfo2Rate') as keyof SynthParams,
    paramDepth: (lfoNum === 1 ? 'lfo1Depth' : 'lfo2Depth') as keyof SynthParams,
    paramWaveform: (lfoNum === 1 ? 'lfo1Waveform' : 'lfo2Waveform') as keyof SynthParams,
  } as const;
}
