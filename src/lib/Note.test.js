import chai from 'chai';

import Note from '../../src/lib/Note';

const expect = chai.expect;
const assert = chai.assert;

describe('Note', () => {
  const epsilon = 1e-1;
  const C0Freq = 16.35;
  const A4Freq = 440;
  const B8Freq = 7902.13;

  describe('constructor', () => {
    it('should return default without args', () => {
      const note = new Note();
      expect(note.semitones).to.equal(0);
    });

    it('should return default for undefined', () => {
      const note = new Note(undefined);
      expect(note.semitones).to.equal(0);
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
      expect(new Note('c').semitones).to.equal(0);
      expect(new Note('C').semitones).to.equal(0);
      expect(new Note('d𝄫').semitones).to.equal(0);
      expect(new Note('D𝄫').semitones).to.equal(0);
      expect(new Note('dbb').semitones).to.equal(0);
      expect(new Note('Dbb').semitones).to.equal(0);
      expect(new Note('d♭♭').semitones).to.equal(0);
      expect(new Note('D♭♭').semitones).to.equal(0);
    });

    it('should parse a C♯/D♭', () => {
      expect(new Note('c♯').semitones).to.equal(1);
      expect(new Note('c#').semitones).to.equal(1);
      expect(new Note('C♯').semitones).to.equal(1);
      expect(new Note('C#').semitones).to.equal(1);
      expect(new Note('d♭').semitones).to.equal(1);
      expect(new Note('db').semitones).to.equal(1);
      expect(new Note('D♭').semitones).to.equal(1);
      expect(new Note('Db').semitones).to.equal(1);
    });

    it('should parse a D/E𝄫/C𝄪', () => {
      expect(new Note('d').semitones).to.equal(2);
      expect(new Note('D').semitones).to.equal(2);
      expect(new Note('e𝄫').semitones).to.equal(2);
      expect(new Note('E𝄫').semitones).to.equal(2);
      expect(new Note('ebb').semitones).to.equal(2);
      expect(new Note('Ebb').semitones).to.equal(2);
      expect(new Note('e♭♭').semitones).to.equal(2);
      expect(new Note('E♭♭').semitones).to.equal(2);
      expect(new Note('c𝄪').semitones).to.equal(2);
      expect(new Note('C𝄪').semitones).to.equal(2);
      expect(new Note('c##').semitones).to.equal(2);
      expect(new Note('C##').semitones).to.equal(2);
      expect(new Note('c♯♯').semitones).to.equal(2);
      expect(new Note('C♯♯').semitones).to.equal(2);
    });

    it('should parse a D♯/E♭', () => {
      expect(new Note('d♯').semitones).to.equal(3);
      expect(new Note('d#').semitones).to.equal(3);
      expect(new Note('D♯').semitones).to.equal(3);
      expect(new Note('D#').semitones).to.equal(3);
      expect(new Note('e♭').semitones).to.equal(3);
      expect(new Note('eb').semitones).to.equal(3);
      expect(new Note('E♭').semitones).to.equal(3);
      expect(new Note('Eb').semitones).to.equal(3);
    });

    it('should parse an E/D𝄪', () => {
      expect(new Note('e').semitones).to.equal(4);
      expect(new Note('E').semitones).to.equal(4);
      expect(new Note('d𝄪').semitones).to.equal(4);
      expect(new Note('D𝄪').semitones).to.equal(4);
      expect(new Note('d##').semitones).to.equal(4);
      expect(new Note('D##').semitones).to.equal(4);
      expect(new Note('d♯♯').semitones).to.equal(4);
      expect(new Note('D♯♯').semitones).to.equal(4);
    });

    it('should parse an F/G𝄫', () => {
      expect(new Note('f').semitones).to.equal(5);
      expect(new Note('F').semitones).to.equal(5);
      expect(new Note('g𝄫').semitones).to.equal(5);
      expect(new Note('G𝄫').semitones).to.equal(5);
      expect(new Note('gbb').semitones).to.equal(5);
      expect(new Note('Gbb').semitones).to.equal(5);
      expect(new Note('g♭♭').semitones).to.equal(5);
      expect(new Note('G♭♭').semitones).to.equal(5);
    });

    it('should parse a F♯/G♭', () => {
      expect(new Note('f♯').semitones).to.equal(6);
      expect(new Note('f#').semitones).to.equal(6);
      expect(new Note('F♯').semitones).to.equal(6);
      expect(new Note('F#').semitones).to.equal(6);
      expect(new Note('g♭').semitones).to.equal(6);
      expect(new Note('gb').semitones).to.equal(6);
      expect(new Note('G♭').semitones).to.equal(6);
      expect(new Note('Gb').semitones).to.equal(6);
    });

    it('should parse an G/A𝄫/F𝄪', () => {
      expect(new Note('g').semitones).to.equal(7);
      expect(new Note('G').semitones).to.equal(7);
      expect(new Note('a𝄫').semitones).to.equal(7);
      expect(new Note('A𝄫').semitones).to.equal(7);
      expect(new Note('abb').semitones).to.equal(7);
      expect(new Note('Abb').semitones).to.equal(7);
      expect(new Note('a♭♭').semitones).to.equal(7);
      expect(new Note('A♭♭').semitones).to.equal(7);
      expect(new Note('f𝄪').semitones).to.equal(7);
      expect(new Note('F𝄪').semitones).to.equal(7);
      expect(new Note('f##').semitones).to.equal(7);
      expect(new Note('F##').semitones).to.equal(7);
      expect(new Note('f♯♯').semitones).to.equal(7);
      expect(new Note('F♯♯').semitones).to.equal(7);
    });

    it('should parse a G♯/A♭', () => {
      expect(new Note('g♯').semitones).to.equal(8);
      expect(new Note('g#').semitones).to.equal(8);
      expect(new Note('G♯').semitones).to.equal(8);
      expect(new Note('G#').semitones).to.equal(8);
      expect(new Note('a♭').semitones).to.equal(8);
      expect(new Note('ab').semitones).to.equal(8);
      expect(new Note('A♭').semitones).to.equal(8);
      expect(new Note('Ab').semitones).to.equal(8);
    });

    it('should parse an A/B𝄫/G𝄪', () => {
      expect(new Note('a').semitones).to.equal(9);
      expect(new Note('A').semitones).to.equal(9);
      expect(new Note('b𝄫').semitones).to.equal(9);
      expect(new Note('B𝄫').semitones).to.equal(9);
      expect(new Note('bbb').semitones).to.equal(9);
      expect(new Note('Bbb').semitones).to.equal(9);
      expect(new Note('b♭♭').semitones).to.equal(9);
      expect(new Note('B♭♭').semitones).to.equal(9);
      expect(new Note('g𝄪').semitones).to.equal(9);
      expect(new Note('G𝄪').semitones).to.equal(9);
      expect(new Note('g##').semitones).to.equal(9);
      expect(new Note('G##').semitones).to.equal(9);
      expect(new Note('g♯♯').semitones).to.equal(9);
      expect(new Note('G♯♯').semitones).to.equal(9);
    });

    it('should parse a A♯/B♭', () => {
      expect(new Note('a♯').semitones).to.equal(10);
      expect(new Note('a#').semitones).to.equal(10);
      expect(new Note('A♯').semitones).to.equal(10);
      expect(new Note('A#').semitones).to.equal(10);
      expect(new Note('b♭').semitones).to.equal(10);
      expect(new Note('bb').semitones).to.equal(10);
      expect(new Note('B♭').semitones).to.equal(10);
      expect(new Note('Bb').semitones).to.equal(10);
    });

    it('should parse a B/C♭/A𝄪', () => {
      expect(new Note('b').semitones).to.equal(11);
      expect(new Note('B').semitones).to.equal(11);
      expect(new Note('c♭').semitones).to.equal(11);
      expect(new Note('cb').semitones).to.equal(11);
      expect(new Note('C♭').semitones).to.equal(11);
      expect(new Note('Cb').semitones).to.equal(11);
      expect(new Note('a𝄪').semitones).to.equal(11);
      expect(new Note('A𝄪').semitones).to.equal(11);
      expect(new Note('a##').semitones).to.equal(11);
      expect(new Note('A##').semitones).to.equal(11);
      expect(new Note('a♯♯').semitones).to.equal(11);
      expect(new Note('A♯♯').semitones).to.equal(11);
    });

    it('should parse a note string with whitespace', () => {
      const note = new Note(' d ');
      expect(note.semitones).to.equal(2);
      expect(note.octave).to.be.undefined;
    });

    it('should parse a note string with an octave', () => {
      const note = new Note('d3');
      expect(note.semitones).to.equal(38);
      expect(note.octave).to.equal(3);
    });

    it('should parse a note string with a modifier and an octave', () => {
      const note = new Note('d#1');
      expect(note.semitones).to.equal(15);
      expect(note.octave).to.equal(1);
    });

    it('should add an interval', () => {
      const note = new Note('d#1');
      expect(note.add('♭3').semitones).to.equal(18);
    });

    it('should subtract an interval', () => {
      const note = new Note('d#1');
      expect(note.subtract('♭3').semitones).to.equal(12);
    });

    it('should expose a reference semitones property relative to A4', () => {
      expect(new Note('A4').referenceSemitones).to.equal(0);
      expect(new Note('A♭4').referenceSemitones).to.equal(-1);
      expect(new Note('A♯4').referenceSemitones).to.equal(1);
    });

    it('should expose note frequency', () => {
      expect(new Note('A4').frequency).to.be.closeTo(A4Freq, epsilon);
      expect(new Note('C0').frequency).to.be.closeTo(C0Freq, epsilon);
      expect(new Note('B8').frequency).to.be.closeTo(B8Freq, epsilon);
    });

    it('should get new note from base semitones', () => {
      expect(new Note('C1').baseNote.frequency).to.be.closeTo(C0Freq, epsilon);
      expect(new Note('C2').baseNote.frequency).to.be.closeTo(C0Freq, epsilon);
    });
  });
});
