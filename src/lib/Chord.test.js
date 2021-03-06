import chai from 'chai';

import Chord from '../../src/lib/Chord';

const expect = chai.expect;

describe('Chord', () => {
  describe('constructor', () => {
    it('should parse a major chord', () => {
      const chord = new Chord('C♯M7');
      expect(chord.semitones()).to.deep.equal([1, 5, 8, 0]);
    });
  });
});
