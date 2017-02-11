const notes = {
  'c': 0,
  'd': 2,
  'e': 4,
  'f': 5,
  'g': 7,
  'a': 9,
  'b': 11
};

const modifiers = {
  '#': 1,
  'b': -1
};

export default function parse(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Array) {
    return parseList(input);
  }

  const distinctTokens = input.match(/[^ ]+/g);
  if (distinctTokens.length > 1) {
    return parseList(distinctTokens);
  }

  const chars = input.split('');
  let fullNote = chars.shift().toLowerCase();
  let note = notes[fullNote.toLowerCase()];

  let nextChar = chars.shift()
  if (!nextChar) {
    // TODO: return new Note(fullNote)
    return note;
  }

  nextChar = nextChar.toLowerCase();
  if (Object.keys(modifiers).includes(nextChar)) {
    note = note + modifiers[nextChar];
    fullNote = fullNote + nextChar;
    nextChar = chars.shift();
  }

  if (!nextChar) {
    // TODO: return new Note(fullNote)
    return note;
  }

  nextChar = nextChar.toLowerCase();
  const octave = parseInt(nextChar, 10);
  const octaveModifier = octave * 12;
  note = note + octaveModifier;

  // TODO: return new Note(fullNote)
  return note;
}

export function parseList(input) {
  if (typeof(input) === 'string') {
    input = input.match(/[^ ]+/g);
  }

  return input.map(parse);
}
