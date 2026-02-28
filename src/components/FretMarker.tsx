interface FretMarkerProps {
  fretHeight: number;
  fretWidth: number;
  type: 'single' | 'double';
  xOffset: number;
  yOffset: number;
}

export default function FretMarker({
  fretHeight,
  fretWidth,
  type,
  xOffset,
  yOffset,
}: FretMarkerProps) {
  const cx = xOffset + fretWidth / 2;

  if (type === 'single') {
    return (
      <g className="fret__marker fret__marker-single">
        <circle cx={cx} cy={yOffset + fretHeight / 2} />
      </g>
    );
  }

  return (
    <g className="fret__marker fret__marker-double">
      <circle cx={cx} cy={yOffset + fretHeight / 5} />
      <circle cx={cx} cy={yOffset + 4 * (fretHeight / 5)} />
    </g>
  );
}
