import { useMemo } from 'react';
import type { ChordConfig } from '../types';
import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import termSearch from '../lib/termSearch';
import generate from '../lib/sequenceGenerator';
import getStrings from '../lib/getStrings';

interface ChordDerived {
  current: { name: string; type: string; root?: Note } | null;
  litNotes: Note[];
  sequences: Sequence[];
}

export default function useChordDerived(chord: ChordConfig): ChordDerived {
  return useMemo(() => {
    if (!chord.searchStr) {
      return { current: null, litNotes: [], sequences: [] };
    }

    const { current, notes } = termSearch(chord.searchStr);
    const strings = getStrings(chord.fretCount, chord.tuning);
    const sequences = current ? generate(notes, strings, chord.position) : [];

    return {
      current: current ?? null,
      litNotes: notes,
      sequences,
    };
  }, [chord.searchStr, chord.fretCount, chord.tuning, chord.position]);
}
