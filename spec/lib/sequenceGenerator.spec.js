const chai = require('chai');
const expect = chai.expect;
import Note from '../../src/lib/Note.js';
import Scale from '../../src/lib/Scale.js';
import Chord from '../../src/lib/Chord.js';
import scales from '../../src/lib/scales.js';
import tunings from '../../src/lib/tunings.js';
import generate from '../../src/lib/sequenceGenerator.js';

describe('sequenceGenerator', () => {
  const openNotes = tunings.standard.map((noteStr) => {
    return new Note(noteStr);
  });

  const strings = openNotes.map((note) => {
    const notes = [];
    for (let i=1; i<24; i++) {
      notes.push(new Note(note.semitones + i));
    }

    return notes;
  });

  const gMajorScale = new Scale('G major');
  const gMin7 = new Chord('G min7');

  describe('generate', () => {
    it('should generate a sequence', () => {
      const sequence = generate(gMin7.notes, strings, 5);
    })
  })
})

