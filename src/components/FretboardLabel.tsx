import type Sequence from '../lib/Sequence';
import type Note from '../lib/Note';
import {
  tabShorthand,
  shapeType,
  inversionLabel,
  scoreSequence,
  difficultyTier,
  DIFFICULTY_COLORS,
} from '../lib/voicingUtils';

interface FretboardLabelProps {
  current: { name: string; type: string; root?: Note } | null;
  sequenceEnabled: boolean;
  sequences: Sequence[];
  sequenceIdx: number | null;
  tuning: string[];
  inversion: number;
}

export default function FretboardLabel({
  current,
  sequenceEnabled,
  sequences,
  sequenceIdx,
  tuning,
  inversion,
}: FretboardLabelProps) {
  if (!current) return <div className="h-8" />;

  const sequence = sequenceIdx !== null ? sequences[sequenceIdx] : undefined;
  const isChordVoicing = sequenceEnabled && sequence && current.type === 'Chord';

  return (
    <div className="text-center text-xl h-8 flex items-center justify-center gap-2 flex-wrap">
      <span>
        {current.name} ({current.type})
      </span>
      {sequenceEnabled && sequenceIdx !== null && sequences[sequenceIdx] && (
        <span className="text-gray-500">
          ({sequenceIdx + 1} / {sequences.length})
        </span>
      )}
      {isChordVoicing && (
        <VoicingInfo
          sequence={sequence}
          tuning={tuning}
          inversion={inversion}
          rootPitchClass={current.root?.baseSemitones ?? 0}
          stringCount={tuning.length}
        />
      )}
    </div>
  );
}

function VoicingInfo({
  sequence,
  tuning,
  inversion,
  rootPitchClass,
  stringCount,
}: {
  sequence: Sequence;
  tuning: string[];
  inversion: number;
  rootPitchClass: number;
  stringCount: number;
}) {
  const tab = tabShorthand(sequence, stringCount);
  const shape = shapeType(sequence, tuning);
  const breakdown = scoreSequence(sequence, stringCount, rootPitchClass, tuning);
  const tier = difficultyTier(breakdown.totalCost);
  const color = DIFFICULTY_COLORS[tier];

  const tooltipLines = [
    `Fret span: ${breakdown.fretSpan.toFixed(2)}`,
    `Fingers: ${breakdown.fingerCount.toFixed(2)}`,
    `Stretch: ${breakdown.stretchEvenness.toFixed(2)}`,
    `Contiguity: ${breakdown.stringContiguity.toFixed(2)}`,
    `Open bonus: ${breakdown.openStringBonus.toFixed(2)}`,
    `Bass: ${breakdown.bassCorrectness.toFixed(2)}`,
    `Position: ${breakdown.positionWeight.toFixed(2)}`,
  ];

  return (
    <span className="text-base text-gray-500 font-mono inline-flex items-center gap-1.5">
      <span>{tab}</span>
      <span className="text-gray-400">·</span>
      <span>{shape}</span>
      {inversion > 0 && (
        <>
          <span className="text-gray-400">·</span>
          <span>{inversionLabel(inversion)}</span>
        </>
      )}
      <span className="text-gray-400">·</span>
      <span className="inline-flex items-center gap-0.5" title={tooltipLines.join('\n')}>
        {breakdown.totalCost.toFixed(1)}
        <svg width="10" height="10" className="inline-block">
          <circle cx="5" cy="5" r="4" fill={color} />
        </svg>
      </span>
    </span>
  );
}
