const noteRegex = /^\s*([A-Ga-g]{1})([#b]{0,2})([\d]{0,1})\s*$/;

const notes = {
  'c': 0,
  'd': 2,
  'e': 4,
  'f': 5,
  'g': 7,
  'a': 9,
  'b': 11
};

const modifiers = {
  '#': 1,
  'b': -1,
  '##': 2,
  'bb': -2
};

export default class Note {
  constructor(noteStr) {
    if (!noteStr) {
      throw new Error('Note string required');
    }

    let match, baseNote, modifier, octave;
    try {
      [match, baseNote, modifier, octave] = noteStr.match(noteRegex);
    } catch(e) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    if (!match || !baseNote || (modifier && !modifiers[modifier])) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    let value = notes[baseNote.toLowerCase()];

    if (modifier) {
      value = value + modifiers[modifier]; 
      value = value % 12;

      if (value < 0) {
        value = value + 12;
      }
    }

    if (octave) {
      this.octave = parseInt(octave, 10);
      value = value + this.octave * 12;
    }

    this.value = value;
  }

  add(note) {
    return 
  }
}
