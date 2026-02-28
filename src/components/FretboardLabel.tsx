import type Sequence from '../lib/Sequence';
import type Note from '../lib/Note';

interface FretboardLabelProps {
  current: { name: string; type: string; root?: Note } | null;
  sequenceEnabled: boolean;
  sequences: Sequence[];
  sequenceIdx: number | null;
}

export default function FretboardLabel({
  current,
  sequenceEnabled,
  sequences,
  sequenceIdx,
}: FretboardLabelProps) {
  if (!current) return <div className="h-8" />;

  return (
    <div className="text-center text-xl h-8">
      {current.name} ({current.type})
      {sequenceEnabled && sequenceIdx !== null && sequences[sequenceIdx] && (
        <span className="text-gray-500 ml-2">
          ({sequenceIdx + 1} / {sequences.length})
        </span>
      )}
    </div>
  );
}
