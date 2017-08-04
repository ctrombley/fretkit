export default class Notes extends Array {
  constructor(arr = []) {
    super(...arr);
  }

  baseNotes() {
    return new Notes(this.map(note => note.baseNote));
  }
}
