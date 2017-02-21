export default class Sequence {
  constructor(stringNotes) {
    this.stringNotes = stringNotes || [];
  }

  get difficulty() {
    
  }

  get minFret() {
    return Math.min.apply(null, this.stringNotes.map(sn => sn.fret));
  }

  get maxFret() {
    return Math.max.apply(null, this.stringNotes.map(sn => sn.fret));
  }

  get fretDelta() {
    return this.maxFret - this.minFret;
  }

  get maxString() {
    return Math.max.apply(null, this.stringNotes.map(sn => sn.string));
  }

  get minString() {
    return Math.min.apply(null, this.stringNotes.map(sn => sn.string));
  }

  clone() {
    return new Sequence(this.stringNotes.slice());
  }

  push(stringNote) {
    this.stringNotes.push(stringNote);
  }

  pop() {
    this.stringNotes.pop();
  }
}
