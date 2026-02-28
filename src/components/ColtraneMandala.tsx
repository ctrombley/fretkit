import { useState } from 'react';
import { noteName, usesSharps } from '../lib/harmony';
import {
  getAxisGroups,
  getIntervalClass,
  NOTE_COLORS,
  AXIS_COLORS,
  INTERVAL_CLASS_INFO,
  type SymmetricDivision,
} from '../lib/coltrane';

interface ColtraneMandalaProps {
  root: number;
  divisions: SymmetricDivision;
  highlightedAxis: number | null;
  onHighlightAxis: (axis: number | null) => void;
}

const SIZE = 500;
const CX = 250;
const CY = 250;
const RING_R = 190;
const NODE_R = 20;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function getNotePosition(pc: number): { x: number; y: number } {
  const angleDeg = -90 + (pc / 12) * 360;
  return polarToCartesian(CX, CY, RING_R, angleDeg);
}

/** Generate all 66 unique pairs */
function getAllPairs(): [number, number][] {
  const pairs: [number, number][] = [];
  for (let a = 0; a < 12; a++) {
    for (let b = a + 1; b < 12; b++) {
      pairs.push([a, b]);
    }
  }
  return pairs;
}

/** Build an axis group membership map: pc -> group index */
function buildAxisMap(groups: number[][]): Map<number, number> {
  const map = new Map<number, number>();
  groups.forEach((group, gi) => {
    group.forEach(pc => map.set(pc, gi));
  });
  return map;
}

export default function ColtraneMandala({
  root,
  divisions,
  highlightedAxis,
  onHighlightAxis,
}: ColtraneMandalaProps) {
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<[number, number] | null>(null);
  const [visibleICs, setVisibleICs] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));

  const groups = getAxisGroups(root, divisions);
  const axisMap = buildAxisMap(groups);
  const allPairs = getAllPairs();
  const preferSharps = usesSharps(root);

  function toggleIC(ic: number) {
    setVisibleICs(prev => {
      const next = new Set(prev);
      if (next.has(ic)) {
        next.delete(ic);
      } else {
        next.add(ic);
      }
      return next;
    });
  }

  function handleNoteClick(pc: number) {
    const groupIdx = axisMap.get(pc) ?? null;
    if (groupIdx === highlightedAxis) {
      onHighlightAxis(null);
    } else {
      onHighlightAxis(groupIdx);
    }
  }

  function getPolygonPath(group: number[]): string {
    const points = group.map(pc => getNotePosition(pc));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  return (
    <div>
      {/* Interval class filter checkboxes */}
      <div className="flex flex-wrap gap-3 mb-3 justify-center">
        {INTERVAL_CLASS_INFO.slice(1).map(info => {
          const active = visibleICs.has(info.semitones);
          return (
            <label
              key={info.semitones}
              className="flex items-center gap-1.5 text-xs cursor-pointer"
              style={{ color: active ? info.color : '#9ca3af' }}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleIC(info.semitones)}
                className="accent-current"
              />
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: info.color, opacity: active ? 1 : 0.3 }}
              />
              {info.name}
            </label>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-lg mx-auto">
        {/* Connection lines (66 total) */}
        {allPairs.map(([a, b]) => {
          const ic = getIntervalClass(a, b);
          if (ic === 0 || !visibleICs.has(ic)) return null;

          const posA = getNotePosition(a);
          const posB = getNotePosition(b);
          const info = INTERVAL_CLASS_INFO[ic]!;

          const isHoveredLine = hoveredLine && hoveredLine[0] === a && hoveredLine[1] === b;
          const isConnectedToHoveredNote = hoveredNote !== null && (a === hoveredNote || b === hoveredNote);
          const dimmed = hoveredNote !== null && !isConnectedToHoveredNote;

          return (
            <line
              key={`${a}-${b}`}
              x1={posA.x}
              y1={posA.y}
              x2={posB.x}
              y2={posB.y}
              stroke={info.color}
              strokeWidth={isHoveredLine || isConnectedToHoveredNote ? 2.5 : 1}
              strokeOpacity={dimmed ? 0.05 : isHoveredLine || isConnectedToHoveredNote ? 0.8 : 0.2}
              onMouseEnter={() => setHoveredLine([a, b])}
              onMouseLeave={() => setHoveredLine(null)}
              className="cursor-pointer"
            />
          );
        })}

        {/* Axis group polygons */}
        {groups.map((group, gi) => {
          if (group.length < 2) return null;
          const dimmed = highlightedAxis !== null && highlightedAxis !== gi;
          return (
            <path
              key={`poly-${gi}`}
              d={getPolygonPath(group)}
              fill={AXIS_COLORS[gi % AXIS_COLORS.length]}
              fillOpacity={dimmed ? 0.03 : 0.12}
              stroke={AXIS_COLORS[gi % AXIS_COLORS.length]}
              strokeWidth={dimmed ? 1 : 2.5}
              strokeOpacity={dimmed ? 0.15 : 0.6}
              pointerEvents="none"
            />
          );
        })}

        {/* Note nodes */}
        {INTERVAL_CLASS_INFO.length > 0 && Array.from({ length: 12 }, (_, pc) => {
          const pos = getNotePosition(pc);
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
                fontSize={11}
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

        {/* Hover info for connection line */}
        {hoveredLine && (() => {
          const [a, b] = hoveredLine;
          const ic = getIntervalClass(a, b);
          const info = INTERVAL_CLASS_INFO[ic]!;
          return (
            <foreignObject x={310} y={10} width={180} height={70}>
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs leading-relaxed">
                <div className="font-bold text-sm mb-1">
                  {noteName(a, preferSharps)} — {noteName(b, preferSharps)}
                </div>
                <div className="text-gray-600">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: info.color }}
                  />
                  IC {ic}: {info.name}
                </div>
              </div>
            </foreignObject>
          );
        })()}

        {/* Hover info for note */}
        {hoveredNote !== null && !hoveredLine && (
          <foreignObject x={310} y={10} width={180} height={80}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs leading-relaxed">
              <div className="font-bold text-sm mb-1">
                {noteName(hoveredNote, preferSharps)}
                <span
                  className="ml-1.5 inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: NOTE_COLORS[hoveredNote] }}
                />
              </div>
              <div className="text-gray-600">
                Axis group {(axisMap.get(hoveredNote) ?? 0) + 1}:{' '}
                {groups[axisMap.get(hoveredNote) ?? 0]?.map(pc => noteName(pc, preferSharps)).join(', ')}
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
