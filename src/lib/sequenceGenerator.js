import StringNote from './StringNote';
import Sequence from './Sequence';
import { inspect } from 'util';

function generate(baseNotes, strings, position) {
  const sequence = new Sequence();
  const found = [];
  const baseNoteSemitones = baseNotes.map(n => n.baseSemitones);

  // Calculate the semitone differences between each string.
  const stringDistances = [];
  let maxStringDistance = 0;
  for (let i = 1; i < strings.length; i += 1) {
    const stringDistance = strings[i][0].semitones - strings[i - 1][0].semitones;
    stringDistances.push(stringDistance);
    maxStringDistance = Math.max(maxStringDistance, stringDistance);
  }

  let startingNote;

  while (!startingNote) {
    const noteToCheck = strings[0][position - 1];
    if (baseNoteSemitones.includes(noteToCheck.baseSemitones)) {
      startingNote = noteToCheck;
      // console.debug(`found starting note: ${startingNote.semitones},
      //   base semitones: ${startingNote.baseSemitones},
      //   starting index: ${baseNoteSemitones.indexOf(startingNote.baseSemitones)}`);
    } else {
      position += 1; // eslint-disable-line no-param-reassign
    }
  }

  const startingStringNote = new StringNote(0, startingNote, position - 1);

  function traverse(stringNote) {
    console.debug(`adding string note: ${inspect(stringNote)}`)

    // Add the new note to the sequence.
    sequence.push(stringNote);

    // console.debug(inspect(sequence, {depth: 4}))

    // console.debug(`baseNoteSemitones: ${inspect(baseNoteSemitones)}`);
    // console.debug(`stringNote.note.baseSemitones: ${inspect(stringNote.note.baseSemitones)}`);

    // Find the new note's index in the chord.
    const index = baseNoteSemitones.indexOf(stringNote.note.baseSemitones);

    // console.debug(`index: ${inspect(index)}`);

    // Find the semitone interval from the new note to the next note in the chord
    const idx = (index + 1) % baseNoteSemitones.length; // TODO: name idx better
    let nextInterval = baseNoteSemitones[idx] - baseNoteSemitones[index];
    if (nextInterval < 0) nextInterval += 12;

    // console.debug(`nextInterval: ${inspect(nextInterval)}`);

    // Apply the interval to our new note to find the next note to inspect.
    const targetNote = stringNote.note.add(nextInterval);

    // console.debug(`targetNote: ${inspect(targetNote)}`)

    // Find the frets that contain the target note across all the strings.
    // The resulting array will contain a stringCount-length array with the
    // fret numbers, or undefined if the string does not contain a note instance.
    const targetNoteLocations = strings.map((string) => {
      for (let i = 0; i < string.length; i += 1) {
        if (string[i].semitones === targetNote.semitones) {
          return i;
        }
      }

      return null;
    });

    // console.debug(`targetNoteLocations: ${inspect(targetNoteLocations)}`)

    let foundNext = false;

    // Test each note location as a potential candidate for the sequence.
    for (let i = 0; i < targetNoteLocations.length; i += 1) {
      // Skip the string if it doesn't contain the target note.
      if (!targetNoteLocations[i]) {
        continue;
      }
      // Find the new min and max fret if we were to choose this note
      const newMin = Math.min(sequence.minFret, targetNoteLocations[i]);
      const newMax = Math.max(sequence.maxFret, targetNoteLocations[i]);

      // console.debug();
      // console.debug(`checking string: ${i}, fret: ${targetNoteLocations[i]}`);
      // console.debug(`${i >= stringNote.string}`);
      // console.debug(`${newMax - newMin <= maxStringDistance}`);
      // console.debug(`${targetNoteLocations[i] >= position-1}`);

      // Traverse to the new note if 3 conditions are true:
      // 1) the new string is gte to our current string
      // 2) the distance between the new min and max frets does not exceed the max string distance
      // 3) the new note's fret is gte to the selected position
      if (
        i >= stringNote.string
        && newMax - newMin <= maxStringDistance
        && targetNoteLocations[i] >= position - 1
      ) {
        foundNext = true;
        traverse(new StringNote(i, targetNote, targetNoteLocations[i]));
      } else {
        // console.debug('done');
      }
    }

    // If we are at the last string and there are no more notes to find,
    // we have found a complete sequence.  Add it to the collection.
    if (sequence.maxString === strings.length - 1 && !foundNext) {
      // console.debug(`found sequence ${inspect(sequence)}`)
      found.unshift(sequence.clone());
    }

    sequence.pop();
  }

  let t0 = 0;
  let t1 = 0;
  if (window.performance) {
    t0 = window.performance.now();
  }

  traverse(startingStringNote);

  // If removing the first or last note of a sequence optimizes
  // its total fret delta, then remove that note.
  found.forEach((seq) => {
    if (seq.slice(0, seq.length - 1).fretDelta < seq.fretDelta) {
      seq.pop();
    }

    if (seq.slice(1).fretDelta < seq.fretDelta) {
      seq.shift();
    }
  });

  // Sort by fret width to show the most optimized path first.
  found.sort((a, b) => a.fretDelta - b.fretDelta);

  if (window.performance) {
    t1 = window.performance.now();
  }

  console.info(`found ${found.length} sequences in ${t1 - t0} ms`);
  // console.debug(inspect(found, {depth: 4}));

  return found;
}

export default generate;
