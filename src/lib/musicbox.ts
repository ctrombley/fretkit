import { getSynth } from './synth';

export function play(frequency: number): { stop: () => void } {
  return getSynth().play(frequency);
}
