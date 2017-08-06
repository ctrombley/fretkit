import modes from './modes';

/* eslint-disable dot-notation, quote-props */

const scales = {
  'bebop dominant': ['1', '2', '3', '4', '5', '6', '♭7', '7'],
  'bebop minor': ['1', '2', '♭3', '3', '4', '5', '6', '♭7'],
  'bebop major': ['1', '2', '3', '4', '5', '♭6', '6', '7'],
  'bebop melodic minor': ['1', '2', '♭3', '4', '5', '♭6', '6', '7'],
  'bebop harmonic minor': ['1', '2', '♭3', '4', '5', '♭6', '♭7', '7'],
  'blues': ['1', '♭3', '4', '♭5', '5', '♭7'],
  'chromatic': ['1', '♯1', '2', '♯2', '3', '4', '♯4', '5', '♯5', '6', '♯6', '7'],
  'diminished': ['1', '2', '♭3', '4', '♭5', '#5', '6', '7'],
  'half diminished': ['1', '2', '♭3', '4', '♭5', '♭6', '♭7'],
  'harmonic major': ['1', '2', '3', '4', '5', '♭6', '7'],
  'harmonic minor': ['1', '2', '♭3', '4', '5', '♭6', '7'],
  'major pentatonic': ['1', '2', '3', '5', '6'],
  'melodic minor': ['1', '2', '♭3', '4', '5', '6', '7'],
  'minor pentatonic': ['1', '♭3', '4', '5', '♭7'],
  'tritone': ['1', '♭2', '3', '♭5', '5', '7'],
  'whole tone': ['1', '2', '3', '♯4', '♯5', '♯6'],
};

scales['bebop'] = scales['bebop dominant'];
scales['major bebop'] = scales['bebop major'];
scales['major'] = modes.ionian;
scales['major bebop'] = scales['bebop major'];
scales['minor bebop'] = scales['bebop minor'];
scales['dorian bebop'] = scales['bebop minor'];
scales['bebop dorian'] = scales['bebop minor'];
scales['half-diminished'] = scales['half diminished'];
scales['natural minor'] = modes.aeolian;
scales['pentatonic'] = scales['major pentatonic'];

/* eslint-enable dot-notation, quote-props */

export default scales;
