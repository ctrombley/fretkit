import { useStore } from '../store';
import { getDiatonicChords, noteName, usesSharps } from '../lib/harmony';
import { play } from '../lib/musicbox';
import Note from '../lib/Note';
import Chord from '../lib/Chord';

export default function DiatonicChordBar() {
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const highlightedChord = useStore(s => s.spiralHighlightedChord);
  const setHighlightedChord = useStore(s => s.setSpiralHighlightedChord);

  const chords = getDiatonicChords(spiralRoot, spiralMode);

  function playArpeggio(chordName: string) {
    try {
      const chord = new Chord(chordName);
      const octave = 4;
      const handles: { stop: () => void }[] = [];

      chord.notes.forEach((note, i) => {
        setTimeout(() => {
          const fullNote = new Note(note.baseSemitones + octave * 12);
          const handle = play(fullNote.frequency);
          handles.push(handle);
        }, i * 200);
      });

      // Stop all notes after the arpeggio
      setTimeout(() => {
        handles.forEach(h => h.stop());
      }, chord.notes.length * 200 + 600);
    } catch {
      // Chord parsing failed, skip playback
    }
  }

  function handleClick(degree: number, chordName: string) {
    setHighlightedChord(highlightedChord === degree ? null : degree);
    playArpeggio(chordName);
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {chords.map((chord) => {
        const isActive = highlightedChord === chord.degree;
        const preferSharps = usesSharps(spiralRoot);
        const displayName = noteName(chord.rootSemitones, preferSharps);

        return (
          <button
            key={chord.degree}
            onClick={() => handleClick(chord.degree, chord.chordName)}
            className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-colors min-w-[56px] ${
              isActive
                ? 'bg-magenta/10 border-magenta text-dark'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-semibold">{chord.roman}</span>
            <span className="text-xs text-gray-500">
              {displayName}
              {chord.quality === 'm' ? 'm' : chord.quality === '°' ? '°' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
