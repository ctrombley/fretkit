import { useRef, useEffect } from 'react';
import { PITCH_CLASS_COLORS } from '../lib/noteColors';

interface Props {
  fundHz: number;
  fundPitchClass: number;
  leftHz: number;
  rightHz: number;
  leftColor: string;
  rightColor: string;
  beatHz?: number;
  size?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const N_HARMONICS = 16;
const LERP_RATE   = 8;    // per second — ~100 ms settling time when bridge moves
const ROT_RATE    = 0.007; // rad/s — 1 revolution ≈ 15 minutes, very subtle

// ── Math helpers ───────────────────────────────────────────────────────────

function harmonicAngle(n: number): number {
  return Math.log2(n) * 2 * Math.PI;
}

/** Convert a frequency ratio (ratio = hz / fundHz) to (x,y) on the spiral. */
function ratioXY(
  ratio: number,
  cx: number,
  cy: number,
  rMin: number,
  rot: number,
): [number, number] {
  const theta = Math.log2(Math.max(ratio, 0.01)) * 2 * Math.PI;
  const r     = rMin * ratio;
  return [
    cx + r * Math.cos(theta + rot - Math.PI / 2),
    cy + r * Math.sin(theta + rot - Math.PI / 2),
  ];
}


// ── Main draw ──────────────────────────────────────────────────────────────

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  size: number,
  fundPitchClass: number,
  leftRatio: number,
  rightRatio: number,
  leftColor: string,
  rightColor: string,
  pulse: number,   // 0..1 smooth oscillation
  rot: number,     // cumulative rotation offset (radians)
) {
  const dpr   = window.devicePixelRatio ?? 1;
  const cx    = size / 2;
  const cy    = size / 2;
  const rMin  = (size / 2 - 18) / N_HARMONICS;

  ctx.clearRect(0, 0, size * dpr, size * dpr);

  // Background radial glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
  grad.addColorStop(0, 'rgba(30, 18, 6, 0.6)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const maxTheta = Math.log2(N_HARMONICS) * 2 * Math.PI;
  const steps    = 800;

  function spiralPoint(theta: number): [number, number] {
    const r = rMin * Math.pow(2, theta / (2 * Math.PI));
    return [
      cx + r * Math.cos(theta + rot - Math.PI / 2),
      cy + r * Math.sin(theta + rot - Math.PI / 2),
    ];
  }

  // ── Interval arc — highlight backbone between left and right ratios ──────

  const thetaL = Math.log2(Math.max(leftRatio,  0.01)) * 2 * Math.PI;
  const thetaR = Math.log2(Math.max(rightRatio, 0.01)) * 2 * Math.PI;
  const tMin   = Math.min(thetaL, thetaR);
  const tMax   = Math.max(thetaL, thetaR);

  if (tMax - tMin > 0.01 && tMin >= 0 && tMax <= maxTheta + 0.1) {
    // Build the arc path once, draw it twice (glow + crisp) — single path each pass
    const arcSteps = 120;
    function buildArcPath() {
      ctx.beginPath();
      for (let i = 0; i <= arcSteps; i++) {
        const [x, y] = spiralPoint(tMin + (tMax - tMin) * (i / arcSteps));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }

    // Gradient runs from first to last point of the arc
    const [x0, y0] = spiralPoint(tMin);
    const [xN, yN] = spiralPoint(tMax);
    // left/right order depends on which ratio is smaller
    const [gradC0, gradC1] = thetaL <= thetaR
      ? [leftColor, rightColor]
      : [rightColor, leftColor];

    const grad = ctx.createLinearGradient(x0, y0, xN, yN);
    grad.addColorStop(0, gradC0);
    grad.addColorStop(1, gradC1);

    // Pass 1: glow
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 5 + pulse * 3;
    ctx.globalAlpha = 0.12 + 0.08 * pulse;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = leftColor;
    ctx.lineCap     = 'round';
    buildArcPath();
    ctx.stroke();
    ctx.restore();

    // Pass 2: crisp
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2 + pulse * 1.5;
    ctx.globalAlpha = 0.5 + 0.3 * pulse;
    ctx.lineCap     = 'round';
    buildArcPath();
    ctx.stroke();
    ctx.restore();
  }

  // ── Spiral backbone ───────────────────────────────────────────────────────

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const theta  = (i / steps) * maxTheta;
    const [x, y] = spiralPoint(theta);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(210, 160, 70, 0.2)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();
  ctx.restore();

  // ── Octave axis rib ───────────────────────────────────────────────────────

  ctx.save();
  ctx.strokeStyle = 'rgba(245, 200, 74, 0.12)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  const ribLen = rMin * N_HARMONICS + 14;
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + ribLen * Math.cos(-Math.PI / 2 + rot),
    cy + ribLen * Math.sin(-Math.PI / 2 + rot),
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── Harmonic dots — batched by pitch-class color (no per-dot shadowBlur) ──

  // Collect dots grouped by color
  const dotGroups = new Map<string, Array<[number, number, number]>>();
  const labelList: number[] = [];

  for (let n = N_HARMONICS; n >= 1; n--) {
    const theta      = harmonicAngle(n);
    const r          = rMin * n;
    const x          = cx + r * Math.cos(theta + rot - Math.PI / 2);
    const y          = cy + r * Math.sin(theta + rot - Math.PI / 2);
    const centsAbove = Math.log2(n) * 1200;
    const semitones  = Math.round(centsAbove / 100);
    const pc         = ((fundPitchClass + semitones) % 12 + 12) % 12;
    const color      = PITCH_CLASS_COLORS[pc]!;
    const dotR       = Math.max(2.0, 4.8 - n * 0.18);

    if (!dotGroups.has(color)) dotGroups.set(color, []);
    dotGroups.get(color)!.push([x, y, dotR]);

    if (n <= 13) labelList.push(n);
  }

  // One fill call per unique color — no shadowBlur
  ctx.globalAlpha = 0.55;
  for (const [color, dots] of dotGroups) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [x, y, r] of dots) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Labels
  ctx.fillStyle    = 'rgba(200, 170, 100, 0.4)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  for (const n of labelList) {
    const theta = harmonicAngle(n);
    const r     = rMin * n + Math.max(2.0, 4.8 - n * 0.18) + 6;
    ctx.font = `${n <= 3 ? 9 : 8}px monospace`;
    ctx.fillText(`${n}`, cx + r * Math.cos(theta + rot - Math.PI / 2),
                          cy + r * Math.sin(theta + rot - Math.PI / 2));
  }

  // ── Continuous position indicators (left & right) ─────────────────────────

  for (const [ratio, color, label] of [
    [leftRatio,  leftColor,  'L'] as const,
    [rightRatio, rightColor, 'R'] as const,
  ]) {
    if (ratio < 0.99 || ratio > N_HARMONICS + 0.5) continue;

    const [x, y] = ratioXY(ratio, cx, cy, rMin, rot);
    const glow   = 12 + pulse * 14;
    const dotR   = 4.5 + pulse * 2.5;

    // Outer ring
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.45 + 0.35 * pulse;
    ctx.shadowBlur  = glow;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, dotR + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Filled dot
    ctx.save();
    ctx.fillStyle   = color;
    ctx.shadowBlur  = glow;
    ctx.shadowColor = color;
    ctx.globalAlpha = 0.9 + 0.1 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Small label
    ctx.save();
    ctx.fillStyle    = '#fff';
    ctx.globalAlpha  = 0.7;
    ctx.font         = '7px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.restore();
  }

  // ── Center dot (fundamental) ─────────────────────────────────────────────

  ctx.save();
  ctx.fillStyle   = '#f5c84a';
  ctx.shadowBlur  = 12 + pulse * 6;
  ctx.shadowColor = '#f5c84a';
  ctx.globalAlpha = 0.85 + 0.15 * pulse;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ConchSpiral({
  fundHz, fundPitchClass, leftHz, rightHz, leftColor, rightColor, beatHz = 0, size = 280,
}: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef<number | null>(null);
  const lastTsRef      = useRef<number | null>(null);
  const rotRef         = useRef(0);
  const tRef           = useRef(0);
  const curLeftRef     = useRef(leftHz / fundHz);
  const curRightRef    = useRef(rightHz / fundHz);

  // Keep targets accessible in the rAF closure without restarting
  const targetLeftRef  = useRef(leftHz / fundHz);
  const targetRightRef = useRef(rightHz / fundHz);
  const beatHzRef      = useRef(beatHz);
  const leftColorRef   = useRef(leftColor);
  const rightColorRef  = useRef(rightColor);
  const fundPCRef      = useRef(fundPitchClass);

  targetLeftRef.current  = leftHz / fundHz;
  targetRightRef.current = rightHz / fundHz;
  beatHzRef.current      = beatHz;
  leftColorRef.current   = leftColor;
  rightColorRef.current  = rightColor;
  fundPCRef.current      = fundPitchClass;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    curLeftRef.current  = targetLeftRef.current;
    curRightRef.current = targetRightRef.current;
    lastTsRef.current   = null;

    const tick = (ts: number) => {
      const dt = lastTsRef.current === null
        ? 0
        : Math.min((ts - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = ts;

      // Advance time and rotation
      tRef.current  += dt;
      rotRef.current += ROT_RATE * dt;

      // Lerp ratios toward targets
      const alpha = 1 - Math.exp(-LERP_RATE * dt);
      curLeftRef.current  += (targetLeftRef.current  - curLeftRef.current)  * alpha;
      curRightRef.current += (targetRightRef.current - curRightRef.current) * alpha;

      // Pulse: use beat Hz if in visible range, else slow breath
      const bHz = beatHzRef.current;
      const pulseHz = bHz > 0.3 && bHz <= 10 ? bHz : 0.7;
      const pulse   = 0.5 + 0.5 * Math.sin(2 * Math.PI * pulseHz * tRef.current);

      drawSpiral(
        ctx, size,
        fundPCRef.current,
        curLeftRef.current,
        curRightRef.current,
        leftColorRef.current,
        rightColorRef.current,
        pulse,
        rotRef.current,
      );

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', borderRadius: 10 }}
    />
  );
}
