import { useState } from 'react';
import { useStore } from '../store';
import {
  FIFTHS_ORDER,
  noteName,
  usesSharps,
  getDiatonicPitchClasses,
  getRelativeMinor,
  getDominantKey,
  getSubdominantKey,
} from '../lib/harmony';

const CX = 250;
const CY = 250;
const SEGMENT_ANGLE = 30; // 360 / 12
const ANGLE_OFFSET = -90 - SEGMENT_ANGLE / 2; // puts C at 12 o'clock

const INNER_R1 = 60;
const INNER_R2 = 110;
const MIDDLE_R1 = 115;
const MIDDLE_R2 = 170;
const OUTER_R1 = 175;
const OUTER_R2 = 230;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcSegmentPath(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

function spiralPath(): string {
  const points: string[] = [];
  const turns = 3;
  const steps = 200;
  const rMin = 30;
  const rMax = 240;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * 2 * Math.PI - Math.PI / 2;
    const r = rMin + (rMax - rMin) * t;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

interface SegmentInfo {
  ring: 'inner' | 'major' | 'minor';
  pitchClass: number;
}

export default function HarmonicSpiral() {
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const setSpiralRoot = useStore(s => s.setSpiralRoot);
  const setSpiralMode = useStore(s => s.setSpiralMode);

  const [hovered, setHovered] = useState<SegmentInfo | null>(null);

  const diatonicPCs = getDiatonicPitchClasses(spiralRoot, spiralMode);
  const dominantPC = getDominantKey(spiralRoot);
  const subdominantPC = getSubdominantKey(spiralRoot);

  function getSegmentFill(pc: number, ring: 'inner' | 'major' | 'minor'): string {
    const isHovered = hovered && hovered.pitchClass === pc && hovered.ring === ring;

    // Root
    if (pc === spiralRoot) {
      return isHovered ? '#88b328' : '#99C432';
    }

    // In current key
    if (diatonicPCs.has(pc)) {
      // Dominant / subdominant
      if (pc === dominantPC || pc === subdominantPC) {
        return isHovered ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
      }
      return isHovered ? 'rgba(236, 72, 153, 0.30)' : 'rgba(236, 72, 153, 0.20)';
    }

    // Not in key
    return isHovered ? '#d1d5db' : '#e5e7eb';
  }

  function getTextColor(pc: number): string {
    if (pc === spiralRoot) return '#ffffff';
    if (diatonicPCs.has(pc)) return '#1f2937';
    return '#9ca3af';
  }

  function handleClick(ring: 'inner' | 'major' | 'minor', pc: number) {
    if (ring === 'inner') {
      setSpiralRoot(pc);
    } else if (ring === 'major') {
      setSpiralRoot(pc);
      setSpiralMode('major');
    } else {
      // Minor ring: the displayed minor key's root is the relative minor of this position's major key
      const minorRoot = getRelativeMinor(pc);
      setSpiralRoot(minorRoot);
      setSpiralMode('minor');
    }
  }

  function renderRing(
    innerR: number, outerR: number,
    ring: 'inner' | 'major' | 'minor',
    labelFn: (pc: number) => string,
  ) {
    return FIFTHS_ORDER.map((pc, i) => {
      const startAngle = ANGLE_OFFSET + i * SEGMENT_ANGLE;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const labelR = (innerR + outerR) / 2;
      const labelPos = polarToCartesian(CX, CY, labelR, midAngle);
      const fill = getSegmentFill(pc, ring);
      const textColor = getTextColor(pc);
      const label = labelFn(pc);
      const fontSize = ring === 'inner' ? 14 : 11;

      return (
        <g
          key={`${ring}-${pc}`}
          className="cursor-pointer"
          onClick={() => handleClick(ring, pc)}
          onMouseEnter={() => setHovered({ ring, pitchClass: pc })}
          onMouseLeave={() => setHovered(null)}
        >
          <path
            d={arcSegmentPath(CX, CY, innerR, outerR, startAngle, endAngle)}
            fill={fill}
            stroke={diatonicPCs.has(pc) ? 'rgba(236, 72, 153, 0.5)' : '#d1d5db'}
            strokeWidth={pc === spiralRoot ? 2 : 1}
          />
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight={pc === spiralRoot ? 700 : 500}
            fill={textColor}
            className="pointer-events-none select-none"
          >
            {label}
          </text>
        </g>
      );
    });
  }

  const preferSharps = usesSharps(spiralRoot);

  return (
    <svg viewBox="0 0 500 500" className="w-full max-w-lg mx-auto">
      {/* Decorative spiral */}
      <path
        d={spiralPath()}
        fill="none"
        stroke="rgba(156, 163, 175, 0.15)"
        strokeWidth={1}
      />

      {/* Inner ring: pitch classes */}
      {renderRing(INNER_R1, INNER_R2, 'inner', (pc) => noteName(pc, preferSharps))}

      {/* Middle ring: major key labels */}
      {renderRing(MIDDLE_R1, MIDDLE_R2, 'major', (pc) => noteName(pc, preferSharps))}

      {/* Outer ring: relative minor key labels */}
      {renderRing(OUTER_R1, OUTER_R2, 'minor', (pc) => {
        const minorRoot = getRelativeMinor(pc);
        return noteName(minorRoot, preferSharps) + 'm';
      })}
    </svg>
  );
}
