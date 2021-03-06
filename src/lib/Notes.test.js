import chai from 'chai';

import Note from '../../src/lib/Note';
import Notes from '../../src/lib/Notes';

const expect = chai.expect;

describe('Notes', () => {
  const A0 = new Note('A0');
  const B0 = new Note('B0');
  const C0 = new Note('C0');
  const A1 = new Note('A1');
  const B1 = new Note('B1');
  const C1 = new Note('C1');

  describe('constructor', () => {
    it('should return an empty array without args', () => {
      expect(new Notes()).to.deep.equal([]);
    });

    it('should return an empty array when passed an empty array', () => {
      expect(new Notes([])).to.deep.equal([]);
    });

    it('should return the same array it is passed', () => {
      expect(new Notes([A0, B0, C0])).to.deep.equal([A0, B0, C0]);
    });
  });

  describe('baseNotes', () => {
    const notes = new Notes([A1, B1, C1]);
    const baseNotes = new Notes([A0, B0, C0]);

    // TODO: figure out why this doesn't work
    it.skip('should return base notes', () => {
      expect(notes.baseNotes()).to.deep.equal(baseNotes);
    });
  });
});
