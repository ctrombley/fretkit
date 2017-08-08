import chai from 'chai';

import tunings from '../../src/lib/tunings';
import parse from '../../src/lib/tones';

const expect = chai.expect;

describe('tones', () => {
  describe('parse', () => {
    it('should return null on falsy input', () => {
      expect(parse()).to.equal(null);
      expect(parse(null)).to.equal(null);
      expect(parse(undefined)).to.equal(null);
      expect(parse(false)).to.equal(null);
      expect(parse(0)).to.equal(null);
    });

    it('should parse a single note', () => {
      expect(parse('c#').semitones).to.equal(1);
    });

    it('should parse a list of notes', () => {
      const parsedNotes = parse(tunings.standard);
      const parsedValues = parsedNotes.map(x => x.semitones);
      expect(parsedValues).to.deep.equal(
        [28, 33, 38, 43, 47, 52],
      );
    });
  });
});
