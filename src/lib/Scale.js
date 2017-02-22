import Note from './Note.js';
import scales from './scales.js';

const scaleRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*([\w\s]+?)\s*$/;

export default class Scale {
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

  parseString(scaleStr) {
    let match, root, scale;

    try {
      [match, root, scale] = scaleStr.match(scaleRegex);
    } catch(e) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    if (!match || !root || (scale && !scales[scale])) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    scale = scales[scale.toLowerCase()];

    this.name = scaleStr;
    this.notes = scale.map((intervalStr) => new Note(root).add(intervalStr).baseNote);
    this.root = new Note(root);
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
