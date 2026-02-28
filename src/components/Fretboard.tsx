import Fret from './Fret';
import StringIndicators from './StringIndicators';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import { STRING_HEIGHT, FRETBOARD_MARGIN, BASE_FRET_WIDTH } from '../lib/fretboardConstants';
import { FretboardProvider } from './FretboardContext';

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
  current: { name: string; type: string; root?: Note } | null;
  fretCount: number;
  litNotes: Note[];
  sequences: Sequence[];
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  startingFret: number;
  tuning: string[];
}

export default function Fretboard({
  current,
  fretCount,
  litNotes,
  sequences,
  sequenceEnabled,
  sequenceIdx,
  startingFret,
  tuning,
}: FretboardProps) {
  const stringCount = tuning.length;
  const width = calcTotalWidth(fretCount) + FRETBOARD_MARGIN * 2;
  const height = STRING_HEIGHT * stringCount + FRETBOARD_MARGIN * 2;
  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;

  return (
    <FretboardProvider value={{ current, litNotes, sequence, sequenceEnabled }}>
      <svg
        className="fretboard"
        width={width}
        height={height}
        role="img"
        aria-label={`Fretboard with ${stringCount} strings and ${fretCount} frets`}
      >
        {/* Muted/Open string indicators */}
        <StringIndicators
          sequence={sequence}
          stringCount={stringCount}
          sequenceEnabled={sequenceEnabled}
        />
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
      </svg>
    </FretboardProvider>
  );
}
