import Note from '../../src/lib/Note.js';
import Notes from '../../src/lib/Notes.js';
import chai from 'chai';

const expect = chai.expect;
const assert = chai.assert;

describe("Notes", () => {
  const A0 = new Note('A0');
  const B0 = new Note('B0');
  const C0 = new Note('C0');
  const A1 = new Note('A1');
  const B1 = new Note('B1');
  const C1 = new Note('C1');

  describe("constructor", () => {

    it("should return an empty array without args", () => {
      expect(new Notes()).to.deep.equal([]);
    });

    it("should return an empty array when passed an empty array", () => {
      expect(new Notes([])).to.deep.equal([]);
    });

    it("should return the same array it's passed", () => {
      expect(new Notes([A0, B0, C0])).to.deep.equal([A0, B0, C0]);
    });
  });

  describe("baseNotes", () => {
    const notes = new Notes([A1, B1, C1]);
    const baseNotes = new Notes([A0, B0, C0]);

    console.log(notes instanceof Notes);
    console.log(notes instanceof Array);

    // TODO: figure out why this doesn't work
    it.skip("should return base notes", () => {
      expect(notes.baseNotes()).to.deep.equal(baseNotes);
    })
  })
});
