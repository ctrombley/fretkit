import { AudioBus } from './audioBus';

export const BUS_IDS = [
  'sandbox',
  'songs',
  'spiral',
  'overtones',
  'coltrane',
  'synth',
  'monochord',
  'metronome',
] as const;

export type BusId = (typeof BUS_IDS)[number];

function rms(buf: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const norm = buf[i]! / 255;
    sum += norm * norm;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 2.5);
}

class MasterBusEngine {
  private ctx: AudioContext;
  private _masterGain: GainNode;
  private _masterMuteGain: GainNode;
  private _limiter: DynamicsCompressorNode;
  private _limiterEnabled = false;
  private analyser: AnalyserNode;
  private splitter: ChannelSplitterNode;
  private analyserL: AnalyserNode;
  private analyserR: AnalyserNode;
  private _buses: Map<BusId, AudioBus> = new Map();

  constructor() {
    this.ctx = new AudioContext();

    this._masterGain = this.ctx.createGain();
    this._masterGain.gain.value = 0.8;

    this._masterMuteGain = this.ctx.createGain();
    this._masterMuteGain.gain.value = 1;

    // Limiter (brickwall compressor, starts bypassed)
    this._limiter = this.ctx.createDynamicsCompressor();
    this._limiter.threshold.value = -3;
    this._limiter.knee.value = 0;
    this._limiter.ratio.value = 20;
    this._limiter.attack.value = 0.001;
    this._limiter.release.value = 0.1;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.splitter = this.ctx.createChannelSplitter(2);
    this.analyserL = this.ctx.createAnalyser();
    this.analyserL.fftSize = 256;
    this.analyserR = this.ctx.createAnalyser();
    this.analyserR.fftSize = 256;

    // masterGain → masterMuteGain → analyser → destination
    this._masterGain.connect(this._masterMuteGain);
    this._masterMuteGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // masterMuteGain → splitter → L/R analysers
    this._masterMuteGain.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);

    // Create all 8 toy buses, each connected to masterGain
    for (const id of BUS_IDS) {
      const bus = new AudioBus(this.ctx);
      bus.connect(this._masterGain);
      this._buses.set(id, bus);
    }
  }

  getAudioContext(): AudioContext {
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  getBus(id: string): AudioBus {
    const bus = this._buses.get(id as BusId);
    if (!bus) throw new Error(`Unknown bus id: ${id}`);
    return bus;
  }

  setMasterVolume(v: number): void {
    this._masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setMasterMuted(muted: boolean): void {
    this._masterMuteGain.gain.value = muted ? 0 : 1;
  }

  setLimiterEnabled(enabled: boolean): void {
    if (enabled === this._limiterEnabled) return;
    this._limiterEnabled = enabled;

    // Rewire: masterMuteGain → [limiter →] analyser
    this._masterMuteGain.disconnect(this.analyser);
    if (enabled) {
      this._masterMuteGain.connect(this._limiter);
      this._limiter.connect(this.analyser);
    } else {
      this._limiter.disconnect();
      this._masterMuteGain.connect(this.analyser);
    }
  }

  getLimiterEnabled(): boolean {
    return this._limiterEnabled;
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

}

let instance: MasterBusEngine | null = null;

export function getMasterBus(): MasterBusEngine {
  if (!instance) {
    instance = new MasterBusEngine();
  }
  return instance;
}
