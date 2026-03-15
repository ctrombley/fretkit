import { useRef, useEffect } from 'react';

interface Props {
  p: number;
  q: number;
  size?: number;
  label?: string;
  /** Enable smooth morphing animation — lerps p/q toward targets each frame */
  animate?: boolean;
}

const TRACE_COLOR = '#f5c84a';
const GLOW_COLOR  = '#ffd740';
const PHASE       = Math.PI / 2;
const LERP_RATE   = 8;   // per-second; ~300ms to 90% settled

function buildPath(
  ctx: CanvasRenderingContext2D,
  size: number,
  p: number,
  q: number,
) {
  const half = size / 2;
  const r    = half - 24;
  const n    = 1200;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const t  = (i / n) * 2 * Math.PI;
    const cx = half + Math.sin(p * t + PHASE) * r;
    const cy = half + Math.sin(q * t) * r;
    if (i === 0) ctx.moveTo(cx, cy);
    else         ctx.lineTo(cx, cy);
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  p: number,
  q: number,
) {
  const dpr = window.devicePixelRatio ?? 1;
  ctx.clearRect(0, 0, size * dpr, size * dpr);

  // Pass 1 — wide soft glow
  ctx.save();
  ctx.strokeStyle = GLOW_COLOR;
  ctx.lineWidth   = 4;
  ctx.globalAlpha = 0.07;
  buildPath(ctx, size, p, q);
  ctx.stroke();
  ctx.restore();

  // Pass 2 — medium glow + shadow
  ctx.save();
  ctx.strokeStyle = GLOW_COLOR;
  ctx.lineWidth   = 2;
  ctx.globalAlpha = 0.22;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = GLOW_COLOR;
  buildPath(ctx, size, p, q);
  ctx.stroke();
  ctx.restore();

  // Pass 3 — crisp trace
  ctx.save();
  ctx.strokeStyle = TRACE_COLOR;
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.9;
  ctx.shadowBlur  = 5;
  ctx.shadowColor = GLOW_COLOR;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  buildPath(ctx, size, p, q);
  ctx.stroke();
  ctx.restore();

  // Start-of-trace dot
  const half = size / 2;
  const r    = half - 24;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle   = '#ffffff';
  ctx.shadowBlur  = 10;
  ctx.shadowColor = '#ffffff';
  ctx.beginPath();
  ctx.arc(half + Math.sin(PHASE) * r, half, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function LissajousCanvas({ p, q, size = 240, label, animate = false }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number | null>(null);
  const curPRef    = useRef(p);
  const curQRef    = useRef(q);
  const lastTsRef  = useRef<number | null>(null);
  const targetPRef = useRef(p);
  const targetQRef = useRef(q);

  // Keep targets current without restarting the rAF loop
  targetPRef.current = p;
  targetQRef.current = q;

  // Setup canvas size once (or when size changes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, [size]);

  // Animated mode — rAF loop with exponential lerp toward target p/q
  useEffect(() => {
    if (!animate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    curPRef.current  = p;
    curQRef.current  = q;
    lastTsRef.current = null;

    const tick = (ts: number) => {
      const dt = lastTsRef.current === null ? 0 : Math.min((ts - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = ts;

      // Exponential lerp — time-constant based so it's frame-rate independent
      const alpha = 1 - Math.exp(-LERP_RATE * dt);
      curPRef.current += (targetPRef.current - curPRef.current) * alpha;
      curQRef.current += (targetQRef.current - curQRef.current) * alpha;

      drawFrame(ctx, size, curPRef.current, curQRef.current);

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  // p/q intentionally omitted — read from refs each frame to avoid restart
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, size]);

  // Static mode — redraw when p/q/label change
  useEffect(() => {
    if (animate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFrame(ctx, size, p, q);

    if (label) {
      ctx.save();
      ctx.globalAlpha  = 0.35;
      ctx.fillStyle    = '#f5c84a';
      ctx.font         = `bold ${Math.round(size * 0.088)}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, size / 2, size / 2);
      ctx.restore();
    }
  }, [animate, p, q, size, label]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        background:   'transparent',
        display:      'block',
        borderRadius: '50%',
        boxShadow:    '0 0 0 1px rgba(245,200,74,0.08)',
      }}
    />
  );
}
