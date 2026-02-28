interface StringMarkerProps {
  className?: string;
  fretWidth: number;
  isNut?: boolean;
  xOffset: number;
  yOffset: number;
}

export default function StringMarker({
  className = '',
  fretWidth,
  isNut = false,
  xOffset,
  yOffset,
}: StringMarkerProps) {
  let cx = xOffset + fretWidth / 2;
  if (isNut) cx -= 15;

  return (
    <circle
      cx={cx}
      cy={yOffset}
      className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''}`}
    />
  );
}
