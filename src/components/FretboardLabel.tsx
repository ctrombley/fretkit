import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useStore } from '../store';
import { optimalStartingFret } from '../lib/fretboardUtils';
import type Sequence from '../lib/Sequence';
import type Note from '../lib/Note';
import {
  tabShorthand,
  shapeType,
  inversionLabel,
  scoreSequence,
  difficultyTier,
  DIFFICULTY_COLORS,
} from '../lib/voicingUtils';

interface FretboardLabelProps {
  id: string;
  searchStr: string;
  fretCount: number;
  current: { name: string; type: string; root?: Note } | null;
  sequenceEnabled: boolean;
  sequences: Sequence[];
  sequenceIdx: number | null;
  tuning: string[];
  inversion: number;
}

export default function FretboardLabel({
  id,
  searchStr,
  fretCount,
  current,
  sequenceEnabled,
  sequences,
  sequenceIdx,
  tuning,
  inversion,
}: FretboardLabelProps) {
  const search = useStore(s => s.search);
  const updateFretboard = useStore(s => s.updateFretboard);
  const openSettings = useStore(s => s.openSettings);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(searchStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(searchStr);
      // Focus after render
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, searchStr]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== searchStr) {
      search(id, draft.trim());
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(searchStr);
  };

  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;
  const isChordVoicing = sequenceEnabled && sequence && current?.type === 'Chord';
  const hasMultipleVoicings = sequenceEnabled && sequences.length > 1;

  const handlePrevVoicing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sequenceIdx === null || sequenceIdx <= 0) return;
    const newIdx = sequenceIdx - 1;
    const seq = sequences[newIdx];
    updateFretboard(id, {
      sequenceIdx: newIdx,
      ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretCount) } : {}),
    });
  };

  const handleNextVoicing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sequenceIdx === null || sequenceIdx >= sequences.length - 1) return;
    const newIdx = sequenceIdx + 1;
    const seq = sequences[newIdx];
    updateFretboard(id, {
      sequenceIdx: newIdx,
      ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretCount) } : {}),
    });
  };

  // Edit mode: inline input
  if (editing) {
    return (
      <div className="text-center h-8 flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={commit}
          placeholder="Chord or scale (e.g. C major)"
          className="w-64 px-2 py-1 text-center text-lg border border-fret-blue rounded-md focus:outline-none focus:ring-2 focus:ring-fret-blue"
        />
      </div>
    );
  }

  // Empty state: no search yet
  if (!current) {
    return (
      <div
        className="h-8 flex items-center justify-center cursor-pointer"
        onClick={() => setEditing(true)}
      >
        <span className="text-gray-400 text-sm italic">
          Click to search chord or scale...
        </span>
      </div>
    );
  }

  // Display mode with click-to-edit and optional voicing arrows
  return (
    <div className="text-center text-xl h-8 flex items-center justify-center gap-2 flex-wrap">
      {hasMultipleVoicings && (
        <button
          onClick={handlePrevVoicing}
          disabled={sequenceIdx === 0}
          className="p-0.5 rounded text-gray-400 hover:text-fret-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous voicing"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <span
        className="cursor-pointer hover:text-fret-blue transition-colors"
        onClick={() => setEditing(true)}
        title="Click to edit search"
      >
        {current.name} ({current.type})
      </span>
      {sequenceEnabled && sequenceIdx !== null && sequences[sequenceIdx] && (
        <span className="text-gray-500 text-base">
          {sequenceIdx + 1}/{sequences.length}
        </span>
      )}
      {hasMultipleVoicings && (
        <button
          onClick={handleNextVoicing}
          disabled={sequenceIdx === sequences.length - 1}
          className="p-0.5 rounded text-gray-400 hover:text-fret-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next voicing"
        >
          <ChevronRight size={18} />
        </button>
      )}
      {isChordVoicing && (
        <VoicingInfo
          sequence={sequence}
          tuning={tuning}
          inversion={inversion}
          rootPitchClass={current.root?.baseSemitones ?? 0}
          stringCount={tuning.length}
        />
      )}
      <button
        onClick={(e) => { e.stopPropagation(); openSettings(id); }}
        className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Fretboard settings"
      >
        <Settings size={14} />
      </button>
    </div>
  );
}

function VoicingInfo({
  sequence,
  tuning,
  inversion,
  rootPitchClass,
  stringCount,
}: {
  sequence: Sequence;
  tuning: string[];
  inversion: number;
  rootPitchClass: number;
  stringCount: number;
}) {
  const tab = tabShorthand(sequence, stringCount);
  const shape = shapeType(sequence, tuning);
  const breakdown = scoreSequence(sequence, stringCount, rootPitchClass, tuning);
  const tier = difficultyTier(breakdown.totalCost);
  const color = DIFFICULTY_COLORS[tier];

  const tooltipLines = [
    `Fret span: ${breakdown.fretSpan.toFixed(2)}`,
    `Fingers: ${breakdown.fingerCount.toFixed(2)}`,
    `Stretch: ${breakdown.stretchEvenness.toFixed(2)}`,
    `Contiguity: ${breakdown.stringContiguity.toFixed(2)}`,
    `Open bonus: ${breakdown.openStringBonus.toFixed(2)}`,
    `Bass: ${breakdown.bassCorrectness.toFixed(2)}`,
    `Position: ${breakdown.positionWeight.toFixed(2)}`,
  ];

  return (
    <span className="text-base text-gray-500 font-mono inline-flex items-center gap-1.5">
      <span>{tab}</span>
      <span className="text-gray-400">·</span>
      <span>{shape}</span>
      {inversion > 0 && (
        <>
          <span className="text-gray-400">·</span>
          <span>{inversionLabel(inversion)}</span>
        </>
      )}
      <span className="text-gray-400">·</span>
      <span className="inline-flex items-center gap-0.5" title={tooltipLines.join('\n')}>
        {breakdown.totalCost.toFixed(1)}
        <svg width="10" height="10" className="inline-block">
          <circle cx="5" cy="5" r="4" fill={color} />
        </svg>
      </span>
    </span>
  );
}
