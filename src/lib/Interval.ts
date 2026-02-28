const intervalRegex = /^\s*([pPmMdDb♭𝄫aA#♯']{0,2})([\d]{1})\s*$/;

const perfectTones = ['4', '5', '8'];

const tones: Record<string, number> = {
  '1': 0,
  '2': 2,
  '3': 4,
  '4': 5,
  '5': 7,
  '6': 9,
  '7': 11,
  '8': 12,
};

const modifiers: Record<string, number> = {
  'p': 0, 'P': 0, 'M': 0,
  'a': 1, 'A': 1, '♯': 1, '#': 1,
  'm': -1, 'b': -1, '♭': -1,
  '𝄫': -2, 'bb': -2, 'd': -2, 'D': -2,
};

export default class Interval {
  semitones: number;

  constructor(input?: string | number | Interval) {
    this.semitones = 0;

    if (input instanceof Interval) {
      this.semitones = input.semitones;
    } else if (typeof input === 'string') {
      this.parseString(input);
    } else if (typeof input === 'number') {
      this.semitones = input;
    }
  }

  private parseString(intervalStr: string): void {
    const result = intervalStr.match(intervalRegex);
    if (!result) {
      throw new Error(`Invalid interval string: ${intervalStr}`);
    }

    const [, modifier, tone] = result;
    if (!tone || (modifier && modifiers[modifier] === undefined)) {
      throw new Error(`Invalid interval string: ${intervalStr}`);
    }

    let semitones = tones[tone]!;

    if (modifier) {
      if (modifier.toLowerCase() === 'd' && perfectTones.includes(tone)) {
        semitones -= 1;
      } else {
        semitones += modifiers[modifier]!;
      }
    }

    this.semitones = semitones;
  }
}
