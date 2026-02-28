import { Music, Trash2 } from 'lucide-react';
import type { Song } from '../types';
import { useStore } from '../store';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const navigate = useStore(s => s.navigate);
  const deleteSong = useStore(s => s.deleteSong);

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:border-fret-blue hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => navigate({ name: 'songDetail', songId: song.id })}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Music size={18} className="text-gray-400 shrink-0" />
          <h3 className="font-medium text-dark truncate">{song.title}</h3>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            deleteSong(song.id);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
          aria-label="Delete song"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {song.chords.length} {song.chords.length === 1 ? 'chord' : 'chords'}
      </p>
    </div>
  );
}
