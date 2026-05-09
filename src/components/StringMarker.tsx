import type Note from '../lib/Note';
import { pitchToRadius, getPitchClassColor } from '../lib/noteColors';

interface StringMarkerProps {
  className?: string;
  fretWidth: number;
  isNut?: boolean;
  xOffset: number;
  yOffset: number;
  note?: Note;
  isRoot?: boolean;
  isPlaying?: boolean;
  fingerLabel?: string;
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
  fingerLabel,
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

  return (
    <g>
      <circle
        cx={cx}
        cy={yOffset}
        className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''}`}
        style={noteStyle}
      />
      {/* White dot to indicate root note */}
      {isRoot && !isNut && color && !fingerLabel && (
        <circle
          cx={cx}
          cy={yOffset}
          r={3}
          fill="white"
          pointerEvents="none"
        />
      )}
      {/* Finger label (p/i/m/a) shown when arp finger picking is active */}
      {fingerLabel && (
        <text
          x={cx}
          y={yOffset + 3.5}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
          fill={color && !isNut ? 'white' : '#6b7280'}
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          {fingerLabel}
        </text>
      )}
    </g>
  );
}
