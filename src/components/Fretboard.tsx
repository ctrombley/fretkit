import Fret from './Fret';
import Note from '../lib/Note';
import type Sequence from '../lib/Sequence';
import { STRING_HEIGHT, FRETBOARD_MARGIN, BASE_FRET_WIDTH } from '../lib/fretboardConstants';
import { FretboardProvider } from './FretboardContext';
import { buildAngineSlots, angineWidth } from '../lib/hybridFretLayout';
import { detectBarres } from '../lib/ergonomics';
import type { StringAssignment } from '../lib/ergonomics';

export function calcFretWidth(idx: number): number {
  if (!Number.isFinite(idx) || idx <= 1) return BASE_FRET_WIDTH;
  return Math.round(calcFretWidth(idx - 1) * 0.944);
}

function calcTotalWidth(fretCount: number): number {
  if (!Number.isFinite(fretCount) || fretCount <= 1) return BASE_FRET_WIDTH;
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
  const safeTuning = tuning ?? ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
  const safeLitNotes = Array.isArray(litNotes) ? litNotes : [];
  const stringCount = safeTuning.length;
  const sequence = sequences && sequenceIdx != null ? sequences[sequenceIdx] : undefined;

  // Compute barre positions for the visual indicator
  const barres = (() => {
    if (!sequenceEnabled || !sequence) return [];
    const byString = new Map<number, number>();
    for (const sn of sequence.stringNotes) byString.set(sn.string, sn.fret);
    const assignments: StringAssignment[] = Array.from({ length: stringCount }, (_, s) => ({
      string: s, fret: byString.get(s) ?? null,
    }));
    return detectBarres(assignments);
  })();

  // X center of a fret on the horizontal board (mirrors calcXOffset + fretWidth/2 from Fret.tsx)
  function fretXCenter(fretNumber: number): number {
    let x = FRETBOARD_MARGIN;
    for (let f = startingFret + 1; f <= fretNumber; f++) x += calcFretWidth(f - 1);
    const fw = fretNumber <= 0 ? 0 : fretNumber === 1 ? BASE_FRET_WIDTH : calcFretWidth(fretNumber - 1);
    return x + fw / 2;
  }

  // Tuning reversed to match visual top-to-bottom string order (treble first)
  const reversedTuning = safeTuning.slice().reverse();

  // Angine mode: build hybrid slot layout
  const angineSlots = edoMode === 'angine'
    ? buildAngineSlots(startingFret, fretCount, quartertoneThresholdCents, BASE_FRET_WIDTH, FRETBOARD_MARGIN)
    : null;

  const width = angineSlots
    ? angineWidth(angineSlots, FRETBOARD_MARGIN)
    : calcTotalWidth(fretCount) + FRETBOARD_MARGIN * 2;
  const height = STRING_HEIGHT * stringCount + FRETBOARD_MARGIN * 2;

  return (
    <FretboardProvider value={{ fretboardId, current, litNotes: safeLitNotes, sequence, sequenceEnabled, onStrum, droneActive, droneFrets: droneFrets ?? [], onDroneFretSelect }}>
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
          fretCount={angineSlots ? angineSlots.length : fretCount}
          fretboardMargin={FRETBOARD_MARGIN}
          tuning={safeTuning}
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
                tuning={safeTuning}
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
                tuning={safeTuning}
                startingFret={startingFret}
              />
            ))
        }
        {/* Barre indicators — vertical bars behind note dots */}
        {barres.map((barre, i) => {
          if (barre.fret < startingFret || barre.fret >= startingFret + fretCount) return null;
          const cx = fretXCenter(barre.fret);
          // Display idx 0 = treble (top), stringCount-1 = bass (bottom)
          const yTop    = FRETBOARD_MARGIN + STRING_HEIGHT * (stringCount - 1 - barre.toString);
          const yBottom = FRETBOARD_MARGIN + STRING_HEIGHT * (stringCount - 1 - barre.fromString);
          const r = 6;
          return (
            <rect
              key={`barre-${i}`}
              x={cx - r} y={yTop - r}
              width={r * 2} height={yBottom - yTop + r * 2}
              rx={r} ry={r}
              fill="#374151" opacity={0.25}
            />
          );
        })}
      </svg>
    </FretboardProvider>
  );
}
