import { useState } from 'react';
import { X } from 'lucide-react';
import type { ChordConfig } from '../types';
import { useStore } from '../store';
import useChordDerived from '../hooks/useChordDerived';
import ChordDiagram from './ChordDiagram';

const GRID_STEPS = 8;

interface SongGridProps {
  songId: string;
}

export default function SongGrid({ songId }: SongGridProps) {
  const song = useStore(s => s.songs[songId]);
  const setSongGridStep = useStore(s => s.setSongGridStep);

  if (!song) return null;

  const cells: (ChordConfig | null)[] = Array.from(
    { length: GRID_STEPS },
    (_, i) => song.songGrid?.[i] ?? null,
  );

  const handleDrop = (step: number, e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const payload = JSON.parse(raw) as { type: string; id: string };
      if (payload.type === 'saved-chord') {
        const source = (song.savedChords ?? []).find(c => c.id === payload.id);
        if (source) {
          setSongGridStep(songId, step, { ...source, id: crypto.randomUUID() });
        }
      }
    } catch {
      // ignore non-JSON drops
    }
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Song Grid</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_STEPS}, 1fr)` }}>
        {cells.map((chord, step) => (
          <GridStepCell
            key={step}
            step={step}
            chord={chord}
            onDrop={e => handleDrop(step, e)}
            onClear={() => setSongGridStep(songId, step, null)}
          />
        ))}
      </div>
    </div>
  );
}

interface GridStepCellProps {
  step: number;
  chord: ChordConfig | null;
  onDrop: (e: React.DragEvent) => void;
  onClear: () => void;
}

function GridStepCell({ step, chord, onDrop, onClear }: GridStepCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-center rounded-lg border-2 transition-colors ${
        isDragOver
          ? 'border-fret-blue bg-fret-blue/5'
          : chord
          ? 'border-gray-200 bg-white'
          : 'border-dashed border-gray-300'
      }`}
      style={{ minHeight: 100 }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e); }}
    >
      <span className="text-[10px] font-mono text-gray-400 pt-1 pb-0.5 select-none">{step + 1}</span>
      {chord ? (
        <ChordStepContent chord={chord} onClear={onClear} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-gray-300 select-none">drop</span>
        </div>
      )}
    </div>
  );
}

function ChordStepContent({ chord, onClear }: { chord: ChordConfig; onClear: () => void }) {
  const { current, litNotes, sequences } = useChordDerived(chord);
  const effectiveSequenceEnabled = current?.type === 'Chord' && sequences.length > 0;

  return (
    <div className="relative px-1 pb-1">
      <button
        onClick={onClear}
        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors z-10"
        aria-label="Clear step"
      >
        <X size={8} />
      </button>
      <ChordDiagram
        tuning={chord.tuning}
        current={current}
        litNotes={litNotes}
        sequences={sequences}
        sequenceEnabled={effectiveSequenceEnabled}
        sequenceIdx={effectiveSequenceEnabled ? (chord.sequenceIdx ?? 0) : chord.sequenceIdx}
        startingFret={chord.startingFret}
        visibleFrets={4}
      />
      <p className="text-[10px] text-center text-gray-500 mt-0.5 truncate w-full select-none">
        {current?.name ?? (chord.searchStr || '?')}
      </p>
    </div>
  );
}
