/**
 * Colored dot rendered between adjacent SongChordCards
 * showing voice leading distance (green = smooth, red = jumpy).
 */

import type { ChordConfig } from '../types';
import useChordDerived from '../hooks/useChordDerived';
import { computeVoiceLeading } from '../lib/voiceLeading';

interface VoiceLeadingDotProps {
  chordA: ChordConfig;
  chordB: ChordConfig;
}

export default function VoiceLeadingDot({ chordA, chordB }: VoiceLeadingDotProps) {
  const derivedA = useChordDerived(chordA);
  const derivedB = useChordDerived(chordB);

  const stringCount = chordA.tuning.length;
  const seqA = derivedA.sequences[chordA.sequenceIdx ?? 0];
  const seqB = derivedB.sequences[chordB.sequenceIdx ?? 0];

  if (!seqA || !seqB) return null;

  const { totalDistance } = computeVoiceLeading(seqA, seqB, stringCount);

  let color: string;
  if (totalDistance <= 4) {
    color = '#22c55e'; // green — smooth
  } else if (totalDistance <= 8) {
    color = '#eab308'; // yellow — moderate
  } else {
    color = '#ef4444'; // red — large jump
  }

  return (
    <div className="flex items-center justify-center self-center" title={`Voice leading distance: ${totalDistance}`}>
      <svg width="12" height="12">
        <circle cx="6" cy="6" r="5" fill={color} />
      </svg>
    </div>
  );
}
