export default class StringNote {
  constructor(string, note, fret) {
    this.string = string;
    this.fret = fret;
    this.note = note;
  }

  get baseSemitones() {
    return this.note.baseSemitones;
  }

  get referenceSemitones() {
    return this.note.referenceSemitones;
  }

  get frequency() {
    return this.note.frequency;
  }
}
