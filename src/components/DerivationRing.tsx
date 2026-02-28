import { useState, useRef } from 'react';
import {
  getDerivation,
  getETRingPositions,
  getRingPoint,
  type GeneratorPreset,
  type DerivedNote,
} from '../lib/derivation';
import { HARMONIC_COLORS } from '../lib/overtones';
import { play } from '../lib/musicbox';

interface DerivationRingProps {
  fundamentalHz: number;
  pitchClass: number;
  generator: GeneratorPreset;
  steps: number;
  divisions: number;
  activeStep: number | null;
  onActiveStepChange: (step: number | null) => void;
}

const SIZE = 500;
const CX = 250;
const CY = 250;
const ET_RING_R = 200;
const DERIVED_RING_R = 160;
const NODE_R = 12;
const LABEL_R = 220;

export default function DerivationRing({
  fundamentalHz,
  pitchClass,
  generator,
  steps,
  divisions,
  activeStep,
  onActiveStepChange,
}: DerivationRingProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const playRef = useRef<{ stop: () => void } | null>(null);

  const derivation = getDerivation(generator, fundamentalHz, pitchClass, steps, divisions);
  const etPositions = getETRingPositions(CX, CY, ET_RING_R, pitchClass, divisions);
  const centsPerStep = 1200 / divisions;
  const color = HARMONIC_COLORS[derivation.generator.family];

  const visibleStep = hoveredStep ?? activeStep;
  const hoveredInfo = visibleStep !== null
    ? derivation.steps.find(s => s.step === visibleStep) ?? null
    : null;

  function handleClick(note: DerivedNote) {
    if (playRef.current) playRef.current.stop();
    playRef.current = play(note.frequency);
    setTimeout(() => {
      playRef.current?.stop();
      playRef.current = null;
    }, 800);
  }

  function handleHover(step: number | null) {
    setHoveredStep(step);
    onActiveStepChange(step);
  }

  // Build arrow connections between consecutive derived notes
  function getConnectionPath(from: DerivedNote, to: DerivedNote): string {
    const p1 = getRingPoint(from.centsInOctave, CX, CY, DERIVED_RING_R);
    const p2 = getRingPoint(to.centsInOctave, CX, CY, DERIVED_RING_R);
    // Quadratic bezier curving inward toward center
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = mx - CX;
    const dy = my - CY;
    const pull = 0.6;
    const cpx = CX + dx * pull;
    const cpy = CY + dy * pull;
    // Offset endpoints slightly to avoid overlapping nodes
    const angle1 = Math.atan2(p1.y - CY, p1.x - CX);
    const angle2 = Math.atan2(p2.y - CY, p2.x - CX);
    const startX = p1.x - NODE_R * Math.cos(angle1) * 0.3;
    const startY = p1.y - NODE_R * Math.sin(angle1) * 0.3;
    const endX = p2.x - NODE_R * Math.cos(angle2) * 0.3;
    const endY = p2.y - NODE_R * Math.sin(angle2) * 0.3;
    return `M ${startX} ${startY} Q ${cpx} ${cpy} ${endX} ${endY}`;
  }

  // Build deviation arc path from ET position to derived position
  function getDeviationArc(note: DerivedNote): string | null {
    if (Math.abs(note.centsDeviation) < 0.5) return null;
    const etCents = note.nearestETStep * centsPerStep;
    const jiCents = note.centsInOctave;
    const startAngle = (etCents / 1200) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (jiCents / 1200) * 2 * Math.PI - Math.PI / 2;
    const arcR = (ET_RING_R + DERIVED_RING_R) / 2;
    const x1 = CX + arcR * Math.cos(startAngle);
    const y1 = CY + arcR * Math.sin(startAngle);
    const x2 = CX + arcR * Math.cos(endAngle);
    const y2 = CY + arcR * Math.sin(endAngle);
    const sweep = note.centsDeviation > 0 ? 1 : 0;
    return `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 ${sweep} ${x2} ${y2}`;
  }

  // Comma gap arc
  function getCommaArc(): string | null {
    if (steps < 2 || Math.abs(derivation.commaCents) < 0.5) return null;
    // The "return" position: where the next stacked interval would land
    const returnCents = ((steps * derivation.generator.cents) % 1200 + 1200) % 1200;
    const startAngle = (returnCents / 1200) * 2 * Math.PI - Math.PI / 2;
    const endAngle = -Math.PI / 2; // back to root (0 cents = 12 o'clock)
    const arcR = DERIVED_RING_R - 25;
    const x1 = CX + arcR * Math.cos(startAngle);
    const y1 = CY + arcR * Math.sin(startAngle);
    const x2 = CX + arcR * Math.cos(endAngle);
    const y2 = CY + arcR * Math.sin(endAngle);
    // Determine sweep direction based on sign of comma
    const sweep = derivation.commaCents > 0 ? 0 : 1;
    return `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 ${sweep} ${x2} ${y2}`;
  }

  const commaArcPath = getCommaArc();
  // Label position for comma: midpoint of the comma arc
  const commaLabelPos = (() => {
    if (steps < 2 || Math.abs(derivation.commaCents) < 0.5) return null;
    const returnCents = ((steps * derivation.generator.cents) % 1200 + 1200) % 1200;
    const midCents = returnCents / 2; // approximate midpoint
    const arcR = DERIVED_RING_R - 25;
    const midAngle = (midCents / 1200) * 2 * Math.PI - Math.PI / 2;
    return {
      x: CX + (arcR - 15) * Math.cos(midAngle),
      y: CY + (arcR - 15) * Math.sin(midAngle),
    };
  })();

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-lg mx-auto">
      <defs>
        <marker
          id="arrowhead"
          markerWidth={6}
          markerHeight={4}
          refX={5}
          refY={2}
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill={color} fillOpacity={0.5} />
        </marker>
      </defs>

      {/* Layer 1: ET reference ring */}
      <circle
        cx={CX}
        cy={CY}
        r={ET_RING_R}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      {etPositions.map(pos => {
        const tickAngle = (pos.cents / 1200) * 2 * Math.PI - Math.PI / 2;
        const innerR = ET_RING_R - 6;
        const outerR = ET_RING_R + 6;
        return (
          <g key={pos.step}>
            {/* Tick mark */}
            <line
              x1={CX + innerR * Math.cos(tickAngle)}
              y1={CY + innerR * Math.sin(tickAngle)}
              x2={CX + outerR * Math.cos(tickAngle)}
              y2={CY + outerR * Math.sin(tickAngle)}
              stroke="#d1d5db"
              strokeWidth={1.5}
            />
            {/* Note label */}
            <text
              x={CX + LABEL_R * Math.cos(tickAngle)}
              y={CY + LABEL_R * Math.sin(tickAngle)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={divisions > 24 ? 8 : 11}
              fill="#6b7280"
              fontWeight={pos.step === 0 ? 'bold' : 'normal'}
            >
              {pos.noteName}
            </text>
          </g>
        );
      })}

      {/* Layer 2: Deviation arcs */}
      {derivation.steps.map(note => {
        const d = getDeviationArc(note);
        if (!d) return null;
        return (
          <path
            key={`dev-${note.step}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.3}
          />
        );
      })}

      {/* Layer 3: Connection arrows */}
      {derivation.steps.slice(0, -1).map((note, i) => {
        const next = derivation.steps[i + 1]!;
        return (
          <path
            key={`arr-${note.step}`}
            d={getConnectionPath(note, next)}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={0.4}
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* Layer 4: Derived note nodes */}
      {derivation.steps.map(note => {
        const pt = getRingPoint(note.centsInOctave, CX, CY, DERIVED_RING_R);
        const isActive = visibleStep === note.step;
        return (
          <g
            key={note.step}
            onMouseEnter={() => handleHover(note.step)}
            onMouseLeave={() => handleHover(null)}
            onClick={() => handleClick(note)}
            className="cursor-pointer"
          >
            <circle
              cx={pt.x}
              cy={pt.y}
              r={NODE_R}
              fill={color}
              fillOpacity={isActive ? 1 : 0.85}
              stroke={isActive ? '#1f2937' : 'white'}
              strokeWidth={isActive ? 2 : 1}
            />
            <text
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fontWeight="bold"
              fill="white"
              pointerEvents="none"
            >
              {note.nearestNoteName}
            </text>
          </g>
        );
      })}

      {/* Layer 5: Comma gap indicator */}
      {commaArcPath && (
        <path
          d={commaArcPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2.5}
          strokeDasharray="6 3"
        />
      )}
      {commaLabelPos && Math.abs(derivation.commaCents) >= 0.5 && (
        <text
          x={commaLabelPos.x}
          y={commaLabelPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fill="#ef4444"
          fontWeight="bold"
        >
          {derivation.commaCents >= 0 ? '+' : ''}{derivation.commaCents.toFixed(1)}&#162;
        </text>
      )}

      {/* Layer 6: Info panel */}
      {hoveredInfo && (
        <foreignObject x={310} y={10} width={180} height={140}>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs leading-relaxed">
            <div className="font-bold text-sm mb-1">
              Step {hoveredInfo.step}
              <span
                className="ml-1.5 inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="text-gray-600">
              <div>Ratio: {derivation.generator.ratio[0]}/{derivation.generator.ratio[1]} x{hoveredInfo.step}</div>
              <div>JI: {hoveredInfo.centsInOctave.toFixed(1)}&#162;</div>
              <div>ET: {(hoveredInfo.nearestETStep * centsPerStep).toFixed(1)}&#162;</div>
              <div>Deviation: {hoveredInfo.centsDeviation >= 0 ? '+' : ''}{hoveredInfo.centsDeviation.toFixed(1)}&#162;</div>
              <div>Note: <strong>{hoveredInfo.nearestNoteName}</strong></div>
              <div>{hoveredInfo.frequency.toFixed(1)} Hz</div>
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
