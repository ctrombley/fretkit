import Note from './Note';

export function parseList(input: string | string[]): Note[] {
  if (!input) return [];

  const list = typeof input === 'string' ? input.match(/[^ ]+/g) : input;
  if (!list) return [];

  return list
    .map(token => {
      try {
        return new Note(token);
      } catch {
        return null;
      }
    })
    .filter((n): n is Note => n !== null);
}
