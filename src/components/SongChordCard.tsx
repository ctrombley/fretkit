import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, GripVertical, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import type { ChordConfig } from '../types';
import useChordDerived from '../hooks/useChordDerived';
import ChordDiagram from './ChordDiagram';
import ChordEditor from './ChordEditor';
import Chord from '../lib/Chord';
import termSearch from '../lib/termSearch';
import { generateVoicings } from '../lib/voicingGenerator';
import { computeVoiceLeading } from '../lib/voiceLeading';
import type Sequence from '../lib/Sequence';

interface SongChordCardProps {
  songId: string;
  chord: ChordConfig;
  index: number;
  prevChord?: ChordConfig;
}

export default function SongChordCard({ songId, chord, index, prevChord }: SongChordCardProps) {
  const removeSongChord = useStore(s => s.removeSongChord);
  const reorderSongChords = useStore(s => s.reorderSongChords);
  const updateSongChord = useStore(s => s.updateSongChord);
  const activeSongChordId = useStore(s => s.activeSongChordId);
  const setActiveSongChordId = useStore(s => s.setActiveSongChordId);
  const strumVoicing = useStore(s => s.strumVoicing);
  const { current, litNotes, sequences, maxInversions } = useChordDerived(chord);

  const [arrowMode, setArrowMode] = useState<'voicing' | 'inversion'>('voicing');
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(chord.searchStr);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalSearchStr = useRef(chord.searchStr);

  const isEditing = activeSongChordId === chord.id;

  useEffect(() => {
    if (editingName) {
      setDraft(chord.searchStr);
      originalSearchStr.current = chord.searchStr;
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editingName]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitName = () => setEditingName(false);

  const cancelName = () => {
    setEditingName(false);
    update({ searchStr: originalSearchStr.current, sequenceIdx: 0, inversion: 0 });
    setDraft(originalSearchStr.current);
  };

  // Auto-enable voicing mode for chords with voicings
  const effectiveSequenceEnabled =
    current?.type === 'Chord' && sequences.length > 0;
  const effectiveSequenceIdx =
    effectiveSequenceEnabled ? (chord.sequenceIdx ?? 0) : chord.sequenceIdx;

  const update = (data: Partial<ChordConfig>) => updateSongChord(songId, chord.id, data);

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

  // ── Voice-leading-aware inversion sorting ──────────────────────────────────

  // Resolve the previous chord's active sequence for VL comparison
  const prevSeq = useMemo((): Sequence | null => {
    if (!prevChord?.searchStr) return null;
    const { current: pc, notes } = termSearch(prevChord.searchStr);
    if (!pc || pc.type !== 'Chord') return null;
    let effectiveNotes = notes;
    if (prevChord.inversion > 0) {
      try {
        effectiveNotes = new Chord(prevChord.searchStr).invert(prevChord.inversion);
      } catch { return null; }
    }
    const pitchClasses = effectiveNotes.map(n => n.baseSemitones);
    const bassTarget = effectiveNotes[0]!.baseSemitones;
    const seqs = generateVoicings(pitchClasses, bassTarget, prevChord.tuning, 15);
    return seqs[prevChord.sequenceIdx ?? 0] ?? null;
  }, [prevChord]);

  // For each possible inversion, find the best voicing index and its min VL distance;
  // then return inversions sorted ascending by that distance.
  const inversionSortData = useMemo(() => {
    if (!prevSeq || current?.type !== 'Chord' || maxInversions === 0 || !chord.searchStr) {
      return null;
    }
    try {
      const chordObj = new Chord(chord.searchStr);
      const stringCount = chord.tuning.length;

      const rows = Array.from({ length: maxInversions + 1 }, (_, inv) => {
        const invertedNotes = chordObj.invert(inv);
        const pitchClasses = invertedNotes.map(n => n.baseSemitones);
        const bassTarget = invertedNotes[0]!.baseSemitones;
        const seqs = generateVoicings(pitchClasses, bassTarget, chord.tuning, 15);

        let minDist = Infinity;
        let bestSeqIdx = 0;
        seqs.forEach((seq, idx) => {
          const { totalDistance } = computeVoiceLeading(prevSeq, seq, stringCount);
          if (totalDistance < minDist) {
            minDist = totalDistance;
            bestSeqIdx = idx;
          }
        });
        return { inv, minDist, bestSeqIdx };
      });

      rows.sort((a, b) => a.minDist - b.minDist);
      return {
        sortedOrder: rows.map(r => r.inv),
        bestVoicing: Object.fromEntries(rows.map(r => [r.inv, r.bestSeqIdx])) as Record<number, number>,
      };
    } catch {
      return null;
    }
  }, [prevSeq, chord.searchStr, chord.tuning, maxInversions, current?.type]);

  // ── Arrow navigation ───────────────────────────────────────────────────────

  const isVoicing = arrowMode === 'voicing';

  const invSortedPos = inversionSortData
    ? inversionSortData.sortedOrder.indexOf(chord.inversion)
    : chord.inversion;
  const invSortedLen = inversionSortData
    ? inversionSortData.sortedOrder.length
    : maxInversions + 1;

  const prevDisabled = isVoicing
    ? !effectiveSequenceEnabled || !sequences.length || effectiveSequenceIdx === 0
    : invSortedPos <= 0;

  const nextDisabled = isVoicing
    ? !effectiveSequenceEnabled || !sequences.length || effectiveSequenceIdx === sequences.length - 1
    : invSortedPos >= invSortedLen - 1;

  const handlePrev = () => {
    if (isVoicing) {
      update({ sequenceIdx: (effectiveSequenceIdx ?? 1) - 1 });
    } else if (inversionSortData) {
      const targetInv = inversionSortData.sortedOrder[Math.max(0, invSortedPos - 1)]!;
      update({ inversion: targetInv, sequenceIdx: inversionSortData.bestVoicing[targetInv] ?? 0 });
    } else {
      update({ inversion: Math.max(0, chord.inversion - 1) });
    }
  };

  const handleNext = () => {
    if (isVoicing) {
      update({ sequenceIdx: (effectiveSequenceIdx ?? -1) + 1 });
    } else if (inversionSortData) {
      const targetInv = inversionSortData.sortedOrder[Math.min(invSortedLen - 1, invSortedPos + 1)]!;
      update({ inversion: targetInv, sequenceIdx: inversionSortData.bestVoicing[targetInv] ?? 0 });
    } else {
      update({ inversion: Math.min(maxInversions, chord.inversion + 1) });
    }
  };

  // ── Strum ──────────────────────────────────────────────────────────────────

  const handleStrum = useCallback(() => {
    const seq = sequences[effectiveSequenceIdx ?? 0];
    if (!seq) return;
    const sorted = [...seq.stringNotes].sort((a, b) => a.string - b.string);
    strumVoicing(sorted.map(sn => ({ semitones: sn.semitones, frequency: sn.frequency })));
  }, [sequences, effectiveSequenceIdx, strumVoicing]);

  const canStrum = !!sequences[effectiveSequenceIdx ?? 0];

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayName = current
    ? `${current.root ? '' : ''}${current.name}`
    : chord.searchStr || 'Empty';

  const hasArrows = sequences.length > 0 || maxInversions > 0;

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
              aria-label="Chord settings"
            >
              <Settings size={12} />
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

        {/* Diagram with flanking arrows */}
        <div className="flex items-center gap-1">
          {hasArrows && (
            <button
              onClick={handlePrev}
              disabled={prevDisabled}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={isVoicing ? 'Previous voicing' : 'Previous inversion'}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div
            className={canStrum ? 'cursor-pointer' : undefined}
            onClick={canStrum ? handleStrum : undefined}
            title={canStrum ? 'Click to strum' : undefined}
          >
            <ChordDiagram
              tuning={chord.tuning}
              current={current}
              litNotes={litNotes}
              sequences={sequences}
              sequenceEnabled={effectiveSequenceEnabled}
              sequenceIdx={effectiveSequenceIdx}
              startingFret={chord.startingFret}
              visibleFrets={chord.fretCount <= 7 ? chord.fretCount : 5}
              onStartingFretChange={fret => update({ startingFret: fret })}
            />
          </div>
          {hasArrows && (
            <button
              onClick={handleNext}
              disabled={nextDisabled}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={isVoicing ? 'Next voicing' : 'Next inversion'}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Name row: V/I toggle inline with chord name */}
        <div className="text-center mt-1">
          <div className="flex items-center justify-center gap-1">
            {hasArrows && (
              <button
                onClick={() => setArrowMode(m => m === 'voicing' ? 'inversion' : 'voicing')}
                className="text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 leading-none transition-colors flex-shrink-0"
                title={isVoicing ? 'Voicing mode — click for inversions' : 'Inversion mode — click for voicings'}
              >
                {isVoicing ? 'V' : 'I'}
              </button>
            )}
            {editingName ? (
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={e => {
                  setDraft(e.target.value);
                  update({ searchStr: e.target.value, sequenceIdx: 0, inversion: 0 });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') cancelName();
                }}
                onBlur={commitName}
                placeholder="e.g. C major"
                className="min-w-0 px-1 py-0.5 text-sm text-center border border-fret-blue rounded focus:outline-none focus:ring-1 focus:ring-fret-blue"
              />
            ) : (
              <p
                className="text-sm font-medium text-dark truncate max-w-[120px] cursor-pointer hover:text-fret-blue transition-colors"
                onClick={() => setEditingName(true)}
                title="Click to edit chord"
              >
                {displayName}
              </p>
            )}
          </div>
          {chord.label && (
            <p className="text-xs text-gray-400 mt-0.5">{chord.label}</p>
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
