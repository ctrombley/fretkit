import chai from 'chai';

import Mode from '../../src/lib/Mode';

const expect = chai.expect;

describe('Mode', () => {
  describe('constructor', () => {
    it('should parse an Ionian mode', () => {
      expect(new Mode('C ionian').semitones()).to.deep.equal([0, 2, 4, 5, 7, 9, 11]);
    });

    it('should parse a Dorian mode', () => {
      expect(new Mode('C dorian').semitones()).to.deep.equal([0, 2, 3, 5, 7, 9, 10]);
    });

    it('should parse a Phrygian mode', () => {
      expect(new Mode('C phrygian').semitones()).to.deep.equal([0, 1, 3, 5, 7, 8, 10]);
    });

    it('should parse a Lydian mode', () => {
      expect(new Mode('C lydian').semitones()).to.deep.equal([0, 2, 4, 6, 7, 9, 11]);
    });

    it('should parse a Mixolydian mode', () => {
      expect(new Mode('C mixolydian').semitones()).to.deep.equal([0, 2, 4, 5, 7, 9, 10]);
    });

    it('should parse an Aeolian mode', () => {
      expect(new Mode('C aeolian').semitones()).to.deep.equal([0, 2, 3, 5, 7, 8, 10]);
    });

    it('should parse a Locrian mode', () => {
      expect(new Mode('C locrian').semitones()).to.deep.equal([0, 1, 3, 5, 6, 8, 10]);
    });
  });
});
