import { getMasterBus } from './masterBus';

export interface SamplerParams {
  startFraction: number;
  endFraction: number;
  loop: boolean;
  loopStartFraction: number;
  loopEndFraction: number;
  reverse: boolean;
  amplitude: number;   // 0..2
  pitchSemitones: number; // -24..24
}

export const DEFAULT_SAMPLER_PARAMS: SamplerParams = {
  startFraction: 0,
  endFraction: 1,
  loop: false,
  loopStartFraction: 0,
  loopEndFraction: 1,
  reverse: false,
  amplitude: 1,
  pitchSemitones: 0,
};

interface ActiveSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

// ---------------------------------------------------------------------------
// IndexedDB cache — persists raw audio bytes across sessions
// ---------------------------------------------------------------------------
const IDB_NAME = 'fretkit-samples';
const IDB_STORE = 'buffers';
const IDB_VERSION = 1;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(url);
      req.onsuccess = () => resolve((req.result as ArrayBuffer | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbPut(url: string, buf: ArrayBuffer): Promise<void> {
  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(buf, url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

// ---------------------------------------------------------------------------
// SamplerEngine
// ---------------------------------------------------------------------------
class SamplerEngine {
  private _buffers: (AudioBuffer | null)[] = new Array(16).fill(null);
  private _activeNotes: Map<number, ActiveSource> = new Map();
  private _outputBusId = 'sampler';

  async loadSample(slotIdx: number, source: string | ArrayBuffer): Promise<void> {
    const ctx = getMasterBus().getAudioContext();

    if (source instanceof ArrayBuffer) {
      const decoded = await ctx.decodeAudioData(source.slice(0));
      this._buffers[slotIdx] = decoded;
      return;
    }

    // URL path — check IDB cache first
    const cached = await idbGet(source);
    const rawBuf = cached ?? await (async () => {
      const r = await fetch(source);
      if (!r.ok) throw new Error(`HTTP ${r.status} loading ${source}`);
      const buf = await r.arrayBuffer();
      // Store in cache (fire-and-forget)
      void idbPut(source, buf);
      return buf;
    })();

    this._buffers[slotIdx] = await ctx.decodeAudioData(rawBuf.slice(0));
  }

  getBuffer(slotIdx: number): AudioBuffer | null {
    return this._buffers[slotIdx] ?? null;
  }

  noteOn(
    midiNote: number,
    velocity: number,
    keyMap: (number | null)[],
    params: SamplerParams[],
    rootNotes: (number | null)[],
  ): void {
    const slotIdx = keyMap[midiNote];
    if (slotIdx == null) return;
    const buffer = this._buffers[slotIdx];
    if (!buffer) return;

    const p = params[slotIdx] ?? DEFAULT_SAMPLER_PARAMS;
    const rootNote = rootNotes[slotIdx] ?? midiNote;

    const master = getMasterBus();
    const ctx = master.getAudioContext();
    const busInput = master.getBus(this._outputBusId).input;

    const gainNode = ctx.createGain();
    gainNode.gain.value = p.amplitude * (velocity / 127);
    gainNode.connect(busInput);

    const source = ctx.createBufferSource();
    const duration = buffer.duration;
    const startTime = p.startFraction * duration;
    const endTime = p.endFraction * duration;
    const playDuration = endTime - startTime;

    const semitoneShift = midiNote - rootNote + p.pitchSemitones;
    source.playbackRate.value = Math.pow(2, semitoneShift / 12);

    if (p.reverse) {
      const reversedBuffer = this._createReversedBuffer(ctx, buffer, p.startFraction, p.endFraction);
      source.buffer = reversedBuffer;
      source.connect(gainNode);
      source.start(0);
      if (!p.loop) {
        source.stop(ctx.currentTime + reversedBuffer.duration / source.playbackRate.value);
      }
    } else {
      source.buffer = buffer;
      if (p.loop && playDuration > 0) {
        source.loop = true;
        source.loopStart = p.loopStartFraction * duration;
        source.loopEnd = p.loopEndFraction * duration;
      }
      source.connect(gainNode);
      source.start(0, startTime, p.loop ? undefined : playDuration);
    }

    this._activeNotes.set(midiNote, { source, gainNode });
  }

  noteOff(midiNote: number, params: SamplerParams[], keyMap: (number | null)[]): void {
    const active = this._activeNotes.get(midiNote);
    if (!active) return;

    const slotIdx = keyMap[midiNote];
    if (slotIdx != null) {
      const p = params[slotIdx] ?? DEFAULT_SAMPLER_PARAMS;
      if (!p.loop) return;
    }

    try { active.source.stop(); } catch (_) { /* already stopped */ }
    this._activeNotes.delete(midiNote);
  }

  stopAll(): void {
    for (const [, active] of this._activeNotes) {
      try { active.source.stop(); } catch (_) { /* already stopped */ }
    }
    this._activeNotes.clear();
  }

  setOutputBus(busId: string): void {
    this._outputBusId = busId;
  }

  private _createReversedBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    startFraction: number,
    endFraction: number,
  ): AudioBuffer {
    const startSample = Math.floor(startFraction * buffer.length);
    const endSample = Math.ceil(endFraction * buffer.length);
    const length = endSample - startSample;
    const reversed = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        dst[i] = src[endSample - 1 - i]!;
      }
    }
    return reversed;
  }
}

let instance: SamplerEngine | null = null;

export function getSampler(): SamplerEngine {
  if (!instance) instance = new SamplerEngine();
  return instance;
}
