import Note from './Note';

export function parseList(input) {
  if (typeof input === 'string') {
    input = input.match(/[^ ]+/g);
  }

  if (!input) {
    return [];
  }

  return input.map(parse).filter(n => !!n);
}

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

  try {
    return new Note(input);
  } catch (ex) {
    return null;
  }
}
