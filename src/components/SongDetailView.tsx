import { Plus } from 'lucide-react';
import { useStore } from '../store';
import SongHeader from './SongHeader';
import SongChordCard from './SongChordCard';

interface SongDetailViewProps {
  songId: string;
}

export default function SongDetailView({ songId }: SongDetailViewProps) {
  const song = useStore(s => s.songs[songId]);
  const addChordToSong = useStore(s => s.addChordToSong);
  const navigate = useStore(s => s.navigate);

  if (!song) {
    // Song was deleted or doesn't exist
    navigate({ name: 'songList' });
    return null;
  }

  return (
    <main className="pt-14 px-4 max-w-7xl mx-auto">
      <SongHeader songId={songId} title={song.title} />

      <div className="flex flex-wrap gap-4 items-start">
        {song.chords.map((chord, index) => (
          <SongChordCard
            key={chord.id}
            songId={songId}
            chord={chord}
            index={index}
          />
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
