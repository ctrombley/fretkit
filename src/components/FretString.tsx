import { useState, useCallback, useRef, useEffect } from 'react';
import Note from '../lib/Note';
import StringMarker from './StringMarker';
import { play } from '../lib/musicbox';
import { useStore } from '../store';
import { getArpeggiator } from '../lib/arpeggiator';
import type Sequence from '../lib/Sequence';

const STRING_HEIGHT = 20;

interface FretStringProps {
  current: { name: string; type: string; root?: Note } | null;
  fretIdx: number;
  fretWidth: number;
  idx: number;
  litNotes: Note[];
  note: Note;
  sequence?: Sequence;
  sequenceEnabled: boolean;
  stringCount: number;
  xOffset: number;
  yOffset: number;
}

export default function FretString({
  current,
  fretIdx,
  fretWidth,
  idx,
  litNotes,
  note,
  sequence,
  sequenceEnabled,
  stringCount,
  xOffset,
  yOffset,
}: FretStringProps) {
  const [isMarked, setIsMarked] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const playingRef = useRef<{ stop: () => void } | null>(null);
  const sandboxLatch = useStore(s => s.sandboxLatch);
  const arpEnabled = useStore(s => s.arpEnabled);
  const sandboxResetCounter = useStore(s => s.sandboxResetCounter);

  useEffect(() => {
    if (sandboxResetCounter === 0) return;
    playingRef.current?.stop();
    playingRef.current = null;
    setIsMarked(false);
  }, [sandboxResetCounter]);

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

  // Arp mode: click toggles note in arpeggiator
  const handleArpToggle = useCallback(() => {
    const arp = getArpeggiator();
    if (isMarked) {
      arp.removeNote(note.semitones);
      setIsMarked(false);
    } else {
      arp.addNote(note.frequency, note.semitones);
      setIsMarked(true);
    }
  }, [isMarked, note.frequency, note.semitones]);

  // Latch mode: click toggles note on/off
  const handleLatchToggle = useCallback(() => {
    if (isMarked) {
      playingRef.current?.stop();
      playingRef.current = null;
    } else {
      playingRef.current = play(note.frequency);
    }
    setIsMarked(m => !m);
  }, [isMarked, note.frequency]);

  // Momentary mode: pointer down starts, pointer up stops
  const handleMomentaryDown = useCallback(() => {
    playingRef.current = play(note.frequency);
    setIsMarked(true);
  }, [note.frequency]);

  const handleMomentaryUp = useCallback(() => {
    playingRef.current?.stop();
    playingRef.current = null;
    setIsMarked(false);
  }, []);

  // Determine which handler to use
  const useLatch = arpEnabled || sandboxLatch;

  const handlePointerDown = useCallback(() => {
    if (arpEnabled) {
      handleArpToggle();
    } else if (useLatch) {
      handleLatchToggle();
    } else {
      handleMomentaryDown();
    }
  }, [arpEnabled, useLatch, handleArpToggle, handleLatchToggle, handleMomentaryDown]);

  const handlePointerUp = useCallback(() => {
    if (!useLatch) {
      handleMomentaryUp();
    }
  }, [useLatch, handleMomentaryUp]);

  const handlePointerLeave = useCallback(() => {
    if (!useLatch && isMarked) {
      handleMomentaryUp();
    }
  }, [useLatch, isMarked, handleMomentaryUp]);

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
