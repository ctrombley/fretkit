import { X, GripVertical, Pencil } from 'lucide-react';
import { useStore } from '../store';
import type { ChordConfig } from '../types';
import useChordDerived from '../hooks/useChordDerived';
import ChordDiagram from './ChordDiagram';
import ChordEditor from './ChordEditor';

interface SongChordCardProps {
  songId: string;
  chord: ChordConfig;
  index: number;
}

export default function SongChordCard({ songId, chord, index }: SongChordCardProps) {
  const removeSongChord = useStore(s => s.removeSongChord);
  const reorderSongChords = useStore(s => s.reorderSongChords);
  const activeSongChordId = useStore(s => s.activeSongChordId);
  const setActiveSongChordId = useStore(s => s.setActiveSongChordId);
  const { current, litNotes, sequences } = useChordDerived(chord);

  const isEditing = activeSongChordId === chord.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) {
      reorderSongChords(songId, from, index);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const displayName = current
    ? `${current.root ? '' : ''}${current.name}`
    : chord.searchStr || 'Empty';

  return (
    <div
      className="flex flex-col items-center"
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className={`border rounded-lg p-2 transition-all ${isEditing ? 'border-fret-blue shadow-sm' : 'border-gray-200'}`}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-1 min-w-[120px]">
          <GripVertical size={14} className="text-gray-300 cursor-grab" />
          <div className="flex gap-0.5">
            <button
              onClick={() => setActiveSongChordId(isEditing ? null : chord.id)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Edit chord"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => removeSongChord(songId, chord.id)}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove chord"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Diagram */}
        <ChordDiagram
          tuning={chord.tuning}
          current={current}
          litNotes={litNotes}
          sequences={sequences}
          sequenceEnabled={chord.sequenceEnabled}
          sequenceIdx={chord.sequenceIdx}
          startingFret={chord.startingFret}
        />

        {/* Label */}
        <div className="text-center mt-1">
          <p className="text-sm font-medium text-dark truncate max-w-[130px]">
            {displayName}
          </p>
          {chord.label && (
            <p className="text-xs text-gray-400">{chord.label}</p>
          )}
        </div>
      </div>

      {/* Inline editor */}
      {isEditing && (
        <div className="mt-2 w-64">
          <ChordEditor songId={songId} chord={chord} />
        </div>
      )}
    </div>
  );
}
