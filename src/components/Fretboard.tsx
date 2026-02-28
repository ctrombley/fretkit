import Fret from './Fret';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';

const MARGIN = 50;
const STRING_HEIGHT = 20;
const BASE_FRET_WIDTH = 80;

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
  const width = calcTotalWidth(fretCount) + MARGIN * 2;
  const height = STRING_HEIGHT * stringCount + MARGIN * 2;
  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;

  return (
    <svg
      className="fretboard"
      width={width}
      height={height}
      role="img"
      aria-label={`Fretboard with ${stringCount} strings and ${fretCount} frets`}
    >
      {/* Nut */}
      <Fret
        idx={0}
        fretNumber={0}
        fretCount={fretCount}
        fretboardMargin={MARGIN}
        tuning={tuning}
        litNotes={litNotes}
        current={current}
        sequence={sequence}
        sequenceEnabled={sequenceEnabled}
        startingFret={startingFret}
      />
      {/* Frets */}
      {Array.from({ length: fretCount }, (_, i) => (
        <Fret
          key={i + 1}
          idx={i + 1}
          fretNumber={startingFret + i}
          fretCount={fretCount}
          fretboardMargin={MARGIN}
          tuning={tuning}
          litNotes={litNotes}
          current={current}
          sequence={sequence}
          sequenceEnabled={sequenceEnabled}
          startingFret={startingFret}
        />
      ))}
    </svg>
  );
}
