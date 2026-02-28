import Note from './Note';

export default function getStrings(fretCount: number, tuning: string[]): Note[][] {
  const openNotes = tuning.map(noteStr => new Note(noteStr));
  return openNotes.map(note => {
    const notes: Note[] = [];
    for (let i = 1; i < fretCount; i++) {
      notes.push(new Note(note.semitones + i));
    }
    return notes;
  });
}
