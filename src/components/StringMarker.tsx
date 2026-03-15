import type Note from '../lib/Note';
import { pitchToRadius, getPitchClassColor } from '../lib/noteColors';
import { getMasterBus } from '../lib/masterBus';

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
  bloomKey,
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

  const bloomR = isPlaying && note
    ? pitchToRadius(note.semitones) + getMasterBus().getRmsLevel() * 4
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
