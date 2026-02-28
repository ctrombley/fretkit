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

  /** Sorted unique pitch classes (0–11) for this scale. */
  get pitchClasses(): number[] {
    return [...new Set(this.notes.map(n => n.baseSemitones))].sort((a, b) => a - b);
  }

  /**
   * True if this scale has the same pitch class content as `other`.
   * Two scales are modally equivalent when one is a rotation of the other
   * (e.g. C major and D dorian share the same seven pitch classes).
   */
  isModallyEquivalent(other: Scale): boolean {
    const a = this.pitchClasses;
    const b = other.pitchClasses;
    return a.length === b.length && a.every((p, i) => p === b[i]);
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
