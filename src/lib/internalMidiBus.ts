export type NoteSource = 'latch' | 'arp' | 'latch-synth' | 'latch-sampler';

export interface NoteOnEvent {
  semitones: number;
  frequency: number;
  source?: NoteSource;
  velocity?: number; // 0-127
}

export interface NoteOffEvent {
  semitones: number;
  source?: NoteSource;
}

type NoteOnHandler = (event: NoteOnEvent) => void;
type NoteOffHandler = (event: NoteOffEvent) => void;
type AllNotesOffHandler = () => void;

class InternalMidiBus {
  private noteOnHandlers = new Set<NoteOnHandler>();
  private noteOffHandlers = new Set<NoteOffHandler>();
  private allNotesOffHandlers = new Set<AllNotesOffHandler>();

  onNoteOn(handler: NoteOnHandler): () => void {
    this.noteOnHandlers.add(handler);
    return () => this.noteOnHandlers.delete(handler);
  }

  onNoteOff(handler: NoteOffHandler): () => void {
    this.noteOffHandlers.add(handler);
    return () => this.noteOffHandlers.delete(handler);
  }

  onAllNotesOff(handler: AllNotesOffHandler): () => void {
    this.allNotesOffHandlers.add(handler);
    return () => this.allNotesOffHandlers.delete(handler);
  }

  noteOn(semitones: number, frequency: number, source?: NoteSource, velocity?: number): void {
    this.noteOnHandlers.forEach(fn => fn({ semitones, frequency, source, velocity }));
  }

  noteOff(semitones: number, source?: NoteSource): void {
    this.noteOffHandlers.forEach(fn => fn({ semitones, source }));
  }

  allNotesOff(): void {
    this.allNotesOffHandlers.forEach(fn => fn());
  }
}

let instance: InternalMidiBus | null = null;

export function getInternalMidiBus(): InternalMidiBus {
  if (!instance) instance = new InternalMidiBus();
  return instance;
}
