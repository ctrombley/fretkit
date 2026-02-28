import { useState, useRef } from 'react';
import {
  getHarmonics,
  getSpiralPoint,
  getSpiralBackbonePath,
  getETReferencePoints,
  getOctaveMarkers,
  getNodeRadius,
  HARMONIC_COLORS,
  type HarmonicInfo,
} from '../lib/overtones';
import { play } from '../lib/musicbox';

interface OvertoneSpiralProps {
  fundamentalHz: number;
  pitchClass: number;
  count: number;
  showET: boolean;
  useET: boolean;
}

const SIZE = 500;
const CX = 250;
const CY = 250;
const BASE_R = 40;
const GROWTH = 38;
const BASE_NODE_R = 18;

export default function OvertoneSpiral({ fundamentalHz, pitchClass, count, showET, useET }: OvertoneSpiralProps) {
  const [hoveredN, setHoveredN] = useState<number | null>(null);
  const playRef = useRef<{ stop: () => void } | null>(null);

  const harmonics = getHarmonics(fundamentalHz, pitchClass, count);
  const backbonePath = getSpiralBackbonePath(CX, CY, BASE_R, GROWTH, count);
  const octaveMarkers = getOctaveMarkers(CX, CY, BASE_R, GROWTH, count);
  const etPoints = showET ? getETReferencePoints(CX, CY, BASE_R, GROWTH, count, pitchClass) : [];

  const hoveredInfo = hoveredN !== null ? harmonics.find(h => h.n === hoveredN) ?? null : null;

  function getNodePosition(h: HarmonicInfo) {
    if (useET) {
      // Snap to nearest ET semitone position
      const etSemitones = h.octave * 12 + h.nearestSemitone;
      const log2val = etSemitones / 12;
      const angle = log2val * 2 * Math.PI - Math.PI / 2;
      const radius = BASE_R + GROWTH * log2val;
      return {
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
      };
    }
    const pt = getSpiralPoint(h.n, CX, CY, BASE_R, GROWTH);
    return { x: pt.x, y: pt.y };
  }

  function handleClick(h: HarmonicInfo) {
    if (playRef.current) playRef.current.stop();
    const freq = useET ? h.etFrequency : h.frequency;
    playRef.current = play(freq);
    setTimeout(() => {
      playRef.current?.stop();
      playRef.current = null;
    }, 800);
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-lg mx-auto">
      {/* Spiral backbone */}
      <path
        d={backbonePath}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1.5}
      />

      {/* Octave ring markers */}
      {octaveMarkers.map(m => (
        <circle
          key={m.octave}
          cx={m.cx}
          cy={m.cy}
          r={m.radius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={0.5}
          strokeDasharray="4 4"
        />
      ))}

      {/* ET reference markers */}
      {etPoints.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={2} fill="#d1d5db" />
          {pt.semitone % 12 === 0 || showET ? (
            <text
              x={pt.x}
              y={pt.y - 5}
              textAnchor="middle"
              fontSize={7}
              fill="#9ca3af"
            >
              {pt.name}
            </text>
          ) : null}
        </g>
      ))}

      {/* Harmonic nodes */}
      {harmonics.map(h => {
        const pos = getNodePosition(h);
        const r = getNodeRadius(h.n, BASE_NODE_R);
        const color = HARMONIC_COLORS[h.family];
        const isHovered = hoveredN === h.n;

        return (
          <g
            key={h.n}
            onMouseEnter={() => setHoveredN(h.n)}
            onMouseLeave={() => setHoveredN(null)}
            onClick={() => handleClick(h)}
            className="cursor-pointer"
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill={color}
              fillOpacity={isHovered ? 1 : 0.85}
              stroke={isHovered ? '#1f2937' : 'white'}
              strokeWidth={isHovered ? 2 : 1}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.max(8, r * 0.9)}
              fontWeight="bold"
              fill="white"
              pointerEvents="none"
            >
              {h.n}
            </text>
          </g>
        );
      })}

      {/* Info panel */}
      {hoveredInfo && (
        <foreignObject x={310} y={10} width={180} height={140}>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs leading-relaxed">
            <div className="font-bold text-sm mb-1">
              Harmonic {hoveredInfo.n}
              <span
                className="ml-1.5 inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: HARMONIC_COLORS[hoveredInfo.family] }}
              />
            </div>
            <div className="text-gray-600">
              <div>{hoveredInfo.frequency.toFixed(1)} Hz ({hoveredInfo.ratio})</div>
              <div>Nearest: <strong>{hoveredInfo.nearestNoteName}</strong></div>
              <div>Deviation: {hoveredInfo.centsDeviation >= 0 ? '+' : ''}{hoveredInfo.centsDeviation.toFixed(1)}¢</div>
              <div>Interval: {hoveredInfo.intervalName}</div>
              <div>Family: {hoveredInfo.family}</div>
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
