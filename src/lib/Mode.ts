import Note from './Note';
import modes from './modes';

const modeRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*(\w+)\s*$/;

export default class Mode {
  name: string = '';
  type: string = 'Mode';
  notes: Note[] = [];
  root?: Note;

  constructor(input?: string) {
    if (typeof input === 'string') {
      this.parseString(input);
    }
  }

  private parseString(modeStr: string): void {
    const result = modeStr.match(modeRegex);
    if (!result) {
      throw new Error(`Invalid mode string: ${modeStr}`);
    }

    const [, root, modeName] = result;
    if (!root || !modeName || !modes[modeName.toLowerCase()]) {
      throw new Error(`Invalid mode string: ${modeStr}`);
    }

    const modeIntervals = modes[modeName.toLowerCase()]!;

    this.name = modeStr;
    this.notes = modeIntervals.map(intervalStr => new Note(root).add(intervalStr));
    this.root = new Note(root);
  }
}
