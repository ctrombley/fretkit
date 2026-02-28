export type OscWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type LfoWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type LfoTargetParam = keyof SynthParams | 'bpm' | null;

export interface SynthParams {
  waveform: OscWaveform;
  hpCutoff: number;
  hpResonance: number;
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
  delayPingPong: boolean;
  masterVolume: number;
  // Osc2
  osc2Waveform: OscWaveform;
  osc2Detune: number;
  osc2Mix: number;
  // FM
  fmMode: boolean;
  fmDepth: number;
  // LFO1
  lfo1Rate: number;
  lfo1Depth: number;
  lfo1Waveform: LfoWaveform;
  lfo1Target: LfoTargetParam;
  // LFO2
  lfo2Rate: number;
  lfo2Depth: number;
  lfo2Waveform: LfoWaveform;
  lfo2Target: LfoTargetParam;
}

const DEFAULT_PARAMS: SynthParams = {
  waveform: 'sawtooth',
  hpCutoff: 80,
  hpResonance: 0.7,
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
  delayPingPong: false,
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

export function lfoWaveValue(waveform: LfoWaveform, phase: number): number {
  const p = phase % 1;
  switch (waveform) {
    case 'sine':
      return Math.sin(p * 2 * Math.PI);
    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'sawtooth':
      return 2 * p - 1;
    case 'square':
      return p < 0.5 ? 1 : -1;
  }
}

function generateReverbIR(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.5));
    }
  }
  return buffer;
}

interface LfoState {
  phase: number;
  baseValues: Map<string, number>;
}

function rms(buf: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const norm = buf[i]! / 255;
    sum += norm * norm;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 2.5);
}

class SynthEngine {
  private ctx: AudioContext;
  private hp: BiquadFilterNode;
  private filter: BiquadFilterNode;
  private panner: StereoPannerNode;
  private dryGain: GainNode;
  private reverbSend: GainNode;
  private reverbNode: ConvolverNode;
  private delaySend: GainNode;
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private delayNodeR: DelayNode;
  private delayPanL: StereoPannerNode;
  private delayPanR: StereoPannerNode;
  private masterGain: GainNode;
  private analyser: AnalyserNode;
  private splitter: ChannelSplitterNode;
  private analyserL: AnalyserNode;
  private analyserR: AnalyserNode;
  params: SynthParams;
  onBpmModulation: ((bpm: number) => void) | null = null;
  private lfo1State: LfoState = { phase: 0, baseValues: new Map() };
  private lfo2State: LfoState = { phase: 0, baseValues: new Map() };
  private lastLfoTime: number = 0;
  private activeVoices: Set<{ stop: () => void }> = new Set();

  constructor() {
    this.ctx = new AudioContext();
    this.params = { ...DEFAULT_PARAMS };

    this.hp = this.ctx.createBiquadFilter();
    this.hp.type = 'highpass';
    this.hp.frequency.value = this.params.hpCutoff;
    this.hp.Q.value = this.params.hpResonance;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.params.filterCutoff;
    this.filter.Q.value = this.params.filterResonance;

    this.hp.connect(this.filter);

    this.panner = this.ctx.createStereoPanner();
    this.panner.pan.value = this.params.pan;

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1;

    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = this.params.reverbSend;
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = generateReverbIR(this.ctx);

    this.delaySend = this.ctx.createGain();
    this.delaySend.gain.value = this.params.delaySend;
    this.delayNode = this.ctx.createDelay(2);
    this.delayNode.delayTime.value = this.params.delayTime;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = this.params.delayFeedback;
    this.delayNodeR = this.ctx.createDelay(2);
    this.delayNodeR.delayTime.value = this.params.delayTime;
    this.delayPanL = this.ctx.createStereoPanner();
    this.delayPanL.pan.value = -1;
    this.delayPanR = this.ctx.createStereoPanner();
    this.delayPanR.pan.value = 1;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.params.masterVolume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.filter.connect(this.panner);
    this.panner.connect(this.dryGain);
    this.dryGain.connect(this.masterGain);

    this.panner.connect(this.reverbSend);
    this.reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(this.masterGain);

    this.panner.connect(this.delaySend);
    this.wireDelay(this.params.delayPingPong);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.splitter = this.ctx.createChannelSplitter(2);
    this.analyserL = this.ctx.createAnalyser();
    this.analyserL.fftSize = 256;
    this.analyserR = this.ctx.createAnalyser();
    this.analyserR.fftSize = 256;
    this.masterGain.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);

    this.startLfoLoop();
  }

  private wireDelay(pingPong: boolean) {
    // Disconnect all delay routing
    this.delaySend.disconnect();
    this.delayNode.disconnect();
    this.delayFeedback.disconnect();
    this.delayNodeR.disconnect();
    this.delayPanL.disconnect();
    this.delayPanR.disconnect();

    if (pingPong) {
      // Ping pong: L → panL → master, L → R → panR → master, R → feedback → L
      this.delaySend.connect(this.delayNode);
      this.delayNode.connect(this.delayPanL);
      this.delayPanL.connect(this.masterGain);
      this.delayNode.connect(this.delayNodeR);
      this.delayNodeR.connect(this.delayPanR);
      this.delayPanR.connect(this.masterGain);
      this.delayNodeR.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
    } else {
      // Normal mono delay
      this.delaySend.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
    }
  }

  private startLfoLoop() {
    this.lastLfoTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - this.lastLfoTime) / 1000;
      this.lastLfoTime = now;

      this.processLfo(1, this.lfo1State, this.params.lfo1Rate, this.params.lfo1Depth, this.params.lfo1Waveform, this.params.lfo1Target, dt);
      this.processLfo(2, this.lfo2State, this.params.lfo2Rate, this.params.lfo2Depth, this.params.lfo2Waveform, this.params.lfo2Target, dt);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private processLfo(
    _lfoNum: number,
    state: LfoState,
    rate: number,
    depth: number,
    waveform: LfoWaveform,
    target: LfoTargetParam,
    dt: number,
  ) {
    if (!target || depth === 0) return;

    state.phase = (state.phase + rate * dt) % 1;
    const waveVal = lfoWaveValue(waveform, state.phase);

    if (!state.baseValues.has(target)) {
      if (target === 'bpm') return; // base must be set externally via setBpmBase
      state.baseValues.set(target, this.params[target as keyof SynthParams] as number);
    }
    const baseValue = state.baseValues.get(target)!;

    let modulated: number;
    if (target === 'pan') {
      modulated = Math.max(-1, Math.min(1, baseValue + waveVal * depth));
    } else {
      modulated = baseValue + waveVal * depth * Math.abs(baseValue || 1);
    }

    this.applyModulation(target, modulated);
  }

  private applyModulation(target: string, value: number) {
    const t = this.ctx.currentTime;
    switch (target) {
      case 'hpCutoff':
        this.hp.frequency.setTargetAtTime(Math.max(20, Math.min(20000, value)), t, 0.01);
        break;
      case 'hpResonance':
        this.hp.Q.setTargetAtTime(Math.max(0, Math.min(30, value)), t, 0.01);
        break;
      case 'filterCutoff':
        this.filter.frequency.setTargetAtTime(Math.max(20, Math.min(20000, value)), t, 0.01);
        break;
      case 'filterResonance':
        this.filter.Q.setTargetAtTime(Math.max(0, Math.min(30, value)), t, 0.01);
        break;
      case 'pan':
        this.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, value)), t, 0.01);
        break;
      case 'reverbSend':
        this.reverbSend.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), t, 0.01);
        break;
      case 'delaySend':
        this.delaySend.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), t, 0.01);
        break;
      case 'masterVolume':
        this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), t, 0.01);
        break;
      case 'bpm':
        if (this.onBpmModulation) {
          this.onBpmModulation(Math.round(Math.max(30, Math.min(300, value))));
        }
        break;
      default:
        // Per-voice params (osc2Detune, fmDepth, etc.) stored for next voice
        (this.params as unknown as Record<string, unknown>)[target] = value;
        break;
    }
  }

  resetLfoBase(lfoNum: 1 | 2) {
    const state = lfoNum === 1 ? this.lfo1State : this.lfo2State;
    state.baseValues.clear();
    state.phase = 0;
  }

  setBpmBase(bpm: number) {
    if (this.params.lfo1Target === 'bpm') this.lfo1State.baseValues.set('bpm', bpm);
    if (this.params.lfo2Target === 'bpm') this.lfo2State.baseValues.set('bpm', bpm);
  }

  play(frequency: number): { stop: () => void } {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const { waveform, attack, decay, sustain, release, osc2Waveform, osc2Detune, osc2Mix, fmMode, fmDepth } = this.params;

    const osc1 = this.ctx.createOscillator();
    osc1.type = waveform;
    osc1.frequency.value = frequency;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1.0, now + attack);
    envelope.gain.linearRampToValueAtTime(sustain, now + attack + decay);

    if (fmMode) {
      // FM synthesis: osc2 modulates osc1's frequency
      const modOsc = this.ctx.createOscillator();
      modOsc.type = osc2Waveform;
      modOsc.frequency.value = frequency + osc2Detune / 100 * frequency;

      const fmGain = this.ctx.createGain();
      fmGain.gain.value = fmDepth;

      modOsc.connect(fmGain);
      fmGain.connect(osc1.frequency);

      osc1.connect(envelope);
      envelope.connect(this.hp);

      osc1.start(now);
      modOsc.start(now);

      let released = false;
      const handle = {
        stop: () => {
          if (released) return;
          released = true;
          this.activeVoices.delete(handle);
          const releaseStart = this.ctx.currentTime;
          envelope.gain.cancelScheduledValues(releaseStart);
          envelope.gain.setValueAtTime(envelope.gain.value, releaseStart);
          envelope.gain.linearRampToValueAtTime(0, releaseStart + release);
          osc1.stop(releaseStart + release + 0.01);
          modOsc.stop(releaseStart + release + 0.01);
          osc1.onended = () => {
            osc1.disconnect();
            modOsc.disconnect();
            fmGain.disconnect();
            envelope.disconnect();
          };
        },
      };
      this.activeVoices.add(handle);
      return handle;
    } else {
      // Additive mode: mix osc1 and osc2
      const osc1Gain = this.ctx.createGain();
      osc1Gain.gain.value = 1 - osc2Mix;
      osc1.connect(osc1Gain);
      osc1Gain.connect(envelope);

      if (osc2Mix > 0) {
        const osc2 = this.ctx.createOscillator();
        osc2.type = osc2Waveform;
        osc2.frequency.value = frequency;
        osc2.detune.value = osc2Detune;

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.value = osc2Mix;
        osc2.connect(osc2Gain);
        osc2Gain.connect(envelope);

        envelope.connect(this.hp);
        osc1.start(now);
        osc2.start(now);

        let released = false;
        const handle = {
          stop: () => {
            if (released) return;
            released = true;
            this.activeVoices.delete(handle);
            const releaseStart = this.ctx.currentTime;
            envelope.gain.cancelScheduledValues(releaseStart);
            envelope.gain.setValueAtTime(envelope.gain.value, releaseStart);
            envelope.gain.linearRampToValueAtTime(0, releaseStart + release);
            osc1.stop(releaseStart + release + 0.01);
            osc2.stop(releaseStart + release + 0.01);
            osc1.onended = () => {
              osc1.disconnect();
              osc1Gain.disconnect();
              osc2.disconnect();
              osc2Gain.disconnect();
              envelope.disconnect();
            };
          },
        };
        this.activeVoices.add(handle);
        return handle;
      } else {
        envelope.connect(this.hp);
        osc1.start(now);

        let released = false;
        const handle = {
          stop: () => {
            if (released) return;
            released = true;
            this.activeVoices.delete(handle);
            const releaseStart = this.ctx.currentTime;
            envelope.gain.cancelScheduledValues(releaseStart);
            envelope.gain.setValueAtTime(envelope.gain.value, releaseStart);
            envelope.gain.linearRampToValueAtTime(0, releaseStart + release);
            osc1.stop(releaseStart + release + 0.01);
            osc1.onended = () => {
              osc1.disconnect();
              osc1Gain.disconnect();
              envelope.disconnect();
            };
          },
        };
        this.activeVoices.add(handle);
        return handle;
      }
    }
  }

  killAll(): void {
    for (const voice of this.activeVoices) {
      voice.stop();
    }
    this.activeVoices.clear();
  }

  updateParams(partial: Partial<SynthParams>): void {
    // When user manually adjusts a param that's an LFO target, update the base value
    for (const key of Object.keys(partial)) {
      if (this.params.lfo1Target === key) {
        this.lfo1State.baseValues.set(key, partial[key as keyof SynthParams] as number);
      }
      if (this.params.lfo2Target === key) {
        this.lfo2State.baseValues.set(key, partial[key as keyof SynthParams] as number);
      }
    }

    Object.assign(this.params, partial);

    if (partial.hpCutoff !== undefined) {
      this.hp.frequency.setTargetAtTime(partial.hpCutoff, this.ctx.currentTime, 0.02);
    }
    if (partial.hpResonance !== undefined) {
      this.hp.Q.setTargetAtTime(partial.hpResonance, this.ctx.currentTime, 0.02);
    }
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
      this.delayNodeR.delayTime.setTargetAtTime(partial.delayTime, this.ctx.currentTime, 0.02);
    }
    if (partial.delayFeedback !== undefined) {
      const fb = Math.min(partial.delayFeedback, 0.9);
      this.delayFeedback.gain.setTargetAtTime(fb, this.ctx.currentTime, 0.02);
    }
    if (partial.delayPingPong !== undefined) {
      this.wireDelay(partial.delayPingPong);
    }
    if (partial.masterVolume !== undefined) {
      this.masterGain.gain.setTargetAtTime(partial.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  getStereoLevels(): { left: number; right: number } {
    const bufL = new Uint8Array(this.analyserL.frequencyBinCount);
    const bufR = new Uint8Array(this.analyserR.frequencyBinCount);
    this.analyserL.getByteFrequencyData(bufL);
    this.analyserR.getByteFrequencyData(bufR);
    return { left: rms(bufL), right: rms(bufR) };
  }

  getRmsLevel(): number {
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buf);
    return rms(buf);
  }

  getAnalyserData(): Uint8Array {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getAudioContext(): AudioContext {
    return this.ctx;
  }
}

let instance: SynthEngine | null = null;

export function getSynth(): SynthEngine {
  if (!instance) {
    instance = new SynthEngine();
  }
  return instance;
}
