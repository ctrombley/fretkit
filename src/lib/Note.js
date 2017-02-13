import Interval from './Interval.js';

const noteRegex = /^\s*([A-Ga-g]{1})([♮#♯𝄪b♭𝄫]{0,2})([\d]{0,1})\s*$/;

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
  '♮': 0,
  '♯': 1,
  '#': 1,
  'b': -1,
  '♭': -1,
  '𝄪': 2,
  '##': 2,
  '♯♯': 2,
  'bb': -2,
  '♭♭': -2,
  '𝄫': -2
};

function parseBaseNote(baseNote, modifier) {
  let semitone = notes[baseNote.toLowerCase()];

  if (modifier) {
    semitone = semitone + modifiers[modifier]; 
    semitone = semitone % 12;

    if (semitone < 0) {
      semitone = semitone + 12;
    }
  }

  return semitone;
}

export default class Note {
  constructor(input) {
    if (!input) {
      this.semitone = 0;
    }

    if (input instanceof Note) {
      this.semitone = input.semitone;
    }

    if (typeof(input) === 'string') {
      this.parseString(input);
    }
    if (typeof(input) === 'number') {
      this.parseNumber(input);
    }
    if (typeof(input) === 'object') {
      this.parseOpts(input)
    }
  }

  parseString(noteStr) {
    let match, baseNote, modifier, octave;
    try {
      [match, baseNote, modifier, octave] = noteStr.match(noteRegex);
    } catch(e) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    if (!match || !baseNote || (modifier && !modifiers[modifier])) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    let semitone = parseBaseNote(baseNote, modifier);

    if (octave) {
      this.octave = parseInt(octave, 10);
      semitone = semitone + this.octave * 12;
    }

    this.semitone = semitone;
  }

  parseNumber(semitone) {
    this.semitone = semitone;
  }

  parseOpts(opts) {
    this.opts = opts;
  }

  add(interval) {
    interval = new Interval(interval);
    return new Note(this.semitone + interval.semitones);
  }

  subtract(interval) {
    interval = new Interval(interval);
    return new Note(this.semitone - interval.semitones);
  }
}
