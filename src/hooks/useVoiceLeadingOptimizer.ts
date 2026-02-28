import { useCallback } from 'react';
import { useStore } from '../store';
import termSearch from '../lib/termSearch';
import Chord from '../lib/Chord';
import { generateVoicings } from '../lib/voicingGenerator';
import { findSmoothestTransition } from '../lib/voiceLeading';
import type Sequence from '../lib/Sequence';

/**
 * Hook returning a callback that optimizes voicing selection
 * across a song's chord progression for smooth voice leading.
 *
 * Greedy L→R: for each chord, pick the voicing closest to the previous chord's voicing.
 */
export default function useVoiceLeadingOptimizer(songId: string) {
  const updateSongChord = useStore(s => s.updateSongChord);
  const song = useStore(s => s.songs[songId]);

  return useCallback(() => {
    if (!song || song.chords.length === 0) return;

    // Generate voicings for each chord
    const allVoicings: (Sequence[] | null)[] = song.chords.map(chord => {
      if (!chord.searchStr) return null;

      const { current, notes } = termSearch(chord.searchStr);
      if (current?.type !== 'Chord') return null;

      let effectiveNotes = notes;
      if (chord.inversion > 0) {
        const chordObj = new Chord(chord.searchStr);
        effectiveNotes = chordObj.invert(chord.inversion);
      }

      const pitchClasses = effectiveNotes.map(n => n.baseSemitones);
      const bassTarget = effectiveNotes[0]!.baseSemitones;
      const sequences = generateVoicings(pitchClasses, bassTarget, chord.tuning, 15);
      return sequences.length > 0 ? sequences : null;
    });

    // Greedy L→R optimization
    let prevSeq: Sequence | null = null;

    for (let i = 0; i < song.chords.length; i++) {
      const chord = song.chords[i]!;
      const voicings = allVoicings[i];
      if (!voicings) continue;

      let bestIdx = 0;
      if (prevSeq) {
        const stringCount = chord.tuning.length;
        const smoothest = findSmoothestTransition(prevSeq, voicings, stringCount);
        if (smoothest) {
          bestIdx = voicings.indexOf(smoothest);
          if (bestIdx < 0) bestIdx = 0;
        }
      }

      updateSongChord(songId, chord.id, {
        sequenceIdx: bestIdx,
        sequenceEnabled: true,
      });

      prevSeq = voicings[bestIdx]!;
    }
  }, [song, songId, updateSongChord]);
}
