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
  onPluck: (side: 'left' | 'right' | 'both') => void;
  onMarkerSnap: (position: number) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────

const CANVAS_H     = 190;
const STRING_Y     = 95;
const BRIDGE_HIT_R = 14;
const PLUCK_MS     = 4300;
const VISUAL_HZ    = 3.5;
const MIN_POS      = 0.04;
const MAX_POS      = 0.96;
const THROTTLE_MS  = 32; // ~30fps for parent state; canvas always runs at full fps via ref

// ── Drawing helpers ───────────────────────────────────────────────────────

function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, y: number,
  color: string,
) {
  ctx.save();
  ctx.shadowBlur  = 10;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.globalAlpha = 0.85;
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
  ctx.shadowBlur  = 16;
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

  // Dashed notch — dark on light background
  ctx.strokeStyle = 'rgba(0,0,0,0.13)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(bx, cy - 44);
  ctx.lineTo(bx, cy + 44);
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer ring
  ctx.shadowBlur  = dragging ? 12 : 7;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.strokeStyle = dragging ? 'rgba(30,41,59,0.7)' : 'rgba(100,116,139,0.5)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(bx, cy, dragging ? 13 : 11, 0, Math.PI * 2);
  ctx.stroke();

  // Inner jewel — dark charcoal
  ctx.shadowBlur  = dragging ? 10 : 6;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.fillStyle   = dragging ? '#1e293b' : '#475569';
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
  ctx.font      = '10px monospace';
  ctx.textAlign = 'center';

  // All canonical markers + golden ratio, always shown
  const markers: { pos: number; label: string }[] = [];
  for (const cr of CANONICAL_RATIOS.slice(0, 9)) {
    markers.push({ pos: cr.position, label: cr.symbol });
    markers.push({ pos: 1 - cr.position, label: cr.symbol });
  }
  markers.push({ pos: GOLDEN_POSITION, label: 'φ' });

  for (const { pos, label } of markers) {
    const x = pos * w;
    const nearBridge = Math.abs(pos - bridgePos) < 0.016;
    const alpha = nearBridge ? 0.55 : 0.28;

    // Solid tick lines (more prominent)
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth   = nearBridge ? 1.5 : 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, cy - 38);
    ctx.lineTo(x, cy + 38);
    ctx.stroke();

    // Tick caps at top and bottom
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 3, cy - 38);
    ctx.lineTo(x + 3, cy - 38);
    ctx.moveTo(x - 3, cy + 38);
    ctx.lineTo(x + 3, cy + 38);
    ctx.stroke();

    // Label
    ctx.fillStyle = `rgba(0,0,0,${nearBridge ? 0.75 : 0.42})`;
    ctx.font      = nearBridge ? 'bold 10px monospace' : '10px monospace';
    ctx.fillText(label, x, cy - 44);
  }
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────

const MonochordString = forwardRef<MonochordStringHandle, Props>(
  function MonochordString({ bridgePosition, onBridgeChange, leftColor, rightColor, onPluck, onMarkerSnap }, ref) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const s = useRef({
      bridgePos:       bridgePosition,
      leftColor,
      rightColor,
      isDragging:      false,
      leftPluck:       null as PluckState | null,
      rightPluck:      null as PluckState | null,
      animId:          0,
      w:               800,
      lastChangeMs:    0,   // for throttle
    });

    // Sync props → ref each render (canvas reads from ref, not props directly)
    s.current.leftColor  = leftColor;
    s.current.rightColor = rightColor;
    // Only sync bridgePos from props when NOT dragging (during drag we own it)
    if (!s.current.isDragging) s.current.bridgePos = bridgePosition;

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
      const bx  = bridgePos * w;
      const cy  = STRING_Y;
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
        canvas.width  = w;
        canvas.height = CANVAS_H;
        s.current.w   = w;
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
        // Drag the bridge
        s.current.isDragging = true;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else {
        // Check if click is near a canonical marker — if so, snap to it
        const MARKER_HIT_PX = 12;
        const allMarkers: number[] = [];
        for (const cr of CANONICAL_RATIOS.slice(0, 9)) {
          allMarkers.push(cr.position, 1 - cr.position);
        }
        allMarkers.push(GOLDEN_POSITION);

        const snapped = allMarkers.find(pos => Math.abs(pos * s.current.w - px) <= MARKER_HIT_PX);
        if (snapped !== undefined) {
          onMarkerSnap(snapped);
        } else {
          const side = t < s.current.bridgePos ? 'left' : 'right';
          triggerPluck(side);
          onPluck(side);
        }
      }
    }, [getT, triggerPluck, onPluck, onMarkerSnap]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!s.current.isDragging) return;
      const t = getT(e.clientX);

      // Update the ref immediately — canvas always reads from here at 60fps
      s.current.bridgePos = t;

      // Throttle the parent state update that drives the info panel / Lissajous
      const now = Date.now();
      if (now - s.current.lastChangeMs >= THROTTLE_MS) {
        s.current.lastChangeMs = now;
        onBridgeChange(t);
      }
    }, [getT, onBridgeChange]);

    const stopDrag = useCallback(() => {
      if (s.current.isDragging) {
        // Always flush the final position to parent on release
        onBridgeChange(s.current.bridgePos);
      }
      s.current.isDragging = false;
    }, [onBridgeChange]);

    return (
      <div className="w-full relative select-none bg-gray-50">
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
