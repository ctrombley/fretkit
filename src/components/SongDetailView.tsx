import { useState, Fragment } from 'react';
import { Plus, Shuffle, X, PlusCircle } from 'lucide-react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import useVoiceLeadingOptimizer from '../hooks/useVoiceLeadingOptimizer';
import useChordDerived from '../hooks/useChordDerived';
import SongHeader from './SongHeader';
import SongChordCard from './SongChordCard';
import VoiceLeadingDot from './VoiceLeadingDot';
import ChordDiagram from './ChordDiagram';

interface SongDetailViewProps {
  songId: string;
}

export default function SongDetailView({ songId }: SongDetailViewProps) {
  const bottomPadding = useBottomPadding();
  const song = useStore(s => s.songs[songId]);
  const addChordToSong = useStore(s => s.addChordToSong);
  const removeSavedChord = useStore(s => s.removeSavedChord);
  const addSavedChordToProgression = useStore(s => s.addSavedChordToProgression);
  const navigate = useStore(s => s.navigate);
  const optimizeVoiceLeading = useVoiceLeadingOptimizer(songId);

  const [smoothEnabled, setSmoothEnabled] = useState(false);

  if (!song) {
    // Song was deleted or doesn't exist
    navigate({ name: 'songList' });
    return null;
  }

  const handleSmooth = () => {
    optimizeVoiceLeading();
    setSmoothEnabled(true);
  };

  const hasChords = song.chords.length >= 2;

  return (
    <main className="pt-14 px-4 max-w-7xl mx-auto" style={{ paddingBottom: bottomPadding }}>
      <SongHeader songId={songId} title={song.title} />

      {(song.savedChords ?? []).length > 0 && (
        <SavedChordsSection
          songId={songId}
          savedChords={song.savedChords ?? []}
          onRemove={removeSavedChord}
          onAddToProgression={addSavedChordToProgression}
        />
      )}

      {hasChords && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleSmooth}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              smoothEnabled
                ? 'bg-fret-green/20 text-fret-green border border-fret-green/40'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title="Optimize voicing selection for smooth voice leading"
          >
            <Shuffle size={14} />
            Smooth
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-start">
        {song.chords.map((chord, index) => (
          <Fragment key={chord.id}>
            {index > 0 && (
              <VoiceLeadingDot
                chordA={song.chords[index - 1]!}
                chordB={chord}
              />
            )}
            <SongChordCard
              songId={songId}
              chord={chord}
              index={index}
              prevChord={index > 0 ? song.chords[index - 1] : undefined}
            />
          </Fragment>
        ))}

        <button
          onClick={() => addChordToSong(songId)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-400 hover:border-fret-blue hover:text-fret-blue transition-colors flex flex-col items-center justify-center min-h-[180px]"
          aria-label="Add chord"
        >
          <Plus size={24} />
          <span className="text-xs mt-1">Add Chord</span>
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2 max-w-lg mx-auto">
        Click + to add chords; pencil icon to edit search term, tuning, or fret window.
        Arrow buttons browse voicings (V) and inversions (I) — toggle with the V/I button.
        Drag chord cards to reorder the progression.
        Colored dots between chords show voice leading distance (green = smooth, red = large jump).
        "Smooth" button optimizes voicing choices across the whole progression.
      </p>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Saved chords palette
// ---------------------------------------------------------------------------

import type { ChordConfig } from '../types';

interface SavedChordsSectionProps {
  songId: string;
  savedChords: ChordConfig[];
  onRemove: (songId: string, chordId: string) => void;
  onAddToProgression: (songId: string, chordId: string) => void;
}

function SavedChordsSection({ songId, savedChords, onRemove, onAddToProgression }: SavedChordsSectionProps) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Saved Chords</p>
      <div className="flex flex-wrap gap-3">
        {savedChords.map(chord => (
          <SavedChordPill
            key={chord.id}
            songId={songId}
            chord={chord}
            onRemove={onRemove}
            onAddToProgression={onAddToProgression}
          />
        ))}
      </div>
    </div>
  );
}

interface SavedChordPillProps {
  songId: string;
  chord: ChordConfig;
  onRemove: (songId: string, chordId: string) => void;
  onAddToProgression: (songId: string, chordId: string) => void;
}

function SavedChordPill({ songId, chord, onRemove, onAddToProgression }: SavedChordPillProps) {
  const { current, litNotes, sequences } = useChordDerived(chord);
  const effectiveSequenceEnabled = current?.type === 'Chord' && sequences.length > 0;
  const effectiveSequenceIdx = effectiveSequenceEnabled ? (chord.sequenceIdx ?? 0) : chord.sequenceIdx;
  const displayName = current ? current.name : chord.searchStr || 'Empty';

  return (
    <div className="flex flex-col items-center group">
      <div className="relative border border-gray-200 rounded-lg p-1.5 bg-white hover:border-fret-blue transition-colors">
        <ChordDiagram
          tuning={chord.tuning}
          current={current}
          litNotes={litNotes}
          sequences={sequences}
          sequenceEnabled={effectiveSequenceEnabled}
          sequenceIdx={effectiveSequenceIdx}
          startingFret={chord.startingFret}
          visibleFrets={5}
        />
        {/* Action buttons, visible on hover */}
        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToProgression(songId, chord.id)}
            className="w-5 h-5 rounded-full bg-fret-green text-white flex items-center justify-center shadow-sm hover:bg-fret-green/80 transition-colors"
            title="Add to progression"
            aria-label="Add to progression"
          >
            <PlusCircle size={12} />
          </button>
          <button
            onClick={() => onRemove(songId, chord.id)}
            className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shadow-sm hover:bg-red-100 hover:text-red-500 transition-colors"
            title="Remove from saved"
            aria-label="Remove from saved"
          >
            <X size={10} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 max-w-[80px] truncate text-center">{displayName}</p>
    </div>
  );
}
