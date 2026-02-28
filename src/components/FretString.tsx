import { useState, useCallback } from 'react';
import Note from '../lib/Note';
import StringMarker from './StringMarker';
import { useStore } from '../store';
import { STRING_HEIGHT } from '../lib/fretboardConstants';
import { useFretboardContext } from './FretboardContext';

interface FretStringProps {
  fretIdx: number;
  fretWidth: number;
  idx: number;
  note: Note;
  stringCount: number;
  xOffset: number;
  yOffset: number;
}

export default function FretString({
  fretIdx,
  fretWidth,
  idx,
  note,
  stringCount,
  xOffset,
  yOffset,
}: FretStringProps) {
  const { current, litNotes, sequence, sequenceEnabled, onStrum } = useFretboardContext();
  const [isPreview, setIsPreview] = useState(false);
  const sandboxLatch = useStore(s => s.sandboxLatch);
  const arpEnabled = useStore(s => s.arpEnabled);
  const bloomAllOctaves = useStore(s => s.bloomAllOctaves);
  const isMarked = useStore(s =>
    bloomAllOctaves
      ? s.sandboxActiveNotes.some(semi => semi % 12 === note.baseSemitones)
      : s.sandboxActiveNotes.includes(note.semitones)
  );
  const arpStrike = useStore(s =>
    s.arpStrikeNote === note.semitones ? s.arpStrikeCount : 0
  );
  const toggleNote = useStore(s => s.toggleSandboxNote);
  const activateNote = useStore(s => s.activateSandboxNote);
  const deactivateNote = useStore(s => s.deactivateSandboxNote);

  const stringNumber = (stringCount - 1) - idx;
  // Variable thickness: idx 0 = treble (thin), idx n-1 = bass (thick)
  const stringThickness = 0.5 + (idx / Math.max(1, stringCount - 1)) * 2;

  const isLit = (() => {
    if (sequenceEnabled && sequence) {
      return sequence.stringNotes.some(
        sn => sn.semitones === note.semitones && sn.string === stringNumber
      );
    }
    const litSemitones = litNotes.map(n => n.baseSemitones);
    return litSemitones.includes(note.baseSemitones);
  })();

  const isRoot = current?.root
    ? current.root.semitones === note.baseSemitones
    : false;

  const useLatch = arpEnabled || sandboxLatch;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Stop propagation so FretboardSection doesn't call setPointerCapture,
    // which would swallow our pointerup and leave notes stuck on.
    e.stopPropagation();

    // In chord voicing mode, clicking a lit note strums the whole voicing
    if (sequenceEnabled && isLit && onStrum) {
      onStrum();
      return;
    }
    // In chord display mode, clicking a lit note plays momentarily — bypass latch
    if (current && isLit) {
      activateNote(note.semitones, note.frequency);
      return;
    }
    if (useLatch) {
      toggleNote(note.semitones, note.frequency);
    } else {
      activateNote(note.semitones, note.frequency);
    }
  }, [sequenceEnabled, isLit, onStrum, current, useLatch, note.semitones, note.frequency, toggleNote, activateNote]);

  const handlePointerUp = useCallback(() => {
    if (current && isLit) {
      deactivateNote(note.semitones);
      return;
    }
    if (!useLatch) {
      deactivateNote(note.semitones);
    }
  }, [current, isLit, useLatch, note.semitones, deactivateNote]);

  const handlePointerLeave = useCallback(() => {
    if (current && isLit) {
      deactivateNote(note.semitones);
      return;
    }
    if (!useLatch && isMarked) {
      deactivateNote(note.semitones);
    }
  }, [current, isLit, useLatch, isMarked, note.semitones, deactivateNote]);

  return (
    <g className={`string string-${idx}`}>
      <line
        className="string__line"
        x1={xOffset}
        x2={xOffset + fretWidth}
        y1={yOffset}
        y2={yOffset}
        strokeWidth={stringThickness}
      />
      {isLit && (
        <StringMarker
          className="string__marker-lit"
          fretWidth={fretWidth}
          isNut={fretIdx === 0}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
          isRoot={isRoot}
        />
      )}
      {isMarked && !isLit && !sequenceEnabled && (
        <StringMarker
          fretWidth={fretWidth}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
          isRoot={isRoot}
          isPlaying={isMarked}
          bloomKey={arpEnabled ? arpStrike : undefined}
        />
      )}
      {isPreview && (
        <StringMarker
          className="string__marker-preview"
          fretWidth={fretWidth}
          xOffset={xOffset}
          yOffset={yOffset}
        />
      )}
      <rect
        className="string__overlay"
        height={STRING_HEIGHT}
        width={fretWidth}
        x={xOffset}
        y={yOffset - STRING_HEIGHT / 2}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onMouseEnter={() => setIsPreview(true)}
        onMouseLeave={() => setIsPreview(false)}
      />
    </g>
  );
}
