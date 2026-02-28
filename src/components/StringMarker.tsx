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
  isPlaying = false,
  bloomKey,
}: StringMarkerProps) {
  let cx = xOffset + fretWidth / 2;
  if (isNut) cx -= 15;

  const playingStyle: React.CSSProperties | undefined =
    isPlaying && note
      ? {
          r: pitchToRadius(note.semitones),
          fill: getPitchClassColor(note.baseSemitones),
        }
      : undefined;

  // Bloom base radius: use note's pitch radius (octave-aware) + small RMS boost
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
          style={{ fill: getPitchClassColor(note.baseSemitones) }}
        />
      )}
      <circle
        cx={cx}
        cy={yOffset}
        className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''} ${isPlaying ? 'string__marker-playing' : ''}`}
        style={playingStyle}
      />
    </g>
  );
}
