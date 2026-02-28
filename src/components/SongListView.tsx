import { useState, useRef } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useStore } from '../store';
import { parseSongImport } from '../lib/songExport';
import SongCard from './SongCard';

export default function SongListView() {
  const songs = useStore(s => s.songs);
  const createSong = useStore(s => s.createSong);
  const importSongs = useStore(s => s.importSongs);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const songList = Object.values(songs).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseSongImport(text);
      importSongs(data);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid file');
    }

    // Reset input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="pt-14 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mt-6 mb-4">
        <h2 className="text-xl font-semibold text-dark">Songs</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Upload size={14} />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => createSong('Untitled Song')}
            className="px-3 py-1.5 text-sm bg-fret-blue text-white rounded-md hover:bg-fret-blue/90 transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            New Song
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          Import failed: {importError}
          <button
            onClick={() => setImportError(null)}
            className="ml-2 underline"
          >
            dismiss
          </button>
        </div>
      )}

      {songList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No songs yet</p>
          <p className="text-sm">Create a song to start notating chords</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {songList.map(song => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </main>
  );
}
