import StringNote from './StringNote';

export default class Sequence {
  stringNotes: StringNote[];

  constructor(stringNotes?: StringNote[]) {
    this.stringNotes = stringNotes ?? [];
  }

  get length(): number {
    return this.stringNotes.length;
  }

  get minFret(): number {
    return Math.min(...this.stringNotes.map(sn => sn.fret));
  }

  get maxFret(): number {
    return Math.max(...this.stringNotes.map(sn => sn.fret));
  }

  get fretDelta(): number {
    return this.maxFret - this.minFret;
  }

  get maxString(): number {
    return Math.max(...this.stringNotes.map(sn => sn.string));
  }

  get minString(): number {
    return Math.min(...this.stringNotes.map(sn => sn.string));
  }

  clone(): Sequence {
    return this.slice();
  }

  push(stringNote: StringNote): void {
    this.stringNotes.push(stringNote);
  }

  pop(): void {
    this.stringNotes.pop();
  }

  shift(): void {
    this.stringNotes.shift();
  }

  slice(i?: number, j?: number): Sequence {
    return new Sequence(this.stringNotes.slice(i, j));
  }
}
