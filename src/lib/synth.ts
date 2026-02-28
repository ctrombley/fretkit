export type OscWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';

export interface SynthParams {
  waveform: OscWaveform;
  filterCutoff: number;
  filterResonance: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  pan: number;
  reverbSend: number;
  delaySend: number;
  delayTime: number;
  delayFeedback: number;
  masterVolume: number;
}

const DEFAULT_PARAMS: SynthParams = {
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
};

function generateReverbIR(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.5));
    }
  }
  return buffer;
}

class SynthEngine {
  private ctx: AudioContext;
  private filter: BiquadFilterNode;
  private panner: StereoPannerNode;
  private dryGain: GainNode;
  private reverbSend: GainNode;
  private reverbNode: ConvolverNode;
  private delaySend: GainNode;
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private masterGain: GainNode;
  private analyser: AnalyserNode;
  private params: SynthParams;

  constructor() {
    this.ctx = new AudioContext();
    this.params = { ...DEFAULT_PARAMS };

    // Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.params.filterCutoff;
    this.filter.Q.value = this.params.filterResonance;

    // Panner
    this.panner = this.ctx.createStereoPanner();
    this.panner.pan.value = this.params.pan;

    // Dry path
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1;

    // Reverb
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = this.params.reverbSend;
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = generateReverbIR(this.ctx);

    // Delay
    this.delaySend = this.ctx.createGain();
    this.delaySend.gain.value = this.params.delaySend;
    this.delayNode = this.ctx.createDelay(2);
    this.delayNode.delayTime.value = this.params.delayTime;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = this.params.delayFeedback;

    // Master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.params.masterVolume;

    // Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    // Connect graph:
    // filter → panner → dryGain → masterGain
    //                  → reverbSend → reverbNode → masterGain
    //                  → delaySend → delayNode → masterGain
    //                                delayNode → delayFeedback → delayNode (feedback loop)
    // masterGain → analyser → destination
    this.filter.connect(this.panner);
    this.panner.connect(this.dryGain);
    this.dryGain.connect(this.masterGain);

    this.panner.connect(this.reverbSend);
    this.reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(this.masterGain);

    this.panner.connect(this.delaySend);
    this.delaySend.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  play(frequency: number): { stop: () => void } {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const { waveform, attack, decay, sustain, release } = this.params;

    const osc = this.ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = frequency;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1.0, now + attack);
    envelope.gain.linearRampToValueAtTime(sustain, now + attack + decay);

    osc.connect(envelope);
    envelope.connect(this.filter);
    osc.start(now);

    let released = false;

    return {
      stop: () => {
        if (released) return;
        released = true;
        const releaseStart = this.ctx.currentTime;
        envelope.gain.cancelScheduledValues(releaseStart);
        envelope.gain.setValueAtTime(envelope.gain.value, releaseStart);
        envelope.gain.linearRampToValueAtTime(0, releaseStart + release);
        osc.stop(releaseStart + release + 0.01);
        osc.onended = () => {
          osc.disconnect();
          envelope.disconnect();
        };
      },
    };
  }

  updateParams(partial: Partial<SynthParams>): void {
    Object.assign(this.params, partial);

    if (partial.filterCutoff !== undefined) {
      this.filter.frequency.setTargetAtTime(partial.filterCutoff, this.ctx.currentTime, 0.02);
    }
    if (partial.filterResonance !== undefined) {
      this.filter.Q.setTargetAtTime(partial.filterResonance, this.ctx.currentTime, 0.02);
    }
    if (partial.pan !== undefined) {
      this.panner.pan.setTargetAtTime(partial.pan, this.ctx.currentTime, 0.02);
    }
    if (partial.reverbSend !== undefined) {
      this.reverbSend.gain.setTargetAtTime(partial.reverbSend, this.ctx.currentTime, 0.02);
    }
    if (partial.delaySend !== undefined) {
      this.delaySend.gain.setTargetAtTime(partial.delaySend, this.ctx.currentTime, 0.02);
    }
    if (partial.delayTime !== undefined) {
      this.delayNode.delayTime.setTargetAtTime(partial.delayTime, this.ctx.currentTime, 0.02);
    }
    if (partial.delayFeedback !== undefined) {
      const fb = Math.min(partial.delayFeedback, 0.9);
      this.delayFeedback.gain.setTargetAtTime(fb, this.ctx.currentTime, 0.02);
    }
    if (partial.masterVolume !== undefined) {
      this.masterGain.gain.setTargetAtTime(partial.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  getAnalyserData(): Uint8Array {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

let instance: SynthEngine | null = null;

export function getSynth(): SynthEngine {
  if (!instance) {
    instance = new SynthEngine();
  }
  return instance;
}
