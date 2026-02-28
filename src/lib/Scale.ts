import Note from './Note';
import scales from './scales';

const scaleRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*([\w\s]+?)\s*$/;

export default class Scale {
  name: string = '';
  type: string = 'Scale';
  notes: Note[] = [];
  root?: Note;

  constructor(input?: string) {
    if (typeof input === 'string') {
      this.parseString(input);
    }
  }

  private parseString(scaleStr: string): void {
    const result = scaleStr.match(scaleRegex);
    if (!result) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    const [, root, scaleName] = result;
    if (!root || !scaleName || !scales[scaleName.toLowerCase()]) {
      throw new Error(`Invalid scale string: ${scaleStr}`);
    }

    const scaleIntervals = scales[scaleName.toLowerCase()]!;

    this.name = scaleStr;
    this.notes = scaleIntervals.map(
      intervalStr => new Note(new Note(root).add(intervalStr).baseSemitones)
    );
    this.root = new Note(root);
  }
}
