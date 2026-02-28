import StringNote from './StringNote';
import Sequence from './Sequence';
import Note from './Note';

export default function generate(
  baseNotes: Note[],
  strings: Note[][],
  position: number,
): Sequence[] {
  if (!baseNotes.length) return [];

  const sequence = new Sequence();
  const found: Sequence[] = [];
  const baseNoteSemitones = baseNotes.map(n => n.baseSemitones);

  let maxStringDistance = 0;
  for (let i = 1; i < strings.length; i++) {
    const stringDistance = strings[i]![0]!.semitones - strings[i - 1]![0]!.semitones;
    maxStringDistance = Math.max(maxStringDistance, stringDistance);
  }

  let pos = position;
  let startingNote: Note | undefined;

  while (!startingNote) {
    const noteToCheck = strings[0]![pos - 1];
    if (!noteToCheck) break;
    if (baseNoteSemitones.includes(noteToCheck.baseSemitones)) {
      startingNote = noteToCheck;
    } else {
      pos += 1;
    }
  }

  if (!startingNote) return [];

  const startingStringNote = new StringNote(0, startingNote, pos - 1);

  function traverse(stringNote: StringNote): void {
    sequence.push(stringNote);

    const index = baseNoteSemitones.indexOf(stringNote.note.baseSemitones);
    const nextIdx = (index + 1) % baseNoteSemitones.length;
    let nextInterval = baseNoteSemitones[nextIdx]! - baseNoteSemitones[index]!;
    if (nextInterval < 0) nextInterval += 12;

    const targetNote = stringNote.note.add(nextInterval);

    const targetNoteLocations = strings.map((string) => {
      for (let i = 0; i < string.length; i++) {
        if (string[i]!.semitones === targetNote.semitones) {
          return i;
        }
      }
      return null;
    });

    let foundNext = false;

    for (let i = 0; i < targetNoteLocations.length; i++) {
      if (targetNoteLocations[i] === null) continue;

      const fretIdx = targetNoteLocations[i]!;
      const newMin = Math.min(sequence.minFret, fretIdx);
      const newMax = Math.max(sequence.maxFret, fretIdx);

      if (
        i >= stringNote.string &&
        newMax - newMin <= maxStringDistance &&
        fretIdx >= pos - 1
      ) {
        foundNext = true;
        traverse(new StringNote(i, targetNote, fretIdx));
      }
    }

    if (sequence.maxString === strings.length - 1 && !foundNext) {
      found.unshift(sequence.clone());
    }

    sequence.pop();
  }

  traverse(startingStringNote);

  found.forEach((seq) => {
    if (seq.slice(0, seq.length - 1).fretDelta < seq.fretDelta) {
      seq.pop();
    }
    if (seq.slice(1).fretDelta < seq.fretDelta) {
      seq.shift();
    }
  });

  found.sort((a, b) => a.fretDelta - b.fretDelta);

  return found;
}
