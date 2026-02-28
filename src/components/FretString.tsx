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
  const { current, litNotes, sequence, sequenceEnabled } = useFretboardContext();
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

  const handlePointerDown = useCallback(() => {
    if (useLatch) {
      toggleNote(note.semitones, note.frequency);
    } else {
      activateNote(note.semitones, note.frequency);
    }
  }, [useLatch, note.semitones, note.frequency, toggleNote, activateNote]);

  const handlePointerUp = useCallback(() => {
    if (!useLatch) {
      deactivateNote(note.semitones);
    }
  }, [useLatch, note.semitones, deactivateNote]);

  const handlePointerLeave = useCallback(() => {
    if (!useLatch && isMarked) {
      deactivateNote(note.semitones);
    }
  }, [useLatch, isMarked, note.semitones, deactivateNote]);

  return (
    <g className={`string string-${idx}`}>
      <line
        className="string__line"
        x1={xOffset}
        x2={xOffset + fretWidth}
        y1={yOffset}
        y2={yOffset}
      />
      {isLit && (
        <StringMarker
          className={`string__marker-lit ${isRoot ? 'string__marker-root' : ''}`}
          fretWidth={fretWidth}
          isNut={fretIdx === 0}
          xOffset={xOffset}
          yOffset={yOffset}
        />
      )}
      {isMarked && (
        <StringMarker
          fretWidth={fretWidth}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
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
