import Note from './Note';
import scales from './scales';

const scaleRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*([\w\s]+?)\s*$/;

export default class Scale {
  constructor(input) {
    if (!input) {
      this.notes = [];
    }

    if (typeof input === 'string') {
      this.parseString(input);
    }
    if (typeof input === 'object') {
      this.parseOpts(input);
    }
  }

  parseString(scaleStr) {
    let match;
    let root;
    let scale;

    try {
      [match, root, scale] = scaleStr.match(scaleRegex);
    } catch (e) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    if (!match || !root || (scale && !scales[scale])) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    scale = scales[scale.toLowerCase()];

    this.name = scaleStr;
    this.notes = scale.map(intervalStr => new Note(new Note(root).add(intervalStr).baseSemitones));
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
