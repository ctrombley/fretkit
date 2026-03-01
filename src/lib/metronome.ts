import { getMasterBus } from './masterBus';

export type MetronomeTimbre = 'click' | 'wood' | 'beep' | 'cowbell';

interface TimbreConfig {
  waveform: OscillatorType;
  accentFreq: number;
  normalFreq: number;
  decay: number;
}

const TIMBRES: Record<MetronomeTimbre, TimbreConfig> = {
  click: { waveform: 'sine', accentFreq: 1000, normalFreq: 800, decay: 0.03 },
  wood: { waveform: 'triangle', accentFreq: 1200, normalFreq: 900, decay: 0.04 },
  beep: { waveform: 'square', accentFreq: 880, normalFreq: 660, decay: 0.06 },
  cowbell: { waveform: 'triangle', accentFreq: 540, normalFreq: 540, decay: 0.08 },
};

export type OnBeatCallback = (beat: number, measure: number) => void;
export type OnSubTickCallback = (time: number, beat: number, sub: number) => void;

export class MetronomeEngine {
  private schedulerTimer: number | null = null;
  private nextBeatTime = 0;
  private currentBeat = 0;
  private currentMeasure = 0;
  private playing = false;

  // Config
  bpm = 120;
  beatsPerMeasure = 4;
  beatUnit = 4;
  volume = 0.7;
  muted = false;
  timbre: MetronomeTimbre = 'click';
  subdivision = 1;
  subdivisionAccent = true;
  arpTicksPerBeat = 2;
  onBeat: OnBeatCallback | null = null;
  onSubTick: OnSubTickCallback | null = null;
  onArpTick: ((time: number) => void) | null = null;

  private getCtx(): AudioContext {
    return getMasterBus().getAudioContext();
  }

  start(): void {
    if (this.playing) return;
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    this.playing = true;
    this.currentBeat = 0;
    this.currentMeasure = 0;
    this.nextBeatTime = ctx.currentTime + 0.05; // small offset to avoid glitch
    this.schedule();
  }

  stop(): void {
    this.playing = false;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  private schedule(): void {
    const ctx = this.getCtx();
    const lookAhead = 0.1; // seconds to look ahead
    const scheduleInterval = 25; // ms between scheduler calls

    while (this.nextBeatTime < ctx.currentTime + lookAhead) {
      const secondsPerBeat = 60.0 / this.bpm;
      const subInterval = secondsPerBeat / this.subdivision;
      const isAccent = this.currentBeat === 0;

      for (let sub = 0; sub < this.subdivision; sub++) {
        const subTime = this.nextBeatTime + sub * subInterval;
        if (sub === 0) {
          this.scheduleBeat(subTime, isAccent, 1);
        } else if (this.subdivisionAccent) {
          this.scheduleBeat(subTime, false, 0.4);
        }

        // Fire subtick for arpeggiator
        if (this.onSubTick) {
          const beat = this.currentBeat;
          const subIdx = sub;
          const cb = this.onSubTick;
          const delay = Math.max(0, (subTime - ctx.currentTime) * 1000);
          setTimeout(() => cb(subTime, beat, subIdx), delay);
        }
      }

      // Schedule independent arp ticks
      for (let arpSub = 0; arpSub < this.arpTicksPerBeat; arpSub++) {
        const arpInterval = secondsPerBeat / this.arpTicksPerBeat;
        const arpTime = this.nextBeatTime + arpSub * arpInterval;
        if (this.onArpTick) {
          const cb = this.onArpTick;
          const arpDelay = Math.max(0, (arpTime - ctx.currentTime) * 1000);
          setTimeout(() => cb(arpTime), arpDelay);
        }
      }

      // Notify UI
      const beat = this.currentBeat;
      const measure = this.currentMeasure;
      const delay = Math.max(0, (this.nextBeatTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        this.onBeat?.(beat, measure);
      }, delay);

      // Advance
      this.nextBeatTime += secondsPerBeat;
      this.currentBeat++;
      if (this.currentBeat >= this.beatsPerMeasure) {
        this.currentBeat = 0;
        this.currentMeasure++;
      }
    }

    if (this.playing) {
      this.schedulerTimer = window.setTimeout(() => this.schedule(), scheduleInterval);
    }
  }

  private scheduleBeat(time: number, isAccent: boolean, volumeMultiplier = 1): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const config = TIMBRES[this.timbre];

    const osc = ctx.createOscillator();
    osc.type = config.waveform;
    osc.frequency.value = isAccent ? config.accentFreq : config.normalFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * volumeMultiplier, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + config.decay);

    osc.connect(gain);
    gain.connect(getMasterBus().getBus('metronome').input);

    osc.start(time);
    osc.stop(time + config.decay + 0.01);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}

let instance: MetronomeEngine | null = null;

export function getMetronome(): MetronomeEngine {
  if (!instance) {
    instance = new MetronomeEngine();
  }
  return instance;
}
