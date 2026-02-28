import { useState } from 'react';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { useStore } from '../store';
import { downloadSongExport } from '../lib/songExport';

interface SongHeaderProps {
  songId: string;
  title: string;
}

export default function SongHeader({ songId, title }: SongHeaderProps) {
  const navigate = useStore(s => s.navigate);
  const renameSong = useStore(s => s.renameSong);
  const exportSongs = useStore(s => s.exportSongs);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      renameSong(songId, trimmed);
    } else {
      setEditTitle(title);
    }
    setEditing(false);
  };

  const handleExport = () => {
    const data = exportSongs([songId]);
    downloadSongExport(data, title);
  };

  return (
    <div className="flex items-center gap-3 mt-6 mb-4">
      <button
        onClick={() => navigate({ name: 'songList' })}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Back to songs"
      >
        <ArrowLeft size={20} />
      </button>

      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setEditTitle(title);
                setEditing(false);
              }
            }}
            onBlur={handleSaveTitle}
            className="text-xl font-semibold text-dark px-2 py-1 border border-fret-blue rounded focus:outline-none focus:ring-2 focus:ring-fret-blue"
          />
          <button
            onClick={handleSaveTitle}
            className="p-1 rounded hover:bg-gray-100 text-fret-blue"
          >
            <Check size={18} />
          </button>
        </div>
      ) : (
        <h2
          className="text-xl font-semibold text-dark cursor-pointer hover:text-fret-blue transition-colors flex-1"
          onClick={() => {
            setEditTitle(title);
            setEditing(true);
          }}
        >
          {title}
        </h2>
      )}

      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <Download size={14} />
        Export
      </button>
    </div>
  );
}
