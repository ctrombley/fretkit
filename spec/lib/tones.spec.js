const chai = require('chai');
const expect = chai.expect;
import tunings from '../../src/lib/tunings.js';
import parse from '../../src/lib/tones.js';

describe('tones', () => {
  describe('parse', () => {
    it('should parse lowercase', () => {
      expect(parse('c0')).to.equal(0);
      expect(parse('d0')).to.equal(2);
      expect(parse('e0')).to.equal(4);
      expect(parse('c1')).to.equal(12);
      expect(parse('d1')).to.equal(14);
      expect(parse('e1')).to.equal(16);
    });

    it('should parse uppercase', () => {
      expect(parse('C0')).to.equal(0);
      expect(parse('D0')).to.equal(2);
      expect(parse('E0')).to.equal(4);
      expect(parse('C1')).to.equal(12);
      expect(parse('D1')).to.equal(14);
      expect(parse('E1')).to.equal(16);
    });

    it('should parse sharps', () => {
      expect(parse('c#0')).to.equal(1);
      expect(parse('d#0')).to.equal(3);
      expect(parse('c#1')).to.equal(13);
      expect(parse('d#1')).to.equal(15);
    });

    it('should parse flats', () => {
      expect(parse('db0')).to.equal(1);
      expect(parse('eb0')).to.equal(3);
      expect(parse('db1')).to.equal(13);
      expect(parse('eb1')).to.equal(15);
    });

    it('should parse standard tuning', () => {
      expect(parse(tunings.standard)).to.deep.equal(
        [ 28, 33, 38, 43, 47, 52]
      );
    })
  })
});
