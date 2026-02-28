import { useCallback, useRef } from 'react';

interface SynthKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  logarithmic?: boolean;
  size?: number;
  color?: string;
  formatValue?: (value: number) => string;
}

const START_ANGLE = 135; // 7 o'clock
const END_ANGLE = 405;   // 5 o'clock
const ARC_RANGE = END_ANGLE - START_ANGLE; // 270 degrees
const TICK_COUNT = 11;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(cx, cy, r, endAngle);
  const end = polarToXY(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function normalize(value: number, min: number, max: number, logarithmic: boolean): number {
  if (logarithmic && min > 0) {
    return (Math.log(value / min)) / (Math.log(max / min));
  }
  return (value - min) / (max - min);
}

function denormalize(norm: number, min: number, max: number, logarithmic: boolean): number {
  const clamped = Math.max(0, Math.min(1, norm));
  if (logarithmic && min > 0) {
    return min * Math.pow(max / min, clamped);
  }
  return min + clamped * (max - min);
}

export default function SynthKnob({
  value,
  min,
  max,
  onChange,
  label,
  unit = '',
  logarithmic = false,
  size = 64,
  color = '#99C432',
  formatValue,
}: SynthKnobProps) {
  const dragRef = useRef<{ startY: number; startNorm: number } | null>(null);

  const norm = normalize(value, min, max, logarithmic);
  const valueAngle = START_ANGLE + norm * ARC_RANGE;

  const cx = 32;
  const cy = 32;
  const knobR = 20;
  const arcR = 25;
  const tickR = 28;
  const pointerR = 16;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startY: e.clientY,
        startNorm: normalize(value, min, max, logarithmic),
      };
    },
    [value, min, max, logarithmic],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const sensitivity = e.shiftKey ? 0.001 : 0.01;
      const delta = (dragRef.current.startY - e.clientY) * sensitivity;
      const newNorm = Math.max(0, Math.min(1, dragRef.current.startNorm + delta));
      onChange(denormalize(newNorm, min, max, logarithmic));
    },
    [min, max, logarithmic, onChange],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const displayValue = formatValue
    ? formatValue(value)
    : value >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : value >= 100
        ? Math.round(value).toString()
        : value.toFixed(value < 1 ? 2 : 1);

  // Pointer line
  const pointer = polarToXY(cx, cy, pointerR, valueAngle);

  // Build ticks
  const ticks = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const tickAngle = START_ANGLE + (i / (TICK_COUNT - 1)) * ARC_RANGE;
    const inner = polarToXY(cx, cy, tickR, tickAngle);
    const outer = polarToXY(cx, cy, tickR + 2.5, tickAngle);
    ticks.push(
      <line
        key={i}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke="#555"
        strokeWidth={0.8}
      />,
    );
  }

  const scale = size / 64;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500">
        {label}
      </span>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="cursor-ns-resize select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* Knob body */}
        <circle cx={cx} cy={cy} r={knobR} fill="#1a1a1a" stroke="#333" strokeWidth={1.5} />

        {/* Background arc */}
        <path
          d={describeArc(cx, cy, arcR, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="#333"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {norm > 0.005 && (
          <path
            d={describeArc(cx, cy, arcR, START_ANGLE, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}

        {/* Ticks */}
        {ticks}

        {/* Pointer line */}
        <line
          x1={cx}
          y1={cy}
          x2={pointer.x}
          y2={pointer.y}
          stroke="#ccc"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-[9px] text-gray-400 tabular-nums"
        style={{ fontSize: 9 * Math.min(scale, 1) }}
      >
        {displayValue}
        {unit && <span className="text-gray-600 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
