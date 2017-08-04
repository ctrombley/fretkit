import StringNote from './StringNote.js';
import Sequence from './Sequence.js';
import {inspect} from 'util';

function generate(baseNotes, strings, position) {

  const sequence = new Sequence();
  const found = [];
  const baseNoteSemitones = baseNotes.map(n => n.baseSemitones);

  // Calculate the semitone differences between each string.
  const stringDistances = [];
  let maxStringDistance = 0;
  for (let i=1; i<strings.length; i++) {
    const stringDistance = strings[i][0].semitones - strings[i-1][0].semitones;
    stringDistances.push(stringDistance);
    maxStringDistance = Math.max(maxStringDistance, stringDistance);
  }

  let startingNote;

  while(!startingNote) {
    const noteToCheck = strings[0][position-1];
    if (baseNoteSemitones.includes(noteToCheck.baseSemitones)) {
      startingNote = noteToCheck;
      //console.log(`found starting note: ${startingNote.semitones}, base semitones: ${startingNote.baseSemitones}, starting index: ${baseNoteSemitones.indexOf(startingNote.baseSemitones)}`);
    }
    else {
      position = position+1;
    }
  }

  var startingStringNote = new StringNote(0, startingNote, position-1);

  function traverse(stringNote) {
    // console.log(`adding string note: ${inspect(stringNote)}`)

    // Add the new note to the sequence.
    sequence.push(stringNote);

    //console.log(inspect(sequence, {depth: 4}))

    // console.log(`baseNoteSemitones: ${inspect(baseNoteSemitones)}`);
    // console.log(`stringNote.note.baseSemitones: ${inspect(stringNote.note.baseSemitones)}`);

    // Find the new note's index in the chord.
    const index = baseNoteSemitones.indexOf(stringNote.note.baseSemitones);

    // console.log(`index: ${inspect(index)}`);

    // Find the semitone interval from the new note to the next note in the chord
    let nextInterval = baseNoteSemitones[(index + 1) % baseNoteSemitones.length] - baseNoteSemitones[(index)];
    if (nextInterval < 0) {
      nextInterval = nextInterval + 12;
    }

    // console.log(`nextInterval: ${inspect(nextInterval)}`);

    // Apply the interval to our new note to find the next note to inspect.
    const targetNote = stringNote.note.add(nextInterval);

    // console.log(`targetNote: ${inspect(targetNote)}`)

    // Find the frets that contain the target note across all the strings.
    // The resulting array will contain a stringCount-length array with the
    // fret numbers, or undefined if the string does not contain a note instance.
    const targetNoteLocations = strings.map((string) => {
      for (let i=0; i<string.length; i++) {
        if (string[i].semitones === targetNote.semitones) {
          return i;
        }
      }
    });

    // console.log(`targetNoteLocations: ${inspect(targetNoteLocations)}`)

    let foundNext = false;

    // Test each note location as a potential candidate for the sequence.
    for (let i=0; i<targetNoteLocations.length; i++) {
      // Skip the string if it doesn't contain the target note.
      if (!targetNoteLocations[i] === undefined) { continue; }

      // Find the new min and max fret if we were to choose this note
      const newMin = Math.min(sequence.minFret, targetNoteLocations[i]);
      const newMax = Math.max(sequence.maxFret, targetNoteLocations[i]);

      // console.log();
      // console.log(`checking string: ${i}, fret: ${targetNoteLocations[i]}`);
      // console.log(`i >= stringNote.string: ${i >= stringNote.string}`);
      // console.log(`newMax - newMin <= maxStringDistance: ${newMax - newMin <= maxStringDistance}`);
      // console.log(`targetNoteLocations[i] >= position-1: ${targetNoteLocations[i] >= position-1}`);

      // Traverse to the new note if 3 conditions are true:
      // 1) the new string is gte to our current string
      // 2) the distance between the new min and max frets does not exceed the max string distance
      // 3) the new note's fret is gte to the selected position
      if (
        i >= stringNote.string
        && newMax - newMin <= maxStringDistance
        && targetNoteLocations[i] >= position-1
      ) {
        foundNext = true;
        traverse(new StringNote(i, targetNote, targetNoteLocations[i]))
      } else {
        // console.log('done');
      }
    }

    // If we are at the last string and there are no more notes to find,
    // we have found a complete sequence.  Add it to the collection.
    if (sequence.maxString === strings.length-1 && !foundNext) {
      found.unshift(sequence.clone());
    }

    sequence.pop();
  }

  // TODO: find a node implementation of performance
  const performance = performance || Date;
  const t0 = performance.now();
  traverse(startingStringNote);
  const t1 = performance.now();

  console.log(`found ${found.length} sequences in ${t1-t0} ms`)
  //console.log(inspect(found, {depth: 4}));

  return found;
}

export default generate;
