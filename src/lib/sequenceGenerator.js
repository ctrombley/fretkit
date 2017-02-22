import StringNote from './StringNote.js';
import Sequence from './Sequence.js';
import {inspect} from 'util';

function generate(baseNotes, strings, position) {

  const sequence = new Sequence();;
  const found = [];
  const baseNoteSemitones = baseNotes.map(n => n.semitones);

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
    //console.log()
    sequence.push(stringNote);
    //console.log(inspect(sequence, {depth: 4}))
    const index = baseNoteSemitones.indexOf(stringNote.note.baseSemitones);
    let nextInterval = baseNoteSemitones[(index + 1) % baseNoteSemitones.length] - baseNoteSemitones[(index) % baseNoteSemitones.length];

    if (nextInterval < 0) {
      nextInterval = nextInterval + 12;
    }

    const targetNote = stringNote.note.add(nextInterval);
    //console.log(`targetNote: ${inspect(targetNote)}`)

    const next = strings.map((string) => {
      for (let i=0; i<string.length; i++) {
        if (string[i].semitones === targetNote.semitones) {
          return i;
        }
      }
    });

    let foundNext = false;

    for (let i=0; i<next.length; i++) {
      if (!next[i]) { continue; }

      const nextMin = Math.min(sequence.minFret, next[i]);
      const nextMax = Math.max(sequence.maxFret, next[i]);

      //console.log();
      //console.log(`checking string: ${i}, fret: ${next[i]}`);
      //console.log(`i >= stringNote.string: ${i >= stringNote.string}`);
      //console.log(`nextMax - nextMin < 6: ${nextMax - nextMin < 6}`);
      //console.log(`next[i] >= position-1: ${next[i] >= position-1}`);


      if (i >= stringNote.string && 
        nextMax - nextMin < 6 &&
        next[i] >= position-1) {
        foundNext = true;
        traverse(new StringNote(i, targetNote, next[i]))
      }
    }

    if (sequence.maxString === strings.length-1 && !foundNext) {
      found.push(sequence.clone());
    }

    sequence.pop();
  }

  //const t0 = performance.now();
  traverse(startingStringNote);
  //const t1 = performance.now();

  //console.log(`found ${found.length} sequences in ${t1-t0} ms`)

  return found;
}

export default generate;
