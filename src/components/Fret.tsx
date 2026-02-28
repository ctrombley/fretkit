import FretString from './FretString';
import Label from './Label';
import FretMarker from './FretMarker';
import Note from '../lib/Note';
import { calcFretWidth } from './Fretboard';
import type Sequence from '../lib/Sequence';

const STRING_HEIGHT = 20;

const SINGLE_MARKER_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_MARKER_FRETS = [12, 24];

function getFretWidth(fretNumber: number): number {
  if (fretNumber <= 0) return 0;
  if (fretNumber === 1) return 80;
  return calcFretWidth(fretNumber - 1);
}

function calcXOffset(fretNumber: number, startingFret: number, margin: number): number {
  if (fretNumber === 0 || fretNumber === startingFret) return margin;
  return calcFretWidth(fretNumber - 1) + calcXOffset(fretNumber - 1, startingFret, margin);
}

function getFretMarkerType(fretNumber: number): 'single' | 'double' | null {
  if (SINGLE_MARKER_FRETS.includes(fretNumber)) return 'single';
  if (DOUBLE_MARKER_FRETS.includes(fretNumber)) return 'double';
  return null;
}

interface FretProps {
  current: { name: string; type: string; root?: Note } | null;
  fretCount: number;
  fretNumber: number;
  fretboardMargin: number;
  idx: number;
  litNotes: Note[];
  sequence?: Sequence;
  sequenceEnabled: boolean;
  startingFret: number;
  tuning: string[];
}

export default function Fret({
  current,
  fretCount,
  fretNumber,
  fretboardMargin,
  idx,
  litNotes,
  sequence,
  sequenceEnabled,
  startingFret,
  tuning,
}: FretProps) {
  const stringCount = tuning.length;
  const width = getFretWidth(fretNumber);
  const xOffset = calcXOffset(fretNumber, startingFret, fretboardMargin);
  const fretHeight = STRING_HEIGHT * (stringCount - 1);
  const isFirst = idx === 1;
  const isLast = idx === fretCount;
  const markerType = getFretMarkerType(fretNumber);

  const reversedTuning = tuning.slice().reverse();

  return (
    <g className="fret">
      {isFirst && (
        <Label
          xOffset={xOffset + 20}
          yOffset={fretboardMargin - 20}
        >
          {fretNumber}
        </Label>
      )}
      {markerType && (
        <FretMarker
          xOffset={xOffset}
          yOffset={fretboardMargin}
          fretWidth={width}
          fretHeight={fretHeight}
          type={markerType}
        />
      )}
      <line
        className="fret__wire"
        x1={xOffset}
        x2={xOffset}
        y1={fretboardMargin}
        y2={fretboardMargin + fretHeight}
        strokeWidth={isFirst ? 5 : 1}
      />
      {reversedTuning.map((t, i) => {
        const openNote = new Note(t);
        const yOffset = fretboardMargin + STRING_HEIGHT * i;
        return (
          <FretString
            key={`${t}-${i}`}
            current={current}
            fretIdx={idx}
            fretWidth={width}
            idx={i}
            litNotes={litNotes}
            note={openNote.add(fretNumber)}
            sequence={sequence}
            sequenceEnabled={sequenceEnabled}
            stringCount={stringCount}
            xOffset={xOffset}
            yOffset={yOffset}
          />
        );
      })}
      {isLast && (
        <line
          className="fret__wire"
          x1={xOffset + width}
          x2={xOffset + width}
          y1={fretboardMargin}
          y2={fretboardMargin + fretHeight}
          strokeWidth={1}
        />
      )}
    </g>
  );
}
