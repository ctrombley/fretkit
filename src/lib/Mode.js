import Note from './Note.js';
import modes from './modes.js';

const modeRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*(\w+)\s*$/;

export default class Mode {
  constructor(input) {
    if (!input) {
      this.notes = [];
    }

    if (typeof(input) === 'string') {
      this.parseString(input);
    }
    if (typeof(input) === 'object') {
      this.parseOpts(input);
    }
  }

  parseString(modeStr) {
    let match, root, mode;

    try {
      [match, root, mode] = modeStr.match(modeRegex);
    } catch(e) {
      throw new Error(`Invalid mode string: ${modeStr}`);
    }

    if (!match || !root || (mode && !modes[mode])) {
      throw new Error(`Invalid mode string: ${modeStr}`);
    }

    mode = modes[mode.toLowerCase()];

    this.notes = mode.map((intervalStr) => new Note(root).add(intervalStr));
    this.root = root;
  }

  parseNumber(value) {
    this.semitones = value;
  }

  parseOpts(opts) {
    this.opts = opts;
  }

  semitones() {
    return this.notes.map(n => n.semitones);
  }
}
