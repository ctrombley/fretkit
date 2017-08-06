/* eslint-disable dot-notation, quote-props */

const modes = {
  'ionian': ['1', '2', '3', '4', '5', '6', '7'],
  'dorian': ['1', '2', '♭3', '4', '5', '6', '♭7'],
  'phrygian': ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'],
  'lydian': ['1', '2', '3', '♯4', '5', '6', '7'],
  'mixolydian': ['1', '2', '3', '4', '5', '6', '♭7'],
  'aeolian': ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
  'locrian': ['1', '♭2', '♭3', '4', 'd5', '♭6', '♭7'],
};

modes['I'] = modes['ionian'];
modes['II'] = modes['dorian'];
modes['III'] = modes['phrygian'];
modes['IV'] = modes['lydian'];
modes['V'] = modes['mixolydian'];
modes['VI'] = modes['aeolian'];
modes['VII'] = modes['locrian'];

/* eslint-enable dot-notation, quote-props */

export default modes;
