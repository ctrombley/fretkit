import FretString from './FretString';
import Label from './Label';
import FretMarker from './FretMarker';
import Note from '../lib/Note';
import { calcFretWidth } from './Fretboard';
import { STRING_HEIGHT, SINGLE_MARKER_FRETS, DOUBLE_MARKER_FRETS } from '../lib/fretboardConstants';
import type { FretSlot } from '../lib/hybridFretLayout';

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
  fretCount: number;
  fretNumber: number;
  fretboardMargin: number;
  idx: number;
  startingFret: number;
  tuning: string[];
  // Angine (hybrid 24-EDO) overrides — when provided, take precedence
  slot?: FretSlot;
}

export default function Fret({
  fretCount,
  fretNumber,
  fretboardMargin,
  idx,
  startingFret,
  tuning,
  slot,
}: FretProps) {
  const stringCount = tuning.length;
  const width = slot ? slot.width : getFretWidth(fretNumber);
  const xOffset = slot ? slot.xOffset : calcXOffset(fretNumber, startingFret, fretboardMargin);
  const pitchSemitones = slot ? slot.semitones : fretNumber;
  const markerFretNum = slot ? slot.nativeFretNumber : fretNumber;
  const isQuartertone = slot ? !slot.isNative12 : false;
  const fretHeight = STRING_HEIGHT * (stringCount - 1);
  const isFirst = idx === 1;
  const isLast = idx === fretCount;
  // Only show inlay markers on native 12-EDO frets
  const markerType = isQuartertone ? null : getFretMarkerType(markerFretNum);

  const reversedTuning = tuning.slice().reverse();

  return (
    <g className="fret">
      {isFirst && (
        <Label
          xOffset={xOffset + 20}
          yOffset={fretboardMargin - 20}
        >
          {markerFretNum}
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
        className={`fret__wire${isFirst ? ' fret__wire--nut' : ''}${isQuartertone ? ' fret__wire--quartertone' : ''}`}
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
            fretIdx={idx}
            fretWidth={width}
            idx={i}
            note={openNote.add(pitchSemitones)}
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
