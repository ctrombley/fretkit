import Note from '../../src/lib/Note.js';
import chai from 'chai';

const expect = chai.expect;
const assert = chai.assert;

describe('Note', () => {
  describe('constructor', () => {

    it('should not parse without args', () => {
      assert.throws(() => new Note());
    });

    it('should not parse null', () => {
      assert.throws(() => new Note(null));
    });

    it('should not parse undefined', () => {
      assert.throws(() => new Note(undefined));
    });

    it('should not parse the empty string', () => {
      assert.throws(() => new Note(''));
    });

    it('should not parse whitespace', () => {
      assert.throws(() => new Note(' '));
    });

    it('should not parse gibberish', () => {
      assert.throws(() => new Note('hf893qc'));
    });

    it('should parse a note string', () => {
      const note = new Note('d');
      expect(note.value).to.equal(2);
      expect(note.baseNote).to.equal('D');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with a sharp', () => {
      const note = new Note('d#');
      expect(note.value).to.equal(3);
      expect(note.baseNote).to.equal('D#');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with a flat', () => {
      const note = new Note('db');
      expect(note.value).to.equal(1);
      expect(note.baseNote).to.equal('Db');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with a double sharp', () => {
      const note = new Note('d##');
      expect(note.value).to.equal(4);
      expect(note.baseNote).to.equal('D##');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with a double flat', () => {
      const note = new Note('dbb');
      expect(note.value).to.equal(0);
      expect(note.baseNote).to.equal('Dbb');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a c flat', () => {
      const note = new Note('cb');
      expect(note.value).to.equal(11);
      expect(note.baseNote).to.equal('Cb');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a b sharp', () => {
      const note = new Note('b#');
      expect(note.value).to.equal(0);
      expect(note.baseNote).to.equal('B#');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with whitespace', () => {
      const note = new Note(' d ');
      expect(note.value).to.equal(2);
      expect(note.baseNote).to.equal('D');
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with an octave', () => {
      const note = new Note('d1');
      expect(note.value).to.equal(14);
      expect(note.baseNote).to.equal('D');
      expect(note.octave).to.equal(1);
    });

    it('should parse a note string with a modifier and an octave', () => {
      const note = new Note('d#1');
      expect(note.value).to.equal(15);
      expect(note.baseNote).to.equal('D#');
      expect(note.octave).to.equal(1);
    });
  });
});
