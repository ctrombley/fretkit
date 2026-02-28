import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CANONICAL_RATIOS, GOLDEN_POSITION } from '../lib/monochord';

// ── Types ─────────────────────────────────────────────────────────────────

interface PluckState {
  startMs: number;
  durationMs: number;
}

export interface MonochordStringHandle {
  pluck: (side: 'left' | 'right' | 'both') => void;
}

interface Props {
  bridgePosition: number;
  onBridgeChange: (t: number) => void;
  leftColor: string;
  rightColor: string;
  /** Called when user directly interacts with the string (for parent to play audio). */
  onPluck: (side: 'left' | 'right' | 'both') => void;
}

// ── Constants ─────────────────────────────────────────────────────────────

const CANVAS_H      = 190;
const STRING_Y      = 95;
const BRIDGE_HIT_R  = 14;
const PLUCK_MS      = 4300;
const VISUAL_HZ     = 3.5;
const MIN_POS       = 0.04;
const MAX_POS       = 0.96;

// ── Drawing helpers ───────────────────────────────────────────────────────

function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, y: number,
  color: string,
) {
  ctx.save();
  ctx.shadowBlur  = 12;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.8;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  // Second pass — brighter core
  ctx.shadowBlur  = 4;
  ctx.globalAlpha = 1;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, baseY: number,
  amplitude: number,
  color: string,
  elapsedMs: number,
) {
  const segLen = x1 - x0;
  if (segLen < 2) return;

  const maxAmp = Math.min(segLen * 0.14, 46);
  const phase  = (elapsedMs / 1000) * VISUAL_HZ * 2 * Math.PI;
  const steps  = Math.ceil(segLen);

  ctx.save();
  ctx.shadowBlur  = 20;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const xRel = i / steps;
    const x    = x0 + xRel * segLen;
    const y    = baseY
      + amplitude * maxAmp
      * Math.sin(Math.PI * xRel)
      * Math.cos(phase);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  bx: number, cy: number,
  dragging: boolean,
) {
  ctx.save();

  // Dashed notch
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(bx, cy - 44);
  ctx.lineTo(bx, cy + 44);
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer ring
  ctx.shadowBlur  = dragging ? 30 : 20;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = dragging ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(bx, cy, dragging ? 13 : 11, 0, Math.PI * 2);
  ctx.stroke();

  // Inner jewel
  ctx.shadowBlur  = dragging ? 24 : 16;
  ctx.shadowColor = '#fffde7';
  ctx.fillStyle   = dragging ? '#ffffff' : '#fffde7';
  ctx.beginPath();
  ctx.arc(bx, cy, dragging ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGhostMarkers(
  ctx: CanvasRenderingContext2D,
  w: number, cy: number,
  bridgePos: number,
) {
  ctx.save();
  ctx.font      = '9px monospace';
  ctx.textAlign = 'center';

  const toShow: { pos: number; label: string }[] = [];
  for (const cr of CANONICAL_RATIOS.slice(0, 9)) {
    for (const pos of [cr.position, 1 - cr.position]) {
      if (Math.abs(pos - bridgePos) > 0.022) {
        toShow.push({ pos, label: cr.symbol });
      }
    }
  }
  if (Math.abs(GOLDEN_POSITION - bridgePos) > 0.022) {
    toShow.push({ pos: GOLDEN_POSITION, label: 'φ' });
  }

  for (const { pos, label } of toShow) {
    const x = pos * w;
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(x, cy - 26);
    ctx.lineTo(x, cy + 26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillText(label, x, cy - 30);
  }
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────

const MonochordString = forwardRef<MonochordStringHandle, Props>(
  function MonochordString({ bridgePosition, onBridgeChange, leftColor, rightColor, onPluck }, ref) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const s = useRef({
      bridgePos:  bridgePosition,
      leftColor,
      rightColor,
      isDragging: false,
      leftPluck:  null as PluckState | null,
      rightPluck: null as PluckState | null,
      animId:     0,
      w:          800,
    });

    // Keep ref in sync with props without re-running effects
    s.current.bridgePos  = bridgePosition;
    s.current.leftColor  = leftColor;
    s.current.rightColor = rightColor;

    // ── Internal pluck trigger ───────────────────────────────────────────

    const triggerPluck = useCallback((side: 'left' | 'right' | 'both') => {
      const now = performance.now();
      const ps: PluckState = { startMs: now, durationMs: PLUCK_MS };
      if (side === 'left'  || side === 'both') s.current.leftPluck  = { ...ps };
      if (side === 'right' || side === 'both') s.current.rightPluck = { ...ps };
    }, []);

    useImperativeHandle(ref, () => ({ pluck: triggerPluck }), [triggerPluck]);

    // ── Draw loop ────────────────────────────────────────────────────────

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { bridgePos, leftColor: lc, rightColor: rc, isDragging, w } = s.current;
      const bx = bridgePos * w;
      const cy = STRING_Y;
      const now = performance.now();

      ctx.clearRect(0, 0, w, CANVAS_H);

      drawGhostMarkers(ctx, w, cy, bridgePos);

      // Left segment
      const lp = s.current.leftPluck;
      if (lp) {
        const elapsed = now - lp.startMs;
        const amp     = Math.exp(-elapsed / (lp.durationMs * 0.30));
        if (amp > 0.004) {
          drawWave(ctx, 0, bx, cy, amp, lc, elapsed);
        } else {
          s.current.leftPluck = null;
          drawGlowLine(ctx, 0, bx, cy, lc);
        }
      } else {
        drawGlowLine(ctx, 0, bx, cy, lc);
      }

      // Right segment
      const rp = s.current.rightPluck;
      if (rp) {
        const elapsed = now - rp.startMs;
        const amp     = Math.exp(-elapsed / (rp.durationMs * 0.30));
        if (amp > 0.004) {
          drawWave(ctx, bx, w, cy, amp, rc, elapsed);
        } else {
          s.current.rightPluck = null;
          drawGlowLine(ctx, bx, w, cy, rc);
        }
      } else {
        drawGlowLine(ctx, bx, w, cy, rc);
      }

      drawBridge(ctx, bx, cy, isDragging);

      s.current.animId = requestAnimationFrame(draw);
    }, []);

    // ── Resize observer ──────────────────────────────────────────────────

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const target = canvas.parentElement ?? canvas;
      const ro = new ResizeObserver(entries => {
        const w = entries[0]?.contentRect.width ?? 800;
        canvas.width      = w;
        canvas.height     = CANVAS_H;
        s.current.w       = w;
      });
      ro.observe(target);
      return () => ro.disconnect();
    }, []);

    // ── RAF loop ─────────────────────────────────────────────────────────

    useEffect(() => {
      s.current.animId = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(s.current.animId);
    }, [draw]);

    // ── Pointer events ───────────────────────────────────────────────────

    const getT = useCallback((clientX: number): number => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return 0.5;
      return Math.max(MIN_POS, Math.min(MAX_POS, (clientX - rect.left) / rect.width));
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const t  = getT(e.clientX);
      const bx = s.current.bridgePos * s.current.w;
      const px = t * s.current.w;

      if (Math.abs(px - bx) <= BRIDGE_HIT_R) {
        s.current.isDragging = true;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else {
        const side = t < s.current.bridgePos ? 'left' : 'right';
        triggerPluck(side);
        onPluck(side);
      }
    }, [getT, triggerPluck, onPluck]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!s.current.isDragging) return;
      onBridgeChange(getT(e.clientX));
    }, [getT, onBridgeChange]);

    const stopDrag = useCallback(() => { s.current.isDragging = false; }, []);

    return (
      <div className="w-full relative select-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={CANVAS_H}
          className="w-full"
          style={{ display: 'block', cursor: 'ew-resize', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
        />
      </div>
    );
  },
);

export default MonochordString;
