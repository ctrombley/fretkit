/* eslint-disable no-use-before-define */

import Note from './Note';

export function parseList(input) {
  let match = null;
  if (typeof input === 'string') {
    match = input.match(/[^ ]+/g);
  }

  if (!input) {
    return [];
  }

  return match.map(parse).filter(n => !!n);
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
/* eslint-enable no-use-before-define */
