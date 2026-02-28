import { useState, useRef } from 'react';
import { FIFTHS_ORDER, noteName, usesSharps } from '../lib/harmony';
import { play } from '../lib/musicbox';
import {
  getAxisGroups,
  getCadences,
  NOTE_COLORS,
  AXIS_COLORS,
  type SymmetricDivision,
} from '../lib/coltrane';

interface ColtraneCircleProps {
  root: number;
  divisions: SymmetricDivision;
  ordering: 'fifths' | 'chromatic';
  showCadences: boolean;
  highlightedAxis: number | null;
  onHighlightAxis: (axis: number | null) => void;
}

const SIZE = 500;
const CX = 250;
const CY = 250;
const RING_R = 180;
const NODE_R = 22;

const CHROMATIC_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function getNotePosition(pc: number, order: readonly number[] | number[]): { x: number; y: number } {
  const idx = order.indexOf(pc);
  const angleDeg = -90 + (idx / 12) * 360;
  return polarToCartesian(CX, CY, RING_R, angleDeg);
}

/** Build an axis group membership map: pc -> group index */
function buildAxisMap(groups: number[][]): Map<number, number> {
  const map = new Map<number, number>();
  groups.forEach((group, gi) => {
    group.forEach(pc => map.set(pc, gi));
  });
  return map;
}

export default function ColtraneCircle({
  root,
  divisions,
  ordering,
  showCadences,
  highlightedAxis,
  onHighlightAxis,
}: ColtraneCircleProps) {
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const playRef = useRef<{ stop: () => void } | null>(null);

  const order = ordering === 'fifths' ? FIFTHS_ORDER : CHROMATIC_ORDER;
  const groups = getAxisGroups(root, divisions);
  const axisMap = buildAxisMap(groups);
  const cadences = getCadences(root, divisions);
  const preferSharps = usesSharps(root);

  function handleNoteClick(pc: number) {
    const groupIdx = axisMap.get(pc) ?? null;
    if (groupIdx === highlightedAxis) {
      onHighlightAxis(null);
    } else {
      onHighlightAxis(groupIdx);
    }

    // Play the note
    if (playRef.current) playRef.current.stop();
    const freq = 261.63 * Math.pow(2, pc / 12);
    playRef.current = play(freq);
    setTimeout(() => {
      playRef.current?.stop();
      playRef.current = null;
    }, 800);
  }

  function getPolygonPath(group: number[]): string {
    const points = group.map(pc => getNotePosition(pc, order));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  /** Curved arrow for V-I cadence: from -> dominant -> to */
  function getCadenceArrows(cadence: { from: number; dominant: number; to: number }): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    const fromPos = getNotePosition(cadence.from, order);
    const domPos = getNotePosition(cadence.dominant, order);
    const toPos = getNotePosition(cadence.to, order);

    // Arrow from axis tone to dominant
    const mid1x = (fromPos.x + domPos.x) / 2;
    const mid1y = (fromPos.y + domPos.y) / 2;
    const pull1x = CX + (mid1x - CX) * 0.7;
    const pull1y = CY + (mid1y - CY) * 0.7;
    elements.push(
      <path
        key={`cad-fd-${cadence.from}`}
        d={`M ${fromPos.x} ${fromPos.y} Q ${pull1x} ${pull1y} ${domPos.x} ${domPos.y}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeOpacity={0.6}
        markerEnd="url(#coltrane-arrow)"
      />,
    );

    // Arrow from dominant to target
    const mid2x = (domPos.x + toPos.x) / 2;
    const mid2y = (domPos.y + toPos.y) / 2;
    const pull2x = CX + (mid2x - CX) * 0.7;
    const pull2y = CY + (mid2y - CY) * 0.7;
    elements.push(
      <path
        key={`cad-dt-${cadence.from}`}
        d={`M ${domPos.x} ${domPos.y} Q ${pull2x} ${pull2y} ${toPos.x} ${toPos.y}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeOpacity={0.6}
        markerEnd="url(#coltrane-arrow)"
      />,
    );

    return elements;
  }

  const hoveredGroup = hoveredNote !== null ? axisMap.get(hoveredNote) ?? null : null;
  const infoNote = hoveredNote;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-lg mx-auto">
      <defs>
        <marker
          id="coltrane-arrow"
          markerWidth={8}
          markerHeight={6}
          refX={7}
          refY={3}
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" fillOpacity={0.6} />
        </marker>
      </defs>

      {/* Reference circle */}
      <circle
        cx={CX}
        cy={CY}
        r={RING_R}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {/* Axis group polygons */}
      {groups.map((group, gi) => {
        if (group.length < 2) return null;
        const dimmed = highlightedAxis !== null && highlightedAxis !== gi;
        return (
          <path
            key={`poly-${gi}`}
            d={getPolygonPath(group)}
            fill={AXIS_COLORS[gi % AXIS_COLORS.length]}
            fillOpacity={dimmed ? 0.03 : 0.1}
            stroke={AXIS_COLORS[gi % AXIS_COLORS.length]}
            strokeWidth={dimmed ? 1 : 2}
            strokeOpacity={dimmed ? 0.15 : 0.5}
          />
        );
      })}

      {/* V-I cadence arrows */}
      {showCadences && cadences.flatMap(c => getCadenceArrows(c))}

      {/* Note nodes */}
      {(order as readonly number[]).map(pc => {
        const pos = getNotePosition(pc, order);
        const groupIdx = axisMap.get(pc) ?? 0;
        const dimmed = highlightedAxis !== null && groupIdx !== highlightedAxis;
        const isHovered = hoveredNote === pc;

        return (
          <g
            key={pc}
            className="cursor-pointer"
            onClick={() => handleNoteClick(pc)}
            onMouseEnter={() => setHoveredNote(pc)}
            onMouseLeave={() => setHoveredNote(null)}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={NODE_R}
              fill={NOTE_COLORS[pc]}
              fillOpacity={dimmed ? 0.15 : 1}
              stroke={isHovered ? '#1f2937' : 'white'}
              strokeWidth={isHovered ? 2.5 : 2}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight="bold"
              fill="white"
              fillOpacity={dimmed ? 0.3 : 1}
              pointerEvents="none"
            >
              {noteName(pc, preferSharps)}
            </text>
          </g>
        );
      })}

      {/* Info panel on hover */}
      {infoNote !== null && (
        <foreignObject x={310} y={10} width={180} height={80}>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs leading-relaxed">
            <div className="font-bold text-sm mb-1">
              {noteName(infoNote, preferSharps)}
              <span
                className="ml-1.5 inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: NOTE_COLORS[infoNote] }}
              />
            </div>
            <div className="text-gray-600">
              Axis group {(hoveredGroup ?? 0) + 1}:{' '}
              {groups[hoveredGroup ?? 0]?.map(pc => noteName(pc, preferSharps)).join(', ')}
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
