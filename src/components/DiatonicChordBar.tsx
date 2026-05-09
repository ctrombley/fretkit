import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { getDiatonicChords, noteName, usesSharps } from '../lib/harmony';
import { play } from '../lib/musicbox';
import Note from '../lib/Note';
import Chord from '../lib/Chord';
import { Repeat } from 'lucide-react';

export default function DiatonicChordBar() {
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const highlightedChord = useStore(s => s.spiralHighlightedChord);
  const setHighlightedChord = useStore(s => s.setSpiralHighlightedChord);

  const [latched, setLatched] = useState<Set<number>>(new Set());
  const loopRefs = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const chordsRef = useRef<ReturnType<typeof getDiatonicChords>>([]);

  // Clear all loops on unmount
  useEffect(() => {
    return () => { loopRefs.current.forEach(id => clearInterval(id)); };
  }, []);

  const chords = getDiatonicChords(spiralRoot, spiralMode);
  chordsRef.current = chords;

  function arpDuration(chordName: string): number {
    try {
      return new Chord(chordName).notes.length * 200 + 800;
    } catch { return 1600; }
  }

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
      setTimeout(() => handles.forEach(h => h.stop()), chord.notes.length * 200 + 600);
    } catch { /* chord parsing failed */ }
  }

  function handleClick(degree: number, chordName: string) {
    setHighlightedChord(highlightedChord === degree ? null : degree);
    playArpeggio(chordName);
  }

  function toggleLatch(degree: number, chordName: string) {
    setLatched(prev => {
      const next = new Set(prev);
      if (next.has(degree)) {
        next.delete(degree);
        const id = loopRefs.current.get(degree);
        if (id !== undefined) clearInterval(id);
        loopRefs.current.delete(degree);
      } else {
        next.add(degree);
        playArpeggio(chordName);
        const id = setInterval(() => {
          const current = chordsRef.current.find(c => c.degree === degree);
          if (current) playArpeggio(current.chordName);
        }, arpDuration(chordName));
        loopRefs.current.set(degree, id);
      }
      return next;
    });
  }

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {chords.map((chord) => {
        const isActive = highlightedChord === chord.degree;
        const isLooping = latched.has(chord.degree);
        const preferSharps = usesSharps(spiralRoot);
        const displayName = noteName(chord.rootSemitones, preferSharps);

        return (
          <div key={chord.degree} className="flex flex-col items-center gap-0.5">
            <button
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
            <button
              onClick={() => toggleLatch(chord.degree, chord.chordName)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                isLooping
                  ? 'bg-fret-green text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={isLooping ? 'Stop loop' : 'Loop this chord'}
            >
              <Repeat size={9} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
