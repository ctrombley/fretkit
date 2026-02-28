import { useMemo } from 'react';
import type { ChordConfig } from '../types';
import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import Chord from '../lib/Chord';
import termSearch from '../lib/termSearch';
import generate from '../lib/sequenceGenerator';
import getStrings from '../lib/getStrings';

interface ChordDerived {
  current: { name: string; type: string; root?: Note } | null;
  litNotes: Note[];
  sequences: Sequence[];
  maxInversions: number;
}

export default function useChordDerived(chord: ChordConfig): ChordDerived {
  return useMemo(() => {
    if (!chord.searchStr) {
      return { current: null, litNotes: [], sequences: [], maxInversions: 0 };
    }

    const { current, notes } = termSearch(chord.searchStr);

    let effectiveNotes = notes;
    let maxInversions = 0;

    if (current?.type === 'Chord' && chord.inversion > 0) {
      const chordObj = new Chord(chord.searchStr);
      maxInversions = chordObj.maxInversions;
      effectiveNotes = chordObj.invert(chord.inversion);
    } else if (current?.type === 'Chord') {
      const chordObj = new Chord(chord.searchStr);
      maxInversions = chordObj.maxInversions;
    }

    const strings = getStrings(chord.fretCount, chord.tuning);
    const sequences = current ? generate(effectiveNotes, strings, chord.position) : [];

    return {
      current: current ?? null,
      litNotes: effectiveNotes,
      sequences,
      maxInversions,
    };
  }, [chord.searchStr, chord.fretCount, chord.tuning, chord.position, chord.inversion]);
}
