import { useState, useCallback } from 'react';
import Note from '../lib/Note';
import StringMarker from './StringMarker';
import { play } from '../lib/musicbox';
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
  const [playing, setPlaying] = useState<{ stop: () => void } | null>(null);

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

  const handleClick = useCallback(() => {
    if (isMarked) {
      playing?.stop();
      setPlaying(null);
    } else {
      setPlaying(play(note.frequency));
    }
    setIsMarked(m => !m);
  }, [isMarked, note.frequency, playing]);

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
        onClick={handleClick}
        onMouseEnter={() => setIsPreview(true)}
        onMouseLeave={() => setIsPreview(false)}
      />
    </g>
  );
}
