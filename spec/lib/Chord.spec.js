import Chord from '../../src/lib/Chord.js';
import chai from 'chai';

const expect = chai.expect;

describe('Chord', () => {
  describe('constructor', () => {
    it('should parse a major chord', () => {
      const chord = new Chord('C♯M7');
      expect(chord.semitones()).to.deep.equal([1, 5, 8, 12]);
    });
  });
});
