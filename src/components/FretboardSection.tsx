import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useStore } from '../store';
import Fretboard, { calcFretWidth } from './Fretboard';
import FretboardLabel from './FretboardLabel';
import ChordDiagram from './ChordDiagram';
import { X, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { optimalStartingFret } from '../lib/fretboardUtils';
import { showToast } from '../lib/toast';

interface FretboardSectionProps {
  id: string;
}

export default function FretboardSection({ id }: FretboardSectionProps) {
  const fretboard = useStore(s => s.fretboards[id]);
  const settings = useStore(s => s.settings);
  const deleteFretboard = useStore(s => s.deleteFretboard);
  const openSettings = useStore(s => s.openSettings);
  const updateFretboard = useStore(s => s.updateFretboard);
  const strumVoicing = useStore(s => s.strumVoicing);
  const songs = useStore(s => s.songs);
  const addConfiguredChordToSong = useStore(s => s.addConfiguredChordToSong);
  const navigate = useStore(s => s.navigate);

  const [showSongMenu, setShowSongMenu] = useState(false);
  const dragState = useRef<{ startX: number; startFret: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the song menu when clicking anywhere outside
  useEffect(() => {
    if (!showSongMenu) return;
    const close = () => setShowSongMenu(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showSongMenu]);

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

  // Compute strum handler for chord voicing mode (must be before early return for hooks rules)
  const sequence = fretboard && fretboard.sequenceIdx !== null
    ? fretboard.sequences[fretboard.sequenceIdx]
    : undefined;
  const onStrum = useMemo(() => {
    if (!fretboard?.sequenceEnabled || !sequence) return undefined;
    return () => {
      // Sort bass-to-treble: string 0 = bass (low E), ascending
      const sorted = [...sequence.stringNotes].sort((a, b) => a.string - b.string);
      strumVoicing(sorted.map(sn => ({ semitones: sn.semitones, frequency: sn.frequency })));
    };
  }, [fretboard?.sequenceEnabled, sequence, strumVoicing]);

  if (!fretboard) return null;

  const isSelected = settings.settingsId === id && settings.sidebarOpen;
  const showMiniDiagram =
    fretboard.sequenceEnabled &&
    fretboard.current?.type === 'Chord' &&
    fretboard.sequences.length > 0;

  const hasMultipleVoicings = fretboard.sequenceEnabled && fretboard.sequences.length > 1;

  const handlePrevVoicing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fretboard.sequenceIdx === null || fretboard.sequenceIdx <= 0) return;
    const newIdx = fretboard.sequenceIdx - 1;
    const seq = fretboard.sequences[newIdx];
    updateFretboard(id, {
      sequenceIdx: newIdx,
      ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretboard.fretCount) } : {}),
    });
  };

  const handleNextVoicing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fretboard.sequenceIdx === null || fretboard.sequenceIdx >= fretboard.sequences.length - 1) return;
    const newIdx = fretboard.sequenceIdx + 1;
    const seq = fretboard.sequences[newIdx];
    updateFretboard(id, {
      sequenceIdx: newIdx,
      ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretboard.fretCount) } : {}),
    });
  };

  const sendToSong = (songId: string) => {
    addConfiguredChordToSong(songId, {
      searchStr: fretboard.searchStr,
      tuning: fretboard.tuning,
      fretCount: fretboard.fretCount,
      startingFret: fretboard.startingFret,
      position: fretboard.position,
      sequenceEnabled: fretboard.sequenceEnabled,
      sequenceIdx: fretboard.sequenceIdx,
      inversion: fretboard.inversion,
    });
    const songTitle = songs[songId]?.title ?? 'song';
    showToast(`Saved to "${songTitle}"`);
    setShowSongMenu(false);
  };

  const handleSendToSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSongMenu(v => !v);
  };

  const canSendToSong = !!fretboard.current;

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
        <div
          className="absolute top-2 left-2 z-10 opacity-80 hover:opacity-100 transition-opacity"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5">
            {hasMultipleVoicings && (
              <button
                onClick={handlePrevVoicing}
                disabled={fretboard.sequenceIdx === 0}
                className="p-0.5 rounded text-gray-400 hover:text-fret-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous voicing"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {/* Clicking the mini diagram strums the chord */}
            <div
              className="cursor-pointer"
              onClick={onStrum}
              title="Click to strum"
            >
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
            {hasMultipleVoicings && (
              <button
                onClick={handleNextVoicing}
                disabled={fretboard.sequenceIdx === fretboard.sequences.length - 1}
                className="p-0.5 rounded text-gray-400 hover:text-fret-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next voicing"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          {/* Gear icon below the mini diagram for chord actions */}
          {canSendToSong && (
            <div className="relative flex justify-center mt-0.5">
              <button
                onClick={handleSendToSong}
                className="p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Chord actions"
                title="Chord actions"
              >
                <Settings size={12} />
              </button>
              {showSongMenu && (
                <div
                  className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]"
                  onPointerDown={e => e.stopPropagation()}
                >
                  <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Save to song
                  </p>
                  {Object.values(songs)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map(song => (
                      <button
                        key={song.id}
                        onClick={() => sendToSong(song.id)}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700 truncate"
                      >
                        {song.title}
                      </button>
                    ))}
                  <button
                    onClick={() => { navigate({ name: 'songList' }); setShowSongMenu(false); }}
                    className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-fret-green border-t border-gray-100"
                  >
                    + New song
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Gear for save-to-song when mini diagram is not shown (scale/empty chord mode) */}
      {!showMiniDiagram && canSendToSong && (
        <div
          className="absolute top-2 left-2 z-10"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={handleSendToSong}
              className="p-1.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Chord actions"
              title="Save to song"
            >
              <Settings size={14} />
            </button>
            {showSongMenu && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]"
                onPointerDown={e => e.stopPropagation()}
              >
                <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Save to song
                </p>
                {Object.values(songs)
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map(song => (
                    <button
                      key={song.id}
                      onClick={() => sendToSong(song.id)}
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700 truncate"
                    >
                      {song.title}
                    </button>
                  ))}
                <button
                  onClick={() => { navigate({ name: 'songList' }); setShowSongMenu(false); }}
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-fret-green border-t border-gray-100"
                >
                  + New song
                </button>
              </div>
            )}
          </div>
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
        onStrum={onStrum}
      />
    </div>
  );
}
