/**
 * SVG markers showing X (muted) and O (open) for each string
 * when a voicing is active. Rendered left of the nut.
 */

import type Sequence from '../lib/Sequence';
import { STRING_HEIGHT, FRETBOARD_MARGIN } from '../lib/fretboardConstants';
import { stringStatuses } from '../lib/voicingUtils';

interface StringIndicatorsProps {
  sequence: Sequence | undefined;
  stringCount: number;
  sequenceEnabled: boolean;
}

export default function StringIndicators({
  sequence,
  stringCount,
  sequenceEnabled,
}: StringIndicatorsProps) {
  if (!sequenceEnabled || !sequence) return null;

  const statuses = stringStatuses(sequence, stringCount);
  const x = FRETBOARD_MARGIN - 20;

  return (
    <g className="string-indicators">
      {statuses.map((status, stringIdx) => {
        // Reverse: visual index 0 = highest string = stringCount-1
        const visualIdx = stringCount - 1 - stringIdx;
        const y = FRETBOARD_MARGIN + STRING_HEIGHT * visualIdx;

        if (status === 'muted') {
          // X marker
          const size = 5;
          return (
            <g key={stringIdx}>
              <line
                x1={x - size} y1={y - size}
                x2={x + size} y2={y + size}
                stroke="#999" strokeWidth={1.5}
              />
              <line
                x1={x + size} y1={y - size}
                x2={x - size} y2={y + size}
                stroke="#999" strokeWidth={1.5}
              />
            </g>
          );
        }

        if (status === 'open') {
          // O marker
          return (
            <circle
              key={stringIdx}
              cx={x} cy={y} r={5}
              fill="none" stroke="#999" strokeWidth={1.5}
            />
          );
        }

        return null; // fretted — no indicator needed
      })}
    </g>
  );
}
