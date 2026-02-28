import type Note from '../lib/Note';
import { pitchToRadius, getPitchClassColor } from '../lib/noteColors';

interface StringMarkerProps {
  className?: string;
  fretWidth: number;
  isNut?: boolean;
  xOffset: number;
  yOffset: number;
  note?: Note;
  isPlaying?: boolean;
}

export default function StringMarker({
  className = '',
  fretWidth,
  isNut = false,
  xOffset,
  yOffset,
  note,
  isPlaying = false,
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

  return (
    <circle
      cx={cx}
      cy={yOffset}
      className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''} ${isPlaying ? 'string__marker-playing' : ''}`}
      style={playingStyle}
    />
  );
}
