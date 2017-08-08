import chai from 'chai';

import Note from '../../src/lib/Note';
import Chord from '../../src/lib/Chord';
import tunings from '../../src/lib/tunings';
import generate from '../../src/lib/sequenceGenerator';

const expect = chai.expect;

describe('sequenceGenerator', () => {
  const openNotes = tunings.standard.map(noteStr => new Note(noteStr));

  const strings = openNotes.map((note) => {
    const notes = [];
    for (let i = 1; i < 24; i += 1) {
      notes.push(new Note(note.semitones + i));
    }

    return notes;
  });

  const gMin7 = new Chord('Gmin7');

  describe('generate', () => {
    it('should generate a sequence', () => {
      const sequence = generate(gMin7.notes, strings, 1);
      expect(sequence).not.to.be.empty;
    });
  });
});

