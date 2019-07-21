import Chord from '../lib/Chord';
import Mode from '../lib/Mode';
import Scale from '../lib/Scale';
import { parseList } from '../lib/tones';

export default function search(searchStr) {
  let chord;
  let mode;
  let scale;
  let current;
  let notes;

  try {
    chord = new Chord(searchStr);
    current = chord;
    notes = current.notes;
  } catch (ex) {
    //console.debug(ex.message)
  }

  try {
    mode = new Mode(searchStr);
    current = mode;
    notes = current.notes;
  } catch (ex) {
    //console.debug(ex.message)
  }

  try {
    scale = new Scale(searchStr);
    current = scale;
    notes = current.notes;
  } catch (ex) {
    //console.debug(ex.message)
  }

  if (!notes) {
    notes = parseList(searchStr);
  }

  return {current, notes};
}

