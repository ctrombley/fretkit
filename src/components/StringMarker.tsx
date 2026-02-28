import type Note from '../lib/Note';
import { pitchToRadius, getPitchClassColor } from '../lib/noteColors';
import { getSynth } from '../lib/synth';

interface StringMarkerProps {
  className?: string;
  fretWidth: number;
  isNut?: boolean;
  xOffset: number;
  yOffset: number;
  note?: Note;
  isRoot?: boolean;
  isPlaying?: boolean;
  bloomKey?: number;
}

export default function StringMarker({
  className = '',
  fretWidth,
  isNut = false,
  xOffset,
  yOffset,
  note,
  isRoot = false,
  isPlaying = false,
  bloomKey,
}: StringMarkerProps) {
  let cx = xOffset + fretWidth / 2;
  if (isNut) cx -= 15;

  const color = note ? getPitchClassColor(note.baseSemitones) : null;
  const r = note && isPlaying ? pitchToRadius(note.semitones) : undefined;

  // When we have a note, always use pitch class color regardless of isPlaying
  const noteStyle: React.CSSProperties | undefined = color
    ? isNut
      ? { fill: 'none', stroke: color, strokeWidth: 2 }
      : { fill: color, ...(r ? { r } : {}) }
    : undefined;

  const bloomR = isPlaying && note
    ? pitchToRadius(note.semitones) + getSynth().getRmsLevel() * 4
    : 6;

  return (
    <g>
      {isPlaying && note && (bloomKey === undefined || bloomKey > 0) && (
        <circle
          key={bloomKey ?? 'mount'}
          cx={cx}
          cy={yOffset}
          r={bloomR}
          className="string__marker-bloom"
          style={{ fill: color ?? undefined }}
        />
      )}
      <circle
        cx={cx}
        cy={yOffset}
        className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''} ${isPlaying ? 'string__marker-playing' : ''}`}
        style={noteStyle}
      />
      {/* White dot to indicate root note */}
      {isRoot && !isNut && color && (
        <circle
          cx={cx}
          cy={yOffset}
          r={3}
          fill="white"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
