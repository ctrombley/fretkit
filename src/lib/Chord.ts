import chords from './chords';
import Note from './Note';

const chordRegex = /^\s*([A-Ga-g]{1}[♮#♯𝄪b♭𝄫]{0,2})\s*([\w°øΔ⑦♭♯+\-\s]+?)\s*$/;

export default class Chord {
  name: string = '';
  type: string = 'Chord';
  notes: Note[] = [];
  root?: Note;

  constructor(input?: string) {
    if (typeof input === 'string') {
      this.parseString(input);
    }
  }

  private parseString(chordStr: string): void {
    const result = chordStr.match(chordRegex);
    if (!result) {
      throw new Error(`Invalid chord string: ${chordStr}`);
    }

    const [, root, chordName] = result;
    if (!root || !chordName || !chords[chordName]) {
      throw new Error(`Invalid chord string: ${chordStr}`);
    }

    const chordIntervals = chords[chordName]!;

    this.name = chordStr;
    this.type = 'Chord';
    this.root = new Note(root);
    this.notes = chordIntervals.map(
      interval => new Note(new Note(root).add(interval).baseSemitones)
    );
  }
}
