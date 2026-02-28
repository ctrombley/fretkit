import { useRef, useCallback } from 'react';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';

const STRING_SPACING = 20;
const FRET_SPACING = 22;
const MARGIN_TOP = 30;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 10;
const MARGIN_BOTTOM = 10;
const NUT_WIDTH = 4;
const MARKER_RADIUS = 7;
const FRET_LABEL_SIZE = 10;

import { SINGLE_MARKER_FRETS, DOUBLE_MARKER_FRETS } from '../lib/fretboardConstants';

interface ChordDiagramProps {
  tuning: string[];
  current: { name: string; type: string; root?: Note } | null;
  litNotes: Note[];
  sequences: Sequence[];
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  startingFret: number;
  visibleFrets?: number;
  onStartingFretChange?: (fret: number) => void;
}

export default function ChordDiagram({
  tuning,
  current,
  litNotes,
  sequences,
  sequenceEnabled,
  sequenceIdx,
  startingFret,
  visibleFrets = 5,
  onStartingFretChange,
}: ChordDiagramProps) {
  const stringCount = tuning.length;
  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;
  const isOpenPosition = startingFret === 1;

  const dragState = useRef<{ startY: number; startFret: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Determine visible fret range
  let displayStart = startingFret;
  if (sequenceEnabled && sequence && sequence.length > 0) {
    const minFret = sequence.minFret;
    displayStart = minFret <= 0 ? 1 : Math.max(1, minFret);
  }
  const showNut = displayStart === 1;

  const width = MARGIN_LEFT + STRING_SPACING * (stringCount - 1) + MARGIN_RIGHT;
  const height = MARGIN_TOP + FRET_SPACING * visibleFrets + MARGIN_BOTTOM;

  const stringX = (stringIdx: number) => MARGIN_LEFT + stringIdx * STRING_SPACING;
  const fretY = (fretIdx: number) => MARGIN_TOP + fretIdx * FRET_SPACING;

  // Drag-to-slide handlers (vertical for chord diagrams)
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!onStartingFretChange) return;
    dragState.current = { startY: e.clientY, startFret: startingFret };
    svgRef.current?.setPointerCapture(e.pointerId);
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  }, [onStartingFretChange, startingFret]);

  const handlePointerMove = useCallback((_e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current || !onStartingFretChange) return;
    const dy = e.clientY - dragState.current.startY;
    const fretDelta = Math.round(-dy / FRET_SPACING);
    const maxStart = Math.max(1, 25 - visibleFrets);
    const newFret = Math.min(maxStart, Math.max(1, dragState.current.startFret + fretDelta));

    if (newFret !== startingFret) {
      onStartingFretChange(newFret);
    }

    dragState.current = null;
    if (svgRef.current) svgRef.current.style.cursor = 'grab';
    svgRef.current?.releasePointerCapture(e.pointerId);
  }, [onStartingFretChange, startingFret, visibleFrets]);

  function isNoteLit(stringIdx: number, fretNumber: number): boolean {
    const openNote = new Note(tuning[stringIdx]!);
    const note = openNote.add(fretNumber);

    if (sequenceEnabled && sequence) {
      const seqStringIdx = stringCount - 1 - stringIdx;
      return sequence.stringNotes.some(
        sn => sn.semitones === note.semitones && sn.string === seqStringIdx,
      );
    }
    return litNotes.some(n => n.baseSemitones === note.baseSemitones);
  }

  function isNoteRoot(stringIdx: number, fretNumber: number): boolean {
    if (!current?.root) return false;
    const openNote = new Note(tuning[stringIdx]!);
    const note = openNote.add(fretNumber);
    return current.root.semitones === note.baseSemitones;
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={`block${onStartingFretChange ? ' cursor-grab select-none' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Nut or position indicator */}
      {showNut ? (
        <line
          x1={MARGIN_LEFT - 1}
          x2={stringX(stringCount - 1) + 1}
          y1={MARGIN_TOP}
          y2={MARGIN_TOP}
          stroke="#000"
          strokeWidth={NUT_WIDTH}
        />
      ) : (
        <text
          x={MARGIN_LEFT - 14}
          y={fretY(0) + FRET_SPACING / 2 + 4}
          fontSize={FRET_LABEL_SIZE}
          textAnchor="middle"
          fill="#666"
        >
          {displayStart}fr
        </text>
      )}

      {/* Fret lines (horizontal) */}
      {Array.from({ length: visibleFrets + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={MARGIN_LEFT}
          x2={stringX(stringCount - 1)}
          y1={fretY(i)}
          y2={fretY(i)}
          stroke={i === 0 && showNut ? 'none' : '#999'}
          strokeWidth={1}
        />
      ))}

      {/* String lines (vertical) */}
      {Array.from({ length: stringCount }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={MARGIN_TOP}
          y2={fretY(visibleFrets)}
          stroke="#000"
          strokeWidth={1}
        />
      ))}

      {/* Fret markers (dots) */}
      {Array.from({ length: visibleFrets }, (_, i) => {
        const fretNum = displayStart + i;
        const isSingle = SINGLE_MARKER_FRETS.includes(fretNum);
        const isDouble = DOUBLE_MARKER_FRETS.includes(fretNum);
        if (!isSingle && !isDouble) return null;

        const cy = fretY(i) + FRET_SPACING / 2;
        const cx = MARGIN_LEFT + STRING_SPACING * (stringCount - 1) / 2;

        if (isDouble) {
          return (
            <g key={`marker-${fretNum}`}>
              <circle cx={cx - STRING_SPACING * 0.8} cy={cy} r={3} fill="#ddd" />
              <circle cx={cx + STRING_SPACING * 0.8} cy={cy} r={3} fill="#ddd" />
            </g>
          );
        }
        return <circle key={`marker-${fretNum}`} cx={cx} cy={cy} r={3} fill="#ddd" />;
      })}

      {/* Note markers */}
      {Array.from({ length: stringCount }, (_, stringIdx) => {
        const openLit = isOpenPosition && isNoteLit(stringIdx, 0);
        const openRoot = isOpenPosition && isNoteRoot(stringIdx, 0);

        return (
          <g key={`notes-${stringIdx}`}>
            {openLit && (
              <circle
                cx={stringX(stringIdx)}
                cy={MARGIN_TOP - 12}
                r={MARKER_RADIUS - 2}
                fill="none"
                stroke={openRoot ? '#99C432' : '#F73667'}
                strokeWidth={2}
              />
            )}

            {Array.from({ length: visibleFrets }, (_, fretIdx) => {
              const fretNumber = displayStart + fretIdx;
              if (!isNoteLit(stringIdx, fretNumber)) return null;
              const isRoot = isNoteRoot(stringIdx, fretNumber);

              return (
                <circle
                  key={`note-${stringIdx}-${fretIdx}`}
                  cx={stringX(stringIdx)}
                  cy={fretY(fretIdx) + FRET_SPACING / 2}
                  r={MARKER_RADIUS}
                  fill={isRoot ? '#99C432' : '#F73667'}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
