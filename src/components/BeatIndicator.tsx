interface BeatIndicatorProps {
  beatsPerMeasure: number;
  currentBeat: number;
  playing: boolean;
}

export default function BeatIndicator({ beatsPerMeasure, currentBeat, playing }: BeatIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: beatsPerMeasure }, (_, i) => {
        const isActive = playing && i === currentBeat;
        const isAccent = i === 0;
        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-75 ${
              isActive
                ? isAccent
                  ? 'w-3 h-3 bg-magenta beat-pulse'
                  : 'w-3 h-3 bg-fret-green beat-pulse'
                : 'w-2.5 h-2.5 bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}
