import { getSynth } from './synth';

export type ArpPattern = 'up' | 'down' | 'upDown' | 'downUp' | 'random' | 'asPlayed' | 'converge' | 'diverge';

interface HeldNote {
  frequency: number;
  semitones: number;
}

export class ArpeggiatorEngine {
  private heldNotes: HeldNote[] = []; // insertion order
  private sortedNotes: HeldNote[] = []; // pitch-sorted
  private expandedNotes: HeldNote[] = [];
  private stepIndex = 0;
  private direction = 1; // 1 = up, -1 = down
  private enabled = false;
  private currentVoice: { stop: () => void } | null = null;
  private freeTimer: number | null = null;

  pattern: ArpPattern = 'up';
  octaveRange = 1;
  onNotePlayed: ((semitones: number) => void) | null = null;

  setOctaveRange(range: number): void {
    this.octaveRange = range;
    this.rebuildSorted();
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.stepIndex = 0;
    this.direction = 1;
  }

  disable(): void {
    this.enabled = false;
    this.stopFreeRunning();
    this.currentVoice?.stop();
    this.currentVoice = null;
  }

  startFreeRunning(ms: number): void {
    this.stopFreeRunning();
    this.freeTimer = window.setInterval(() => this.tick(0), ms);
  }

  stopFreeRunning(): void {
    if (this.freeTimer !== null) {
      clearInterval(this.freeTimer);
      this.freeTimer = null;
    }
  }

  setFreeSpeed(ms: number): void {
    if (this.freeTimer !== null) {
      this.startFreeRunning(ms);
    }
  }

  addNote(frequency: number, semitones: number): void {
    if (this.heldNotes.some(n => n.semitones === semitones)) return;
    const note = { frequency, semitones };
    this.heldNotes.push(note);
    this.rebuildSorted();
  }

  removeNote(semitones: number): void {
    this.heldNotes = this.heldNotes.filter(n => n.semitones !== semitones);
    this.rebuildSorted();
    if (this.heldNotes.length === 0) {
      this.stepIndex = 0;
      this.direction = 1;
      this.currentVoice?.stop();
      this.currentVoice = null;
    }
  }

  clear(): void {
    this.heldNotes = [];
    this.sortedNotes = [];
    this.expandedNotes = [];
    this.stepIndex = 0;
    this.direction = 1;
    this.currentVoice?.stop();
    this.currentVoice = null;
  }

  private rebuildSorted(): void {
    this.sortedNotes = [...this.heldNotes].sort((a, b) => a.semitones - b.semitones);
    this.expandOctaves();
    if (this.stepIndex >= this.expandedNotes.length) {
      this.stepIndex = 0;
    }
  }

  private expandOctaves(): void {
    if (this.sortedNotes.length === 0) {
      this.expandedNotes = [];
      return;
    }
    const result: HeldNote[] = [];
    for (let oct = 0; oct < this.octaveRange; oct++) {
      for (const note of this.sortedNotes) {
        const multiplier = Math.pow(2, oct);
        result.push({
          frequency: note.frequency * multiplier,
          semitones: note.semitones + oct * 12,
        });
      }
    }
    this.expandedNotes = result;
  }

  tick(_time: number): void {
    if (!this.enabled || this.expandedNotes.length === 0) return;

    this.currentVoice?.stop();
    this.currentVoice = null;

    const note = this.getNextNote();
    if (note) {
      this.currentVoice = getSynth().play(note.frequency);
      this.onNotePlayed?.(note.semitones);
    }
  }

  private getNextNote(): HeldNote | null {
    const notes = this.getPatternNotes();
    if (notes.length === 0) return null;

    switch (this.pattern) {
      case 'up':
      case 'down':
      case 'asPlayed':
      case 'converge':
      case 'diverge': {
        const idx = this.stepIndex % notes.length;
        this.stepIndex++;
        return notes[idx]!;
      }
      case 'upDown':
      case 'downUp': {
        if (notes.length <= 1) {
          this.stepIndex++;
          return notes[0]!;
        }
        const idx = this.stepIndex % notes.length;
        const note = notes[idx]!;
        this.stepIndex += this.direction;
        if (this.stepIndex >= notes.length) {
          this.stepIndex = notes.length - 2;
          this.direction = -1;
        } else if (this.stepIndex < 0) {
          this.stepIndex = 1;
          this.direction = 1;
        }
        return note;
      }
      case 'random': {
        const idx = Math.floor(Math.random() * notes.length);
        return notes[idx]!;
      }
    }
  }

  private getPatternNotes(): HeldNote[] {
    switch (this.pattern) {
      case 'up':
        return this.expandedNotes;
      case 'down':
        return [...this.expandedNotes].reverse();
      case 'upDown':
        return this.expandedNotes;
      case 'downUp':
        return [...this.expandedNotes].reverse();
      case 'random':
        return this.expandedNotes;
      case 'asPlayed': {
        // Use insertion order, expanded across octaves
        const result: HeldNote[] = [];
        for (let oct = 0; oct < this.octaveRange; oct++) {
          for (const note of this.heldNotes) {
            const multiplier = Math.pow(2, oct);
            result.push({
              frequency: note.frequency * multiplier,
              semitones: note.semitones + oct * 12,
            });
          }
        }
        return result;
      }
      case 'converge': {
        // Alternate from bottom and top inward
        const notes = this.expandedNotes;
        const result: HeldNote[] = [];
        let lo = 0, hi = notes.length - 1;
        while (lo <= hi) {
          result.push(notes[lo]!);
          if (lo !== hi) result.push(notes[hi]!);
          lo++;
          hi--;
        }
        return result;
      }
      case 'diverge': {
        // From center outward
        const notes = this.expandedNotes;
        const result: HeldNote[] = [];
        const mid = Math.floor(notes.length / 2);
        let lo = mid, hi = mid + 1;
        if (notes.length % 2 === 1) {
          result.push(notes[mid]!);
          hi = mid + 1;
          lo = mid - 1;
        } else {
          lo = mid - 1;
        }
        while (lo >= 0 || hi < notes.length) {
          if (hi < notes.length) result.push(notes[hi]!);
          if (lo >= 0) result.push(notes[lo]!);
          lo--;
          hi++;
        }
        return result;
      }
    }
  }
}

let instance: ArpeggiatorEngine | null = null;

export function getArpeggiator(): ArpeggiatorEngine {
  if (!instance) {
    instance = new ArpeggiatorEngine();
  }
  return instance;
}
