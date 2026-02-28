import { useRef, useEffect } from 'react';
import { PITCH_CLASS_COLORS } from '../lib/noteColors';

// ── Types ─────────────────────────────────────────────────────────────────

interface Props {
  fundHz: number;
  fundPitchClass: number;
  leftHz: number;
  rightHz: number;
  leftColor: string;
  rightColor: string;
  size?: number;
}

// ── Spiral math ───────────────────────────────────────────────────────────
//
// Logarithmic / Pythagorean spiral: one full revolution = one octave.
// Harmonic n sits at:
//   angle θ_n = log₂(n) × 2π   (so octaves 1,2,4,8,16 all share the same angle)
//   radius r_n = r_min × n      (linear growth in r — true log spiral property)
//
// This is mathematically identical to how a conch shell grows: each revolution
// of the shell is exactly twice the size of the previous one.

const N_HARMONICS = 16;

function harmonicAngle(n: number): number {
  return Math.log2(n) * 2 * Math.PI;
}

function harmonicXY(n: number, cx: number, cy: number, rMin: number): [number, number] {
  const theta = harmonicAngle(n);
  const r     = rMin * n;
  // offset by −π/2 so θ=0 (octave axis) points straight up
  return [
    cx + r * Math.cos(theta - Math.PI / 2),
    cy + r * Math.sin(theta - Math.PI / 2),
  ];
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ConchSpiral({
  fundHz, fundPitchClass, leftHz, rightHz, leftColor, rightColor, size = 280,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx   = size / 2;
    const cy   = size / 2;
    // Scale so the outermost harmonic (n=16) fits inside the canvas
    const rMin = (size / 2 - 20) / N_HARMONICS;

    ctx.clearRect(0, 0, size, size);

    // ── Background radial glow at center ──────────────────────────────────

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
    grad.addColorStop(0,   'rgba(35, 22, 8, 0.55)');
    grad.addColorStop(1,   'rgba(0,  0,  0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // ── Logarithmic spiral backbone ───────────────────────────────────────

    const maxTheta = Math.log2(N_HARMONICS) * 2 * Math.PI; // ~8π for 16 harmonics
    const steps    = 1000;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;
      // r grows as 2^(θ/2π) so that every full revolution doubles the radius
      const r = rMin * Math.pow(2, theta / (2 * Math.PI));
      const x = cx + r * Math.cos(theta - Math.PI / 2);
      const y = cy + r * Math.sin(theta - Math.PI / 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(210, 160, 70, 0.22)';
    ctx.lineWidth   = 1.4;
    ctx.stroke();
    ctx.restore();

    // ── Octave-axis rib (faint radial line at θ=0) ───────────────────────
    // Octaves 1, 2, 4, 8, 16 all sit on this line — the "spine" of the shell

    ctx.save();
    ctx.strokeStyle = 'rgba(245, 200, 74, 0.14)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - rMin * N_HARMONICS - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Identify highlighted harmonics ────────────────────────────────────

    const leftRatio  = leftHz  / fundHz;
    const rightRatio = rightHz / fundHz;

    function closestHarmonic(ratio: number): number | null {
      for (let n = 1; n <= N_HARMONICS; n++) {
        if (Math.abs(ratio - n) < 0.12) return n;
        // Also accept ratios that reduce to n after octave-equivalence
        let r = ratio;
        while (r < 1)  r *= 2;
        while (r >= 2) r /= 2;
        const nReduced = n / Math.pow(2, Math.floor(Math.log2(n)));
        if (Math.abs(r - nReduced) < 0.06) return n;
      }
      return null;
    }

    const leftHarmonic  = closestHarmonic(leftRatio);
    const rightHarmonic = closestHarmonic(rightRatio);

    // ── Harmonic dots ──────────────────────────────────────────────────────

    for (let n = N_HARMONICS; n >= 1; n--) {  // draw large first so small dots appear on top
      const [x, y] = harmonicXY(n, cx, cy, rMin);

      // Pitch class: each harmonic n is log₂(n) octaves above fundamental
      const centsAbove = Math.log2(n) * 1200;
      const semitones  = Math.round(centsAbove / 100);
      const pc = ((fundPitchClass + semitones) % 12 + 12) % 12;
      const color = PITCH_CLASS_COLORS[pc]!;

      const isLeft  = n === leftHarmonic;
      const isRight = n === rightHarmonic;
      const isRoot  = n === 1;
      const isHighlit = isLeft || isRight || isRoot;

      const hlColor = isRoot ? '#f5c84a' : isLeft ? leftColor : rightColor;

      // Dot radius: bigger for low harmonics
      const dotR = isRoot ? 4.5 : Math.max(2.0, 4.8 - n * 0.18);

      if (isHighlit) {
        // Outer glow ring
        ctx.save();
        ctx.shadowBlur  = 16;
        ctx.shadowColor = hlColor;
        ctx.strokeStyle = hlColor;
        ctx.lineWidth   = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, y, dotR + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Solid filled dot
        ctx.save();
        ctx.fillStyle   = hlColor;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = hlColor;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(x, y, dotR + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Normal pitch-class colored dot
        ctx.save();
        ctx.fillStyle   = color;
        ctx.shadowBlur  = 4;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.58;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Harmonic number label (offset outward)
      if (n <= 13) {
        const theta = harmonicAngle(n) - Math.PI / 2;
        const lr    = rMin * n + dotR + 7;
        ctx.save();
        ctx.fillStyle    = isHighlit ? '#fff' : 'rgba(200, 170, 100, 0.55)';
        ctx.globalAlpha  = isHighlit ? 0.9 : 0.42;
        ctx.font         = `${n <= 3 ? 9 : 8}px monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n}`, cx + lr * Math.cos(theta), cy + lr * Math.sin(theta));
        ctx.restore();
      }
    }

    // ── Center dot (fundamental) ─────────────────────────────────────────

    ctx.save();
    ctx.fillStyle   = '#f5c84a';
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#f5c84a';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  }, [fundHz, fundPitchClass, leftHz, rightHz, leftColor, rightColor, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', borderRadius: 10 }}
    />
  );
}
