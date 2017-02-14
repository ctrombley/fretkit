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
  let semitones = notes[baseNote.toLowerCase()];

  if (modifier) {
    semitones = semitones + modifiers[modifier]; 
    semitones = semitones % 12;

    if (semitones < 0) {
      semitones = semitones + 12;
    }
  }

  return semitones;
}

export default class Note {
  constructor(input) {
    if (!input) {
      this.semitones = 0;
    }

    if (input instanceof Note) {
      this.semitones = input.semitones;
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

    let semitones = parseBaseNote(baseNote, modifier);

    if (octave) {
      this.octave = parseInt(octave, 10);
      semitones = semitones + this.octave * 12;
    }

    this.semitones = semitones;
  }

  get baseSemitones() {
    return this.semitones % 12;
  }

  get referenceSemitones() {
    return this.subtract(new Note('A4')).semitones;
  }

  get frequency() {
    return 440 * Math.pow(Math.pow(2, 1/12), this.referenceSemitones);
  }

  parseNumber(semitones) {
    this.semitones = semitones;
  }

  parseOpts(opts) {
    this.opts = opts;
  }

  add(input) {
    let semitones;
    if (input instanceof Interval || input instanceof Note){
      semitones = input.semitones;
    } else if (typeof(input) === 'string') {
      semitones = new Interval(input).semitones;
    } else if (typeof(input) === 'number') {
      semitones = input;
    }

    return new Note(this.semitones + semitones);
  }

  subtract(input) {
    let semitones;
    if (input instanceof Interval || input instanceof Note){
      semitones = input.semitones;
    } else if (typeof(input) === 'string') {
      semitones = new Interval(input).semitones;
    } else if (typeof(input) === 'number') {
      semitones = input;
    }

    return new Note(this.semitones - semitones);
  }
}
