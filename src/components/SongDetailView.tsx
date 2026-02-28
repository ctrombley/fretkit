import { useState, Fragment } from 'react';
import { Plus, Shuffle } from 'lucide-react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import useVoiceLeadingOptimizer from '../hooks/useVoiceLeadingOptimizer';
import SongHeader from './SongHeader';
import SongChordCard from './SongChordCard';
import VoiceLeadingDot from './VoiceLeadingDot';

interface SongDetailViewProps {
  songId: string;
}

export default function SongDetailView({ songId }: SongDetailViewProps) {
  const bottomPadding = useBottomPadding();
  const song = useStore(s => s.songs[songId]);
  const addChordToSong = useStore(s => s.addChordToSong);
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
    </main>
  );
}
