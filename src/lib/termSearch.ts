import Chord from './Chord';
import Mode from './Mode';
import Scale from './Scale';
import Note from './Note';
import { parseList } from './tones';

export interface SearchResult {
  current?: { name: string; type: string; root?: Note };
  notes: Note[];
}

export default function search(searchStr: string): SearchResult {
  let current: SearchResult['current'];
  let notes: Note[] | undefined;

  try {
    const chord = new Chord(searchStr);
    current = chord;
    notes = chord.notes;
  } catch { /* not a chord */ }

  try {
    const mode = new Mode(searchStr);
    current = mode;
    notes = mode.notes;
  } catch { /* not a mode */ }

  try {
    const scale = new Scale(searchStr);
    current = scale;
    notes = scale.notes;
  } catch { /* not a scale */ }

  if (!notes) {
    notes = parseList(searchStr);
  }

  return { current, notes };
}
