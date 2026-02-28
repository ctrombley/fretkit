import Note from './Note';

export default class StringNote {
  string: number;
  fret: number;
  note: Note;

  constructor(string: number, note: Note, fret: number) {
    this.string = string;
    this.fret = fret;
    this.note = note;
  }

  get semitones(): number {
    return this.note.semitones;
  }

  get baseSemitones(): number {
    return this.note.baseSemitones;
  }

  get frequency(): number {
    return this.note.frequency;
  }
}
