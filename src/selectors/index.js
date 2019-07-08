import Note from '../lib/Note'
import { createSelector } from 'reselect'

const getFretCount = (state) => state.fretCount;
const getTuning = (state) => state.tuning;

export const getStrings = createSelector(
  [ getFretCount, getTuning ],
  (fretCount, tuning) => {
    const openNotes = tuning.map(noteStr => new Note(noteStr));

    const strings = openNotes.map((note) => {
      const notes = [];
      for (let i = 1; i < fretCount; i += 1) {
        notes.push(new Note(note.semitones + i));
      }

      return notes;
    });

    return strings;
  }
)
