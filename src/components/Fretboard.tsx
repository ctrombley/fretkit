import { useCallback } from 'react';
import Fret from './Fret';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import { STRING_HEIGHT, FRETBOARD_MARGIN, BASE_FRET_WIDTH } from '../lib/fretboardConstants';
import { FretboardProvider, useFretboardContext } from './FretboardContext';
import StringWaveLayer from './StringWaveLayer';
import { buildAngineSlots, angineWidth } from '../lib/hybridFretLayout';

export function calcFretWidth(idx: number): number {
  if (idx <= 1) return BASE_FRET_WIDTH;
  return Math.round(calcFretWidth(idx - 1) * 0.944);
}

function calcTotalWidth(fretCount: number): number {
  if (!fretCount) return BASE_FRET_WIDTH;
  if (fretCount === 1) return BASE_FRET_WIDTH;
  return calcTotalWidth(fretCount - 1) + calcFretWidth(fretCount);
}

interface FretboardProps {
  fretboardId: string;
  current: { name: string; type: string; root?: Note } | null;
  fretCount: number;
  litNotes: Note[];
  sequences: Sequence[];
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  startingFret: number;
  tuning: string[];
  onStrum?: () => void;
  droneActive?: boolean;
  droneFrets?: (number | null)[] | undefined;
  onDroneFretSelect?: (stringNumber: number, semitones: number) => void;
  showStringLabels?: boolean;
  edoMode?: '12' | 'angine';
  quartertoneThresholdCents?: number;
}

export default function Fretboard({
  fretboardId,
  current,
  fretCount,
  litNotes,
  sequences,
  sequenceEnabled,
  sequenceIdx,
  startingFret,
  tuning,
  onStrum,
  droneActive = false,
  droneFrets,
  onDroneFretSelect,
  showStringLabels = false,
  edoMode = '12',
  quartertoneThresholdCents = 1500,
}: FretboardProps) {
  const stringCount = tuning.length;
  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;

  // Tuning reversed to match visual top-to-bottom string order (treble first)
  const reversedTuning = tuning.slice().reverse();

  // Angine mode: build hybrid slot layout
  const angineSlots = edoMode === 'angine'
    ? buildAngineSlots(startingFret, fretCount, quartertoneThresholdCents, BASE_FRET_WIDTH, FRETBOARD_MARGIN)
    : null;

  const width = angineSlots
    ? angineWidth(angineSlots, FRETBOARD_MARGIN)
    : calcTotalWidth(fretCount) + FRETBOARD_MARGIN * 2;
  const height = STRING_HEIGHT * stringCount + FRETBOARD_MARGIN * 2;

  return (
    <FretboardProvider value={{ fretboardId, current, litNotes, sequence, sequenceEnabled, onStrum, droneActive, droneFrets: droneFrets ?? [], onDroneFretSelect }}>
      <FretboardSVGContainer
        width={width}
        height={height}
        stringCount={stringCount}
        reversedTuning={reversedTuning}
        fretCount={fretCount}
        angineSlots={angineSlots}
        startingFret={startingFret}
        tuning={tuning}
        showStringLabels={showStringLabels}
      />
    </FretboardProvider>
  );
}

function FretboardSVGContainer({
  width,
  height,
  stringCount,
  reversedTuning,
  fretCount,
  angineSlots,
  startingFret,
  tuning,
  showStringLabels,
}: {
  width: number;
  height: number;
  stringCount: number;
  reversedTuning: string[];
  fretCount: number;
  angineSlots: import('../lib/hybridFretLayout').FretSlot[] | null;
  startingFret: number;
  tuning: string[];
  showStringLabels: boolean;
}) {
  const { slideRef } = useFretboardContext();

  const handlePointerUp = useCallback(() => {
    if (slideRef.current) {
      slideRef.current.voice.stop();
      slideRef.current = null;
    }
  }, [slideRef]);

  return (
    <svg
      className="fretboard"
      width={width}
      height={height}
      role="img"
      aria-label={`Fretboard with ${stringCount} strings and ${fretCount} frets`}
      onPointerUp={handlePointerUp}
    >
        {/* Open string labels — horizontal mode: left of nut */}
        {showStringLabels && reversedTuning.map((noteName, i) => (
          <text
            key={`label-${i}`}
            x={FRETBOARD_MARGIN - 6}
            y={FRETBOARD_MARGIN + STRING_HEIGHT * i + 4}
            textAnchor="end"
            className="fretboard__string-label"
          >
            {noteName}
          </text>
        ))}
        {/* Nut */}
        <Fret
          idx={0}
          fretNumber={0}
          fretCount={angineSlots ? angineSlots.length : fretCount}
          fretboardMargin={FRETBOARD_MARGIN}
          tuning={tuning}
          startingFret={startingFret}
        />
        {/* Frets — angine or standard */}
        {angineSlots
          ? angineSlots.map((slot, i) => (
              <Fret
                key={i}
                idx={i + 1}
                fretNumber={slot.nativeFretNumber}
                fretCount={angineSlots.length}
                fretboardMargin={FRETBOARD_MARGIN}
                tuning={tuning}
                startingFret={startingFret}
                slot={slot}
              />
            ))
          : Array.from({ length: fretCount }, (_, i) => (
              <Fret
                key={i + 1}
                idx={i + 1}
                fretNumber={startingFret + i}
                fretCount={fretCount}
                fretboardMargin={FRETBOARD_MARGIN}
                tuning={tuning}
                startingFret={startingFret}
              />
            ))
        }
        {/* Full-string wave animation overlay */}
        <StringWaveLayer
          tuning={tuning}
          startingFret={startingFret}
          boardWidth={width}
        />
      </svg>
    );
  }
