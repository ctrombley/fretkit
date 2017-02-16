import Interval from '../../src/lib/Interval.js';
import chai from 'chai';

const expect = chai.expect;
const assert = chai.assert;

describe('Interval', () => {
  describe ('constructor', () => {
    it('should parse a perfect unison/diminished second', () => {
      expect(new Interval('1').semitones).to.equal(0);
      expect(new Interval('p1').semitones).to.equal(0);
      expect(new Interval('P1').semitones).to.equal(0);
      expect(new Interval('d2').semitones).to.equal(0);
      expect(new Interval('D2').semitones).to.equal(0);
    });

    it('should parse a minor second/augmented unison', () => {
      expect(new Interval('m2').semitones).to.equal(1);
      expect(new Interval('b2').semitones).to.equal(1);
      expect(new Interval('♭2').semitones).to.equal(1);
      expect(new Interval('a1').semitones).to.equal(1);
      expect(new Interval('A1').semitones).to.equal(1);
    });

    it('should parse a major second/diminished third', () => {
      expect(new Interval('2').semitones).to.equal(2);
      expect(new Interval('M2').semitones).to.equal(2);
      expect(new Interval('d3').semitones).to.equal(2);
      expect(new Interval('D3').semitones).to.equal(2);
    });

    it('should parse a minor third/augmented second', () => {
      expect(new Interval('m3').semitones).to.equal(3);
      expect(new Interval('b3').semitones).to.equal(3);
      expect(new Interval('♭3').semitones).to.equal(3);
      expect(new Interval('a2').semitones).to.equal(3);
      expect(new Interval('A2').semitones).to.equal(3);
      expect(new Interval('#2').semitones).to.equal(3);
      expect(new Interval('♯2').semitones).to.equal(3);
    });

    it('should parse a major third/diminished fourth', () => {
      expect(new Interval('3').semitones).to.equal(4);
      expect(new Interval('M3').semitones).to.equal(4);
      expect(new Interval('d4').semitones).to.equal(4);
      expect(new Interval('D4').semitones).to.equal(4);
    });

    it('should parse a perfect fourth/augmented third', () => {
      expect(new Interval('4').semitones).to.equal(5);
      expect(new Interval('p4').semitones).to.equal(5);
      expect(new Interval('P4').semitones).to.equal(5);
      expect(new Interval('a3').semitones).to.equal(5);
      expect(new Interval('A3').semitones).to.equal(5);
      expect(new Interval('#3').semitones).to.equal(5);
      expect(new Interval('♯3').semitones).to.equal(5);
    });

    it('should parse a diminished fifth/augmented fourth', () => {
      expect(new Interval('d5').semitones).to.equal(6);
      expect(new Interval('D5').semitones).to.equal(6);
      expect(new Interval('a4').semitones).to.equal(6);
      expect(new Interval('A4').semitones).to.equal(6);
      expect(new Interval('#4').semitones).to.equal(6);
      expect(new Interval('♯4').semitones).to.equal(6);
    });

    it('should parse a perfect fifth/diminished sixth', () => {
      expect(new Interval('5').semitones).to.equal(7);
      expect(new Interval('p5').semitones).to.equal(7);
      expect(new Interval('P5').semitones).to.equal(7);
      expect(new Interval('d6').semitones).to.equal(7);
      expect(new Interval('D6').semitones).to.equal(7);
    });

    it('should parse a minor sixth/augmented fifth', () => {
      expect(new Interval('m6').semitones).to.equal(8);
      expect(new Interval('b6').semitones).to.equal(8);
      expect(new Interval('♭6').semitones).to.equal(8);
      expect(new Interval('a5').semitones).to.equal(8);
      expect(new Interval('A5').semitones).to.equal(8);
      expect(new Interval('#5').semitones).to.equal(8);
      expect(new Interval('♯5').semitones).to.equal(8);
    });

    it('should parse a major sixth/diminished seventh', () => {
      expect(new Interval('6').semitones).to.equal(9);
      expect(new Interval('M6').semitones).to.equal(9);
      expect(new Interval('d7').semitones).to.equal(9);
      expect(new Interval('D7').semitones).to.equal(9);
      expect(new Interval('𝄫7').semitones).to.equal(9);
      expect(new Interval('bb7').semitones).to.equal(9);
    });

    it('should parse a minor seventh/augmented sixth', () => {
      expect(new Interval('m7').semitones).to.equal(10);
      expect(new Interval('b7').semitones).to.equal(10);
      expect(new Interval('♭7').semitones).to.equal(10);
      expect(new Interval('a6').semitones).to.equal(10);
      expect(new Interval('A6').semitones).to.equal(10);
      expect(new Interval('#6').semitones).to.equal(10);
      expect(new Interval('♯6').semitones).to.equal(10);
    });

    it('should parse a major seventh/diminished octave', () => {
      expect(new Interval('7').semitones).to.equal(11);
      expect(new Interval('M7').semitones).to.equal(11);
      expect(new Interval('d8').semitones).to.equal(11);
      expect(new Interval('D8').semitones).to.equal(11);
    });

    it('should parse a perfect octave/augmented seventh', () => {
      expect(new Interval('8').semitones).to.equal(12);
      expect(new Interval('p8').semitones).to.equal(12);
      expect(new Interval('P8').semitones).to.equal(12);
      expect(new Interval('a7').semitones).to.equal(12);
      expect(new Interval('A7').semitones).to.equal(12);
      expect(new Interval('#7').semitones).to.equal(12);
      expect(new Interval('♯7').semitones).to.equal(12);
    });

    it('should create a new Interval from an existing one', () => {
      const firstInterval = new Interval(13);
      const secondInterval = new Interval(firstInterval);
      expect(firstInterval).to.not.eql(secondInterval);
      expect(secondInterval.semitones).to.equal(13);
    });
  });
});
