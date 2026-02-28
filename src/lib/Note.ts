import Interval from './Interval';

const noteRegex = /^\s*([A-Ga-g]{1})([♮#♯𝄪b♭𝄫]{0,2})([\d]{0,1})\s*$/;

const notes: Record<string, number> = {
  'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11,
};

const modifiers: Record<string, number> = {
  '♮': 0,
  '♯': 1, '#': 1,
  'b': -1, '♭': -1,
  '𝄪': 2, '##': 2, '♯♯': 2,
  'bb': -2, '♭♭': -2, '𝄫': -2,
};

export default class Note {
  semitones: number;
  octave?: number;

  constructor(input?: string | number | Note) {
    this.semitones = 0;

    if (input instanceof Note) {
      this.semitones = input.semitones;
      this.octave = input.octave;
    } else if (typeof input === 'string') {
      this.parseString(input);
    } else if (typeof input === 'number') {
      this.semitones = input;
    }
  }

  static parseBaseNote(noteLetter: string, modifier?: string): number {
    let semitones = notes[noteLetter.toLowerCase()]!;

    if (modifier) {
      semitones += modifiers[modifier]!;
      semitones %= 12;
      if (semitones < 0) {
        semitones += 12;
      }
    }

    return semitones;
  }

  private parseString(noteStr: string): void {
    const result = noteStr.match(noteRegex);
    if (!result) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    const [, noteLetter, modifier, octave] = result;
    if (!noteLetter || (modifier && modifiers[modifier] === undefined)) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }

    const baseSemitones = Note.parseBaseNote(noteLetter, modifier);

    if (octave) {
      this.octave = parseInt(octave, 10);
    }

    this.semitones = baseSemitones + ((this.octave ?? 0) * 12);
  }

  get baseSemitones(): number {
    return this.semitones % 12;
  }

  get referenceSemitones(): number {
    return this.subtract(new Note('A4')).semitones;
  }

  get frequency(): number {
    return 440 * ((2 ** (1 / 12)) ** this.referenceSemitones);
  }

  get baseNote(): Note {
    return new Note(this.baseSemitones);
  }

  add(input: string | number | Note | Interval): Note {
    let semitones: number;
    if (input instanceof Interval || input instanceof Note) {
      semitones = input.semitones;
    } else if (typeof input === 'string') {
      semitones = new Interval(input).semitones;
    } else {
      semitones = input;
    }
    return new Note(this.semitones + semitones);
  }

  subtract(input: string | number | Note | Interval): Note {
    let semitones: number;
    if (input instanceof Interval || input instanceof Note) {
      semitones = input.semitones;
    } else if (typeof input === 'string') {
      semitones = new Interval(input).semitones;
    } else {
      semitones = input;
    }
    return new Note(this.semitones - semitones);
  }
}
