import Fret from './Fret';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import { STRING_HEIGHT, FRETBOARD_MARGIN, BASE_FRET_WIDTH } from '../lib/fretboardConstants';
import { FretboardProvider } from './FretboardContext';
import StringWaveLayer from './StringWaveLayer';

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
}: FretboardProps) {
  const stringCount = tuning.length;
  const width = calcTotalWidth(fretCount) + FRETBOARD_MARGIN * 2;
  const height = STRING_HEIGHT * stringCount + FRETBOARD_MARGIN * 2;
  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;

  // Tuning reversed to match visual top-to-bottom string order (treble first)
  const reversedTuning = tuning.slice().reverse();

  return (
    <FretboardProvider value={{ fretboardId, current, litNotes, sequence, sequenceEnabled, onStrum, droneActive, droneFrets: droneFrets ?? [], onDroneFretSelect }}>
      <svg
        className="fretboard"
        width={width}
        height={height}
        role="img"
        aria-label={`Fretboard with ${stringCount} strings and ${fretCount} frets`}
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
          fretCount={fretCount}
          fretboardMargin={FRETBOARD_MARGIN}
          tuning={tuning}
          startingFret={startingFret}
        />
        {/* Frets */}
        {Array.from({ length: fretCount }, (_, i) => (
          <Fret
            key={i + 1}
            idx={i + 1}
            fretNumber={startingFret + i}
            fretCount={fretCount}
            fretboardMargin={FRETBOARD_MARGIN}
            tuning={tuning}
            startingFret={startingFret}
          />
        ))}
        {/* Full-string wave animation overlay */}
        <StringWaveLayer
          tuning={tuning}
          startingFret={startingFret}
          boardWidth={width}
        />
      </svg>
    </FretboardProvider>
  );
}
