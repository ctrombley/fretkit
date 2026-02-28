import { useRef, useCallback } from 'react';
import { useStore } from '../store';
import Fretboard, { calcFretWidth } from './Fretboard';
import FretboardLabel from './FretboardLabel';
import ChordDiagram from './ChordDiagram';
import { X, Settings } from 'lucide-react';

interface FretboardSectionProps {
  id: string;
}

export default function FretboardSection({ id }: FretboardSectionProps) {
  const fretboard = useStore(s => s.fretboards[id]);
  const settings = useStore(s => s.settings);
  const deleteFretboard = useStore(s => s.deleteFretboard);
  const openSettings = useStore(s => s.openSettings);
  const updateFretboard = useStore(s => s.updateFretboard);

  const dragState = useRef<{ startX: number; startFret: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!fretboard) return;
    // Don't start drag on interactive elements (buttons, links, etc.)
    if ((e.target as HTMLElement).closest('button, a, input, select')) return;
    dragState.current = { startX: e.clientX, startFret: fretboard.startingFret };
    containerRef.current?.setPointerCapture(e.pointerId);
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  }, [fretboard]);

  const handlePointerMove = useCallback((_e: React.PointerEvent) => {
    if (!dragState.current || !fretboard) return;
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  }, [fretboard]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current || !fretboard) return;
    const dx = e.clientX - dragState.current.startX;

    // Convert pixel delta to fret count using average fret width
    const avgFretWidth = calcFretWidth(Math.max(1, fretboard.startingFret));
    const fretDelta = Math.round(-dx / avgFretWidth);

    const maxStart = Math.max(1, 25 - fretboard.fretCount);
    const newFret = Math.min(maxStart, Math.max(1, dragState.current.startFret + fretDelta));

    if (newFret !== fretboard.startingFret) {
      updateFretboard(id, { startingFret: newFret });
    }

    dragState.current = null;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
    containerRef.current?.releasePointerCapture(e.pointerId);
  }, [fretboard, id, updateFretboard]);

  if (!fretboard) return null;

  const isSelected = settings.settingsId === id && settings.sidebarOpen;
  const showMiniDiagram =
    fretboard.sequenceEnabled &&
    fretboard.current?.type === 'Chord' &&
    fretboard.sequences.length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg my-4 p-2 transition-all cursor-grab select-none ${
        isSelected ? 'ring-2 ring-fret-blue' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={() => deleteFretboard(id)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Delete fretboard"
        >
          <X size={16} />
        </button>
        <button
          onClick={() => openSettings(id)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fretboard settings"
        >
          <Settings size={16} />
        </button>
      </div>
      {showMiniDiagram && (
        <div className="absolute top-2 left-2 z-10 opacity-80 hover:opacity-100 transition-opacity pointer-events-none">
          <ChordDiagram
            tuning={fretboard.tuning}
            current={fretboard.current}
            litNotes={fretboard.litNotes}
            sequences={fretboard.sequences}
            sequenceEnabled={fretboard.sequenceEnabled}
            sequenceIdx={fretboard.sequenceIdx}
            startingFret={fretboard.startingFret}
            visibleFrets={5}
          />
        </div>
      )}
      <FretboardLabel
        id={id}
        searchStr={fretboard.searchStr}
        fretCount={fretboard.fretCount}
        current={fretboard.current}
        sequenceEnabled={fretboard.sequenceEnabled}
        sequences={fretboard.sequences}
        sequenceIdx={fretboard.sequenceIdx}
        tuning={fretboard.tuning}
        inversion={fretboard.inversion}
      />
      <Fretboard
        fretCount={fretboard.fretCount}
        litNotes={fretboard.litNotes}
        startingFret={fretboard.startingFret}
        tuning={fretboard.tuning}
        current={fretboard.current}
        sequences={fretboard.sequences}
        sequenceEnabled={fretboard.sequenceEnabled}
        sequenceIdx={fretboard.sequenceIdx}
      />
    </div>
  );
}
