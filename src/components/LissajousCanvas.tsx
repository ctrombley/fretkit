import { useRef, useEffect } from 'react';
import { lissajousPoints } from '../lib/monochord';

interface Props {
  p: number;
  q: number;
  size?: number;
  label?: string;
}

const TRACE_COLOR  = '#f5c84a';   // warm amber/phosphor
const GLOW_COLOR   = '#ffd740';
const BG_COLOR     = 'transparent';

export default function LissajousCanvas({ p, q, size = 240, label }: Props) {
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

    ctx.clearRect(0, 0, size, size);

    const pad    = 24;
    const half   = size / 2;
    const drawR  = half - pad;

    const pts    = lissajousPoints(p, q, 1400, Math.PI / 2);
    const n      = pts.length;

    // Draw the figure in multiple passes for a phosphor glow effect
    // Pass 1: wide soft glow
    ctx.save();
    ctx.strokeStyle = GLOW_COLOR;
    ctx.lineWidth   = 3.5;
    ctx.globalAlpha = 0.08;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const cx = half + x * drawR;
      const cy = half + y * drawR;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();

    // Pass 2: medium glow
    ctx.save();
    ctx.strokeStyle = GLOW_COLOR;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.18;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = GLOW_COLOR;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const cx = half + x * drawR;
      const cy = half + y * drawR;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();

    // Pass 3: crisp core — draw in segments with fade-in effect
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < n; i++) {
      const [x0, y0] = pts[i - 1]!;
      const [x1, y1] = pts[i]!;
      const progress = i / n;
      // Vary alpha slightly along the trace for an aged phosphor look
      const alpha = 0.55 + 0.35 * Math.sin(progress * Math.PI);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = GLOW_COLOR;
      ctx.strokeStyle = TRACE_COLOR;
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.moveTo(half + x0 * drawR, half + y0 * drawR);
      ctx.lineTo(half + x1 * drawR, half + y1 * drawR);
      ctx.stroke();
    }
    ctx.restore();

    // Corner dots at the start of the trace
    const [fx, fy] = pts[0]!;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(half + fx * drawR, half + fy * drawR, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ratio label inside
    if (label) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle   = '#f5c84a';
      ctx.font        = `bold ${Math.round(size * 0.088)}px serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, half, half);
      ctx.restore();
    }
  }, [p, q, size, label]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        background: BG_COLOR,
        display: 'block',
        borderRadius: '50%',
        boxShadow: '0 0 0 1px rgba(245,200,74,0.08)',
      }}
    />
  );
}
