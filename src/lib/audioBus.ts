/**
 * AudioBus — a channel strip for one toy/view.
 * Signal chain: inputGain → volumeGain → muteGain → analyser (tap) → (master input)
 */
export class AudioBus {
  private readonly _input: GainNode;
  private readonly _volume: GainNode;
  private readonly _mute: GainNode;
  private readonly _analyser: AnalyserNode;

  constructor(ctx: AudioContext) {
    this._input = ctx.createGain();
    this._volume = ctx.createGain();
    this._mute = ctx.createGain();
    this._analyser = ctx.createAnalyser();
    this._analyser.fftSize = 256;

    this._input.connect(this._volume);
    this._volume.connect(this._mute);
    // Tap the post-mute signal into the analyser (doesn't affect routing)
    this._mute.connect(this._analyser);
  }

  get input(): GainNode {
    return this._input;
  }

  setVolume(v: number): void {
    this._volume.gain.value = Math.max(0, Math.min(1, v));
  }

  setMuted(muted: boolean): void {
    this._mute.gain.value = muted ? 0 : 1;
  }

  connect(dest: AudioNode): void {
    this._mute.connect(dest);
  }

  disconnect(): void {
    this._mute.disconnect();
  }

  getRmsLevel(): number {
    const buf = new Uint8Array(this._analyser.frequencyBinCount);
    this._analyser.getByteFrequencyData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const norm = buf[i]! / 255;
      sum += norm * norm;
    }
    return Math.min(1, Math.sqrt(sum / buf.length) * 2.5);
  }
}
