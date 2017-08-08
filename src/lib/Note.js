import Interval from './Interval';

const noteRegex = /^\s*([A-Ga-g]{1})([♮#♯𝄪b♭𝄫]{0,2})([\d]{0,1})\s*$/;

/* eslint quote-props: "off" */

const notes = {
  'c': 0,
  'd': 2,
  'e': 4,
  'f': 5,
  'g': 7,
  'a': 9,
  'b': 11,
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
  '𝄫': -2,
};

/* eslint quote-props: "off" */

export default class Note {
  constructor(input) {
    if (!input) {
      this.semitones = 0;
    }

    if (input instanceof Note) {
      this.semitones = input.semitones;
    }

    if (typeof input === 'string') {
      this.parseString(input);
    }
    if (typeof input === 'number') {
      this.parseNumber(input);
    }
    if (typeof input === 'object') {
      this.parseOpts(input);
    }
  }

  static parseBaseNote(noteLetter, modifier) {
    let semitones = notes[noteLetter.toLowerCase()];

    if (modifier) {
      semitones += modifiers[modifier];
      semitones %= 12;

      if (semitones < 0) {
        semitones += 12;
      }
    }

    return semitones;
  }

  parseString(noteStr) {
    let match;
    let noteLetter;
    let modifier;
    let octave;

    try {
      [match, noteLetter, modifier, octave] = noteStr.match(noteRegex);
    } catch (e) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    if (!match || !noteLetter || (modifier && !modifiers[modifier])) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    const baseSemitones = Note.parseBaseNote(noteLetter, modifier);

    if (octave) {
      this.octave = parseInt(octave, 10);
    }

    this.semitones = baseSemitones + ((this.octave || 0) * 12);
  }

  get baseSemitones() {
    return this.semitones % 12;
  }

  get referenceSemitones() {
    return this.subtract(new Note('A4')).semitones;
  }

  get frequency() {
    return 440 * ((2 ** (1 / 12)) ** this.referenceSemitones);
  }

  get baseNote() {
    return new Note(this.baseSemitones);
  }

  parseNumber(semitones) {
    this.semitones = semitones;
  }

  parseOpts(opts) {
    this.opts = opts;
  }

  add(input) {
    let semitones;
    if (input instanceof Interval || input instanceof Note) {
      semitones = input.semitones;
    } else if (typeof input === 'string') {
      semitones = new Interval(input).semitones;
    } else if (typeof input === 'number') {
      semitones = input;
    }

    return new Note(this.semitones + semitones);
  }

  subtract(input) {
    let semitones;
    if (input instanceof Interval || input instanceof Note) {
      semitones = input.semitones;
    } else if (typeof input === 'string') {
      semitones = new Interval(input).semitones;
    } else if (typeof input === 'number') {
      semitones = input;
    }

    return new Note(this.semitones - semitones);
  }
}
