import Note from '../../src/lib/Note.js';
import chai from 'chai';

const expect = chai.expect;
const assert = chai.assert;

describe('Note', () => {
  describe('constructor', () => {

    it('should return default without args', () => {
      const note = new Note();
      expect(note.semitone).to.equal(0);
    });

    it('should return default for undefined', () => {
      const note = new Note(undefined);
      expect(note.semitone).to.equal(0);
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

    it('should parse a C/D𝄫', () => {
      expect(new Note('c').semitone).to.equal(0);
      expect(new Note('C').semitone).to.equal(0);
      expect(new Note('d𝄫').semitone).to.equal(0);
      expect(new Note('D𝄫').semitone).to.equal(0);
      expect(new Note('dbb').semitone).to.equal(0);
      expect(new Note('Dbb').semitone).to.equal(0);
      expect(new Note('d♭♭').semitone).to.equal(0);
      expect(new Note('D♭♭').semitone).to.equal(0);
    });

    it('should parse a C♯/D♭', () => {
      expect(new Note('c♯').semitone).to.equal(1);
      expect(new Note('c#').semitone).to.equal(1);
      expect(new Note('C♯').semitone).to.equal(1);
      expect(new Note('C#').semitone).to.equal(1);
      expect(new Note('d♭').semitone).to.equal(1);
      expect(new Note('db').semitone).to.equal(1);
      expect(new Note('D♭').semitone).to.equal(1);
      expect(new Note('Db').semitone).to.equal(1);
    });

    it('should parse a D/E𝄫/C𝄪', () => {
      expect(new Note('d').semitone).to.equal(2);
      expect(new Note('D').semitone).to.equal(2);
      expect(new Note('e𝄫').semitone).to.equal(2);
      expect(new Note('E𝄫').semitone).to.equal(2);
      expect(new Note('ebb').semitone).to.equal(2);
      expect(new Note('Ebb').semitone).to.equal(2);
      expect(new Note('e♭♭').semitone).to.equal(2);
      expect(new Note('E♭♭').semitone).to.equal(2);
      expect(new Note('c𝄪').semitone).to.equal(2);
      expect(new Note('C𝄪').semitone).to.equal(2);
      expect(new Note('c##').semitone).to.equal(2);
      expect(new Note('C##').semitone).to.equal(2);
      expect(new Note('c♯♯').semitone).to.equal(2);
      expect(new Note('C♯♯').semitone).to.equal(2);
    });

    it('should parse a D♯/E♭', () => {
      expect(new Note('d♯').semitone).to.equal(3);
      expect(new Note('d#').semitone).to.equal(3);
      expect(new Note('D♯').semitone).to.equal(3);
      expect(new Note('D#').semitone).to.equal(3);
      expect(new Note('e♭').semitone).to.equal(3);
      expect(new Note('eb').semitone).to.equal(3);
      expect(new Note('E♭').semitone).to.equal(3);
      expect(new Note('Eb').semitone).to.equal(3);
    });

    it('should parse an E/D𝄪', () => {
      expect(new Note('e').semitone).to.equal(4);
      expect(new Note('E').semitone).to.equal(4);
      expect(new Note('d𝄪').semitone).to.equal(4);
      expect(new Note('D𝄪').semitone).to.equal(4);
      expect(new Note('d##').semitone).to.equal(4);
      expect(new Note('D##').semitone).to.equal(4);
      expect(new Note('d♯♯').semitone).to.equal(4);
      expect(new Note('D♯♯').semitone).to.equal(4);
    });

    it('should parse an F/G𝄫', () => {
      expect(new Note('f').semitone).to.equal(5);
      expect(new Note('F').semitone).to.equal(5);
      expect(new Note('g𝄫').semitone).to.equal(5);
      expect(new Note('G𝄫').semitone).to.equal(5);
      expect(new Note('gbb').semitone).to.equal(5);
      expect(new Note('Gbb').semitone).to.equal(5);
      expect(new Note('g♭♭').semitone).to.equal(5);
      expect(new Note('G♭♭').semitone).to.equal(5);
    });

    it('should parse a F♯/G♭', () => {
      expect(new Note('f♯').semitone).to.equal(6);
      expect(new Note('f#').semitone).to.equal(6);
      expect(new Note('F♯').semitone).to.equal(6);
      expect(new Note('F#').semitone).to.equal(6);
      expect(new Note('g♭').semitone).to.equal(6);
      expect(new Note('gb').semitone).to.equal(6);
      expect(new Note('G♭').semitone).to.equal(6);
      expect(new Note('Gb').semitone).to.equal(6);
    });

    it('should parse an G/A𝄫/F𝄪', () => {
      expect(new Note('g').semitone).to.equal(7);
      expect(new Note('G').semitone).to.equal(7);
      expect(new Note('a𝄫').semitone).to.equal(7);
      expect(new Note('A𝄫').semitone).to.equal(7);
      expect(new Note('abb').semitone).to.equal(7);
      expect(new Note('Abb').semitone).to.equal(7);
      expect(new Note('a♭♭').semitone).to.equal(7);
      expect(new Note('A♭♭').semitone).to.equal(7);
      expect(new Note('f𝄪').semitone).to.equal(7);
      expect(new Note('F𝄪').semitone).to.equal(7);
      expect(new Note('f##').semitone).to.equal(7);
      expect(new Note('F##').semitone).to.equal(7);
      expect(new Note('f♯♯').semitone).to.equal(7);
      expect(new Note('F♯♯').semitone).to.equal(7);
    });

    it('should parse a G♯/A♭', () => {
      expect(new Note('g♯').semitone).to.equal(8);
      expect(new Note('g#').semitone).to.equal(8);
      expect(new Note('G♯').semitone).to.equal(8);
      expect(new Note('G#').semitone).to.equal(8);
      expect(new Note('a♭').semitone).to.equal(8);
      expect(new Note('ab').semitone).to.equal(8);
      expect(new Note('A♭').semitone).to.equal(8);
      expect(new Note('Ab').semitone).to.equal(8);
    });

    it('should parse an A/B𝄫/G𝄪', () => {
      expect(new Note('a').semitone).to.equal(9);
      expect(new Note('A').semitone).to.equal(9);
      expect(new Note('b𝄫').semitone).to.equal(9);
      expect(new Note('B𝄫').semitone).to.equal(9);
      expect(new Note('bbb').semitone).to.equal(9);
      expect(new Note('Bbb').semitone).to.equal(9);
      expect(new Note('b♭♭').semitone).to.equal(9);
      expect(new Note('B♭♭').semitone).to.equal(9);
      expect(new Note('g𝄪').semitone).to.equal(9);
      expect(new Note('G𝄪').semitone).to.equal(9);
      expect(new Note('g##').semitone).to.equal(9);
      expect(new Note('G##').semitone).to.equal(9);
      expect(new Note('g♯♯').semitone).to.equal(9);
      expect(new Note('G♯♯').semitone).to.equal(9);
    });

    it('should parse a A♯/B♭', () => {
      expect(new Note('a♯').semitone).to.equal(10);
      expect(new Note('a#').semitone).to.equal(10);
      expect(new Note('A♯').semitone).to.equal(10);
      expect(new Note('A#').semitone).to.equal(10);
      expect(new Note('b♭').semitone).to.equal(10);
      expect(new Note('bb').semitone).to.equal(10);
      expect(new Note('B♭').semitone).to.equal(10);
      expect(new Note('Bb').semitone).to.equal(10);
    });

    it('should parse a B/C♭/A𝄪', () => {
      expect(new Note('b').semitone).to.equal(11);
      expect(new Note('B').semitone).to.equal(11);
      expect(new Note('c♭').semitone).to.equal(11);
      expect(new Note('cb').semitone).to.equal(11);
      expect(new Note('C♭').semitone).to.equal(11);
      expect(new Note('Cb').semitone).to.equal(11);
      expect(new Note('a𝄪').semitone).to.equal(11);
      expect(new Note('A𝄪').semitone).to.equal(11);
      expect(new Note('a##').semitone).to.equal(11);
      expect(new Note('A##').semitone).to.equal(11);
      expect(new Note('a♯♯').semitone).to.equal(11);
      expect(new Note('A♯♯').semitone).to.equal(11);
    });

    it('should parse a note string with whitespace', () => {
      const note = new Note(' d ');
      expect(note.semitone).to.equal(2);
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with an octave', () => {
      const note = new Note('d3');
      expect(note.semitone).to.equal(38);
      expect(note.octave).to.equal(3);
    });

    it('should parse a note string with a modifier and an octave', () => {
      const note = new Note('d#1');
      expect(note.semitone).to.equal(15);
      expect(note.octave).to.equal(1);
    });

    it('should add an interval', () => {
      const note = new Note('d#1');
      expect(note.add('♭3').semitone).to.equal(18);
    });

    it('should subtract an interval', () => {
      const note = new Note('d#1');
      expect(note.subtract('♭3').semitone).to.equal(12);
    });
  });
});
