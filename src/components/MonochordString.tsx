import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CANONICAL_RATIOS, GOLDEN_POSITION } from '../lib/monochord';
import { getPitchClassColor } from '../lib/noteColors';
import type { ScalePin } from '../lib/monochordScales';

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
  fundPitchClass: number;
  scalePins: ScalePin[];
  onPluck: (side: 'left' | 'right' | 'both') => void;
  onMarkerSnap: (position: number) => void;
  onSaveTone: (pos: number) => void;
  onScalePinSnap: (pin: ScalePin) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────

const CANVAS_H       = 200;   // 190 string area + 10 zoom strip
const STRING_Y       = 95;
const BRIDGE_HIT_R   = 14;
const PLUCK_MS       = 4300;
const VISUAL_HZ      = 3.5;
const MIN_POS        = 0.04;
const MAX_POS        = 0.96;
const THROTTLE_MS    = 32;
const ZOOM_STRIP_H   = 10;
const ZOOM_MIN_RANGE = 0.04;   // minimum visible fraction
const ZOOM_STEP      = 1.28;   // zoom factor per scroll tick
const PAN_THRESH_PX  = 5;      // px before drag becomes pan instead of pluck
const KBD_PAN_FRAC   = 0.15;   // fraction of visible range moved per arrow key

// Harmonic overlay
const HARM_BASE_HZ   = 0.22;
const HARM_FAST_HZ   = 2.8;
const HARM_ALPHA_OFF = 0.12;
const HARM_ALPHA_HOV = 0.25;
const HARM_PLUCK_MAX = 0.35;
const HARM_PLUCK_DCY = 500;
const HARM_MAX_AMP   = 34;
const HARM_HI_SIGMA  = 0.018;

// Ghost markers
const GHOST_BASE_N   = 9;     // max n at full-zoom view
const GHOST_MAX_N    = 64;    // hard cap
const GHOST_HOV_MULT = 3;     // extra harmonics from hover

// Fog-of-war layer (markers beyond zoomBasedN)
const FOG_BASE_ALPHA = 0.045; // always-visible very faint hint
const FOG_HOVER_MAX  = 0.18;  // max alpha when hovering close
const FOG_LINE_W     = 0.5;
const FOG_HOV_PX     = 60;    // hover reveal radius

// Scale pin hit radius
const SCALE_HIT_PX   = 11;
// Marker snap hit radius
const MARKER_HIT_PX  = 10;

// ── Coordinate helpers ─────────────────────────────────────────────────────

function fracToX(frac: number, zMin: number, zMax: number, w: number): number {
  return ((frac - zMin) / (zMax - zMin)) * w;
}

function xToFrac(px: number, zMin: number, zMax: number, w: number): number {
  return zMin + (px / w) * (zMax - zMin);
}

// ── Drawing helpers ────────────────────────────────────────────────────────

function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, y: number, color: string,
) {
  if (x1 <= x0) return;
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
  amplitude: number, color: string, elapsedMs: number,
  xRelStart = 0, xRelEnd = 1,
) {
  const segLen    = x1 - x0;
  const xRelRange = xRelEnd - xRelStart;
  if (segLen < 2 || xRelRange <= 0) return;

  const maxAmp = Math.min((segLen / xRelRange) * 0.14, 46);
  const phase  = (elapsedMs / 1000) * VISUAL_HZ * 2 * Math.PI;
  const steps  = Math.ceil(segLen);

  ctx.save();
  ctx.shadowBlur  = 16;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t    = i / steps;
    const x    = x0 + t * segLen;
    const xRel = xRelStart + t * xRelRange;
    const y    = baseY + amplitude * maxAmp * Math.sin(Math.PI * xRel) * Math.cos(phase);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  bx: number, cy: number, dragging: boolean,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.13)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(bx, cy - 44);
  ctx.lineTo(bx, cy + 44);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.shadowBlur  = dragging ? 12 : 7;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.strokeStyle = dragging ? 'rgba(30,41,59,0.7)' : 'rgba(100,116,139,0.5)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(bx, cy, dragging ? 13 : 11, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur  = dragging ? 10 : 6;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.fillStyle   = dragging ? '#1e293b' : '#475569';
  ctx.beginPath();
  ctx.arc(bx, cy, dragging ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function findBestHarmonic(t: number): { n: number; k: number; prox: number } {
  let bestN = 2, bestK = 1, bestDist = Infinity;
  for (let n = 2; n <= 8; n++) {
    for (let k = 1; k < n; k++) {
      const dist = Math.abs(t - k / n);
      if (dist < bestDist) { bestDist = dist; bestN = n; bestK = k; }
    }
  }
  return { n: bestN, k: bestK, prox: Math.exp(-((bestDist / HARM_HI_SIGMA) ** 2)) };
}

function drawHarmonics(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number,
  xRelStart: number, xRelEnd: number,
  baseY: number, color: string, nowMs: number,
  hoverX: number | null, pluck: PluckState | null,
  highlightN: number, highlightColor: string, highlightProx: number,
) {
  const segLen    = x1 - x0;
  const xRelRange = xRelEnd - xRelStart;
  if (segLen < 2 || xRelRange <= 0) return;

  const isHovered  = hoverX !== null && hoverX >= x0 && hoverX <= x1;
  const pluckBoost = pluck
    ? HARM_PLUCK_MAX * Math.exp(-(nowMs - pluck.startMs) / HARM_PLUCK_DCY)
    : 0;
  const baseAlpha  = isHovered ? HARM_ALPHA_HOV : HARM_ALPHA_OFF;
  const showHi     = highlightProx > 0.05 && highlightN >= 1 && highlightN <= 8;

  const physLen = segLen / xRelRange;

  ctx.save();

  for (let n = 1; n <= 8; n++) {
    if (showHi && n === highlightN) continue;
    const alpha = Math.min((baseAlpha + pluckBoost) / Math.sqrt(n), 0.55);
    if (alpha < 0.008) continue;

    const amp   = (HARM_MAX_AMP / Math.sqrt(n)) * Math.min(physLen / 200, 1);
    const phase = (nowMs / 1000) * HARM_BASE_HZ * n * 2 * Math.PI;
    const steps = Math.max(Math.ceil(segLen / 3), 32);

    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth   = Math.max(1.0, 2.2 - n * 0.15);
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t    = i / steps;
      const x    = x0 + t * segLen;
      const xRel = xRelStart + t * xRelRange;
      const y    = baseY + amp * Math.sin(n * Math.PI * xRel) * Math.cos(phase);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  if (showHi) {
    const n     = highlightN;
    const alpha = Math.min(baseAlpha / Math.sqrt(n) + highlightProx * 0.65 + pluckBoost, 0.88);
    const amp   = (HARM_MAX_AMP / Math.sqrt(n)) * Math.min(physLen / 200, 1) * (1 + highlightProx * 0.55);
    const phase = (nowMs / 1000) * HARM_FAST_HZ * n * 2 * Math.PI;
    const steps = Math.max(Math.ceil(segLen / 3), 48);

    ctx.strokeStyle = highlightColor;
    ctx.globalAlpha = alpha;
    ctx.lineWidth   = Math.max(1.5, 3.2 - n * 0.15);
    ctx.shadowBlur  = 14 * highlightProx;
    ctx.shadowColor = highlightColor;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t    = i / steps;
      const x    = x0 + t * segLen;
      const xRel = xRelStart + t * xRelRange;
      const y    = baseY + amp * Math.sin(n * Math.PI * xRel) * Math.cos(phase);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawGhostMarkers(
  ctx: CanvasRenderingContext2D,
  w: number, cy: number, bridgePos: number,
  zMin: number, zMax: number,
  hoverX: number | null,
) {
  const range      = zMax - zMin;
  const zoomBasedN = Math.min(GHOST_MAX_N, Math.round(GHOST_BASE_N / range));
  // Hover reveals additional markers (but we cap at GHOST_MAX_N for fog)
  const hoverN     = Math.min(GHOST_MAX_N, zoomBasedN * GHOST_HOV_MULT);

  ctx.save();
  ctx.font      = '9px monospace';
  ctx.textAlign = 'center';

  const seen    = new Set<string>();
  const markers: Array<{ pos: number; label: string; n: number; isCanon: boolean }> = [];

  // Canonical set (always shown)
  for (const cr of CANONICAL_RATIOS) {
    for (const pos of [cr.position, 1 - cr.position]) {
      const key = pos.toFixed(7);
      if (!seen.has(key)) {
        seen.add(key);
        markers.push({ pos, label: cr.symbol, n: 0, isCanon: true });
      }
    }
  }
  if (!seen.has(GOLDEN_POSITION.toFixed(7))) {
    markers.push({ pos: GOLDEN_POSITION, label: 'φ', n: 0, isCanon: true });
    seen.add(GOLDEN_POSITION.toFixed(7));
  }

  // Harmonic grid
  for (let n = 2; n <= hoverN; n++) {
    for (let k = 1; k < n; k++) {
      const pos = k / n;
      const key = pos.toFixed(7);
      if (!seen.has(key)) {
        seen.add(key);
        const label = n <= 16 ? `${k}/${n}` : '';
        markers.push({ pos, label, n, isCanon: false });
      }
    }
  }

  for (const { pos, label, n, isCanon } of markers) {
    const x = fracToX(pos, zMin, zMax, w);
    if (x < -4 || x > w + 4) continue;

    const nearBridge = Math.abs(pos - bridgePos) < 0.012 * range;
    const isFog      = !isCanon && n > zoomBasedN;

    // Base visibility
    let baseAlpha: number;
    if (isCanon) {
      baseAlpha = nearBridge ? 0.55 : 0.28;
    } else if (!isFog) {
      baseAlpha = nearBridge ? 0.45 : Math.max(0.05, 0.22 - n * 0.003);
    } else {
      // Fog: always visible at very low opacity — density hint
      baseAlpha = FOG_BASE_ALPHA;
    }

    // Hover proximity
    let hoverAlpha = 0;
    if (hoverX !== null) {
      const dist = Math.abs(x - hoverX);
      if (isFog) {
        // Fog markers: soft reveal, capped at FOG_HOVER_MAX
        if (dist < FOG_HOV_PX * 2.5) {
          hoverAlpha = FOG_HOVER_MAX * Math.exp(-((dist / (FOG_HOV_PX * 0.6)) ** 2));
        }
      } else {
        // Regular markers: full hover boost
        if (dist < 55 * 2.5) {
          hoverAlpha = 0.72 * Math.exp(-((dist / (55 * 0.7)) ** 2));
        }
      }
    }

    const rawAlpha  = (nearBridge ? 1.35 : 1.0) * Math.max(baseAlpha, hoverAlpha);
    const maxAlpha  = isFog ? FOG_HOVER_MAX : 0.82;
    const alpha     = Math.min(maxAlpha, rawAlpha);
    if (alpha < 0.015) continue;

    // Vertical tick
    const lineW = isFog ? FOG_LINE_W : (nearBridge ? 1.5 : (alpha > 0.2 ? 1.0 : 0.5));
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth   = lineW;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, cy - 38);
    ctx.lineTo(x, cy + 38);
    ctx.stroke();

    if (!isFog) {
      // Tick caps
      ctx.lineWidth = alpha > 0.2 ? 1.0 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x - 3, cy - 38); ctx.lineTo(x + 3, cy - 38);
      ctx.moveTo(x - 3, cy + 38); ctx.lineTo(x + 3, cy + 38);
      ctx.stroke();

      // Label
      if (label && (isCanon || alpha > 0.1)) {
        ctx.fillStyle = `rgba(0,0,0,${alpha * (nearBridge ? 1.2 : 1.0)})`;
        ctx.font      = nearBridge ? 'bold 9px monospace' : '9px monospace';
        ctx.fillText(label, x, cy - 44);
      }
    }
  }

  ctx.restore();
}

function drawScalePins(
  ctx: CanvasRenderingContext2D,
  w: number, cy: number,
  pins: ScalePin[],
  zMin: number, zMax: number,
) {
  for (const pin of pins) {
    const x = fracToX(pin.pos, zMin, zMax, w);
    if (x < -8 || x > w + 8) continue;

    ctx.save();
    ctx.globalAlpha = 0.88;

    // Dashed pin line
    ctx.strokeStyle = pin.color;
    ctx.shadowBlur  = 5;
    ctx.shadowColor = pin.color;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, cy - 42);
    ctx.lineTo(x, cy + 42);
    ctx.stroke();
    ctx.setLineDash([]);

    // Diamond cap at top
    ctx.fillStyle  = pin.color;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.moveTo(x,     cy - 52);
    ctx.lineTo(x + 5, cy - 45);
    ctx.lineTo(x,     cy - 38);
    ctx.lineTo(x - 5, cy - 45);
    ctx.closePath();
    ctx.fill();

    // Note label above diamond
    ctx.globalAlpha = 0.75;
    ctx.shadowBlur  = 0;
    ctx.font        = 'bold 8px monospace';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = pin.color;
    ctx.fillText(pin.noteName, x, cy - 57);

    ctx.restore();
  }
}

function drawZoomStrip(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  zMin: number, zMax: number,
  bridgePos: number,
  pins: ScalePin[],
) {
  const y0  = h - ZOOM_STRIP_H;
  const mid = y0 + ZOOM_STRIP_H / 2;

  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(0, y0, w, ZOOM_STRIP_H);

  const wx = zMin * w;
  const ww = (zMax - zMin) * w;
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(wx, y0, ww, ZOOM_STRIP_H);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(wx + 0.5, y0 + 0.5, ww - 1, ZOOM_STRIP_H - 1);

  // Scale pin dots
  ctx.globalAlpha = 0.65;
  for (const pin of pins) {
    ctx.fillStyle = pin.color;
    ctx.beginPath();
    ctx.arc(pin.pos * w, mid, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Bridge dot
  ctx.fillStyle = 'rgba(71,85,105,0.65)';
  ctx.beginPath();
  ctx.arc(bridgePos * w, mid, 3, 0, Math.PI * 2);
  ctx.fill();

  const range = zMax - zMin;
  if (range < 0.96) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.font      = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${(1 / range).toFixed(1)}×`, w - 3, y0 + ZOOM_STRIP_H - 1.5);
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────

const MonochordString = forwardRef<MonochordStringHandle, Props>(
  function MonochordString({
    bridgePosition, onBridgeChange,
    leftColor, rightColor, fundPitchClass,
    scalePins, onPluck, onMarkerSnap, onSaveTone, onScalePinSnap,
  }, ref) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const s = useRef({
      bridgePos:       bridgePosition,
      leftColor,
      rightColor,
      fundPitchClass,
      scalePins,
      isDragging:          false,
      isPanning:           false,
      pointerDownX:        0,
      pointerDownFrac:     0,
      panStartMin:         0,
      panStartMax:         1,
      pointerMoved:        false,
      lastPointerDownMs:   0,
      leftPluck:           null as PluckState | null,
      rightPluck:          null as PluckState | null,
      animId:              0,
      w:                   800,
      lastChangeMs:        0,
      hoverX:              null as number | null,
      zoomMin:             0,
      zoomMax:             1,
    });

    // Sync props → ref each render
    s.current.leftColor      = leftColor;
    s.current.rightColor     = rightColor;
    s.current.fundPitchClass = fundPitchClass;
    s.current.scalePins      = scalePins;
    if (!s.current.isDragging) s.current.bridgePos = bridgePosition;

    // ── Pluck trigger ──────────────────────────────────────────────────

    const triggerPluck = useCallback((side: 'left' | 'right' | 'both') => {
      const now = performance.now();
      const ps: PluckState = { startMs: now, durationMs: PLUCK_MS };
      if (side === 'left'  || side === 'both') s.current.leftPluck  = { ...ps };
      if (side === 'right' || side === 'both') s.current.rightPluck = { ...ps };
    }, []);

    useImperativeHandle(ref, () => ({ pluck: triggerPluck }), [triggerPluck]);

    // ── Draw loop ──────────────────────────────────────────────────────

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const {
        bridgePos, leftColor: lc, rightColor: rc,
        isDragging, w,
        zoomMin: zMin, zoomMax: zMax,
      } = s.current;

      const cy    = STRING_Y;
      const now   = performance.now();
      const bxRaw = fracToX(bridgePos, zMin, zMax, w);

      ctx.clearRect(0, 0, w, CANVAS_H);

      drawGhostMarkers(ctx, w, cy, bridgePos, zMin, zMax, s.current.hoverX);
      drawScalePins(ctx, w, cy, s.current.scalePins, zMin, zMax);

      // Resonant harmonic highlight
      const { n: hN, k: hK, prox: hProx } = findBestHarmonic(bridgePos);
      const hPc    = ((s.current.fundPitchClass + Math.round(12 * Math.log2(hN))) % 12 + 12) % 12;
      const hColor = getPitchClassColor(hPc);

      const lp = s.current.leftPluck;
      const rp = s.current.rightPluck;

      // ── Left segment ────────────────────────────────────────────────
      {
        const visFracStart = zMin;
        const visFracEnd   = Math.min(bridgePos, zMax);
        if (visFracEnd > visFracStart && bridgePos > 0.001) {
          const x0   = 0;
          const x1   = Math.max(0, Math.min(w, fracToX(visFracEnd, zMin, zMax, w)));
          const relS = visFracStart / bridgePos;
          const relE = visFracEnd   / bridgePos;
          drawHarmonics(ctx, x0, x1, relS, relE, cy, lc, now, s.current.hoverX, lp, hK, hColor, hProx);
          if (lp) {
            const elapsed = now - lp.startMs;
            const amp     = Math.exp(-elapsed / (lp.durationMs * 0.30));
            if (amp > 0.004) {
              drawWave(ctx, x0, x1, cy, amp, lc, elapsed, relS, relE);
            } else {
              s.current.leftPluck = null;
              drawGlowLine(ctx, x0, x1, cy, lc);
            }
          } else {
            drawGlowLine(ctx, x0, x1, cy, lc);
          }
        }
      }

      // ── Right segment ───────────────────────────────────────────────
      {
        const rightSegLen  = 1 - bridgePos;
        const visFracStart = Math.max(bridgePos, zMin);
        const visFracEnd   = zMax;
        if (visFracEnd > visFracStart && rightSegLen > 0.001) {
          const x0   = Math.max(0, Math.min(w, fracToX(visFracStart, zMin, zMax, w)));
          const x1   = w;
          const relS = (visFracStart - bridgePos) / rightSegLen;
          const relE = (visFracEnd   - bridgePos) / rightSegLen;
          drawHarmonics(ctx, x0, x1, relS, relE, cy, rc, now, s.current.hoverX, rp, hN - hK, hColor, hProx);
          if (rp) {
            const elapsed = now - rp.startMs;
            const amp     = Math.exp(-elapsed / (rp.durationMs * 0.30));
            if (amp > 0.004) {
              drawWave(ctx, x0, x1, cy, amp, rc, elapsed, relS, relE);
            } else {
              s.current.rightPluck = null;
              drawGlowLine(ctx, x0, x1, cy, rc);
            }
          } else {
            drawGlowLine(ctx, x0, x1, cy, rc);
          }
        }
      }

      // Bridge (only when on screen)
      if (bxRaw >= -BRIDGE_HIT_R && bxRaw <= w + BRIDGE_HIT_R) {
        drawBridge(ctx, Math.max(0, Math.min(w, bxRaw)), cy, isDragging);
      }

      drawZoomStrip(ctx, w, CANVAS_H, zMin, zMax, bridgePos, s.current.scalePins);

      s.current.animId = requestAnimationFrame(draw);
    }, []);

    // ── Resize observer ────────────────────────────────────────────────

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

    // ── RAF loop ───────────────────────────────────────────────────────

    useEffect(() => {
      s.current.animId = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(s.current.animId);
    }, [draw]);

    // ── Coordinate helpers ─────────────────────────────────────────────

    const getCanvasX = useCallback((clientX: number): number => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return (clientX - rect.left) / rect.width * s.current.w;
    }, []);

    const getT = useCallback((clientX: number): number => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return 0.5;
      const cf = (clientX - rect.left) / rect.width;
      const { zoomMin, zoomMax } = s.current;
      return Math.max(MIN_POS, Math.min(MAX_POS, zoomMin + cf * (zoomMax - zoomMin)));
    }, []);

    // Returns the fraction of a snap-able marker near canvasX, or undefined.
    // Scale pins are always snap-able regardless of zoom depth.
    const findSnapPos = (canvasX: number): number | undefined => {
      const { zoomMin: zMin, zoomMax: zMax, w } = s.current;
      const range      = zMax - zMin;
      const zoomBasedN = Math.min(GHOST_MAX_N, Math.round(GHOST_BASE_N / range));

      // Scale pins: always snap-able
      for (const pin of s.current.scalePins) {
        const px = fracToX(pin.pos, zMin, zMax, w);
        if (px >= 0 && px <= w && Math.abs(px - canvasX) <= SCALE_HIT_PX) {
          return pin.pos;
        }
      }

      // Ghost markers: only up to zoomBasedN
      const candidates: number[] = [];
      for (const cr of CANONICAL_RATIOS) {
        candidates.push(cr.position, 1 - cr.position);
      }
      candidates.push(GOLDEN_POSITION);
      for (let n = 2; n <= zoomBasedN; n++) {
        for (let k = 1; k < n; k++) candidates.push(k / n);
      }

      return candidates.find(pos => {
        const mx = fracToX(pos, zMin, zMax, w);
        return mx >= 0 && mx <= w && Math.abs(mx - canvasX) <= MARKER_HIT_PX;
      });
    };

    // ── Pointer events ─────────────────────────────────────────────────

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const cx  = getCanvasX(e.clientX);
      const t   = getT(e.clientX);
      const bxR = fracToX(s.current.bridgePos, s.current.zoomMin, s.current.zoomMax, s.current.w);

      s.current.hoverX = cx;

      // Double-click on empty area → reset zoom
      const now = Date.now();
      const isDouble = now - s.current.lastPointerDownMs < 300;
      s.current.lastPointerDownMs = now;
      if (isDouble) {
        const isZoomed = s.current.zoomMax - s.current.zoomMin < 0.98;
        if (isZoomed && Math.abs(cx - bxR) > BRIDGE_HIT_R) {
          s.current.zoomMin = 0;
          s.current.zoomMax = 1;
          return;
        }
      }

      // 1. Bridge drag
      if (Math.abs(cx - bxR) <= BRIDGE_HIT_R) {
        s.current.isDragging = true;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        return;
      }

      // 2. Scale pin tap
      const hitPin = s.current.scalePins.find(pin => {
        const px = fracToX(pin.pos, s.current.zoomMin, s.current.zoomMax, s.current.w);
        return Math.abs(px - cx) <= SCALE_HIT_PX;
      });
      if (hitPin) {
        onScalePinSnap(hitPin);
        return;
      }

      // 3. Marker snap
      const snapped = findSnapPos(cx);
      if (snapped !== undefined) {
        onMarkerSnap(snapped);
        return;
      }

      // 4. Empty area — start pan/pluck
      s.current.pointerDownX    = cx;
      s.current.pointerDownFrac = t;
      s.current.pointerMoved    = false;
      s.current.isPanning       = false;
      s.current.panStartMin     = s.current.zoomMin;
      s.current.panStartMax     = s.current.zoomMax;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }, [getCanvasX, getT, onMarkerSnap, onScalePinSnap]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        s.current.hoverX = ((e.clientX - rect.left) / rect.width) * s.current.w;
      }

      if (s.current.isDragging) {
        const t = getT(e.clientX);
        s.current.bridgePos = t;
        const now = Date.now();
        if (now - s.current.lastChangeMs >= THROTTLE_MS) {
          s.current.lastChangeMs = now;
          onBridgeChange(t);
        }
        return;
      }

      const cx = s.current.hoverX ?? 0;
      const dx = cx - s.current.pointerDownX;
      if (!s.current.pointerMoved && Math.abs(dx) > PAN_THRESH_PX) {
        s.current.pointerMoved = true;
        s.current.isPanning    = true;
      }
      if (s.current.isPanning) {
        const range = s.current.panStartMax - s.current.panStartMin;
        const dFrac = (dx / s.current.w) * range;
        let newMin  = s.current.panStartMin - dFrac;
        let newMax  = newMin + range;
        if (newMin < 0) { newMin = 0; newMax = range; }
        if (newMax > 1) { newMax = 1; newMin = Math.max(0, 1 - range); }
        s.current.zoomMin = newMin;
        s.current.zoomMax = newMax;
      }
    }, [getT, onBridgeChange]);

    const handlePointerUp = useCallback(() => {
      if (s.current.isDragging) {
        onBridgeChange(s.current.bridgePos);
        s.current.isDragging = false;
        return;
      }
      if (!s.current.pointerMoved) {
        const t    = s.current.pointerDownFrac;
        const side = t < s.current.bridgePos ? 'left' : 'right';
        triggerPluck(side);
        onPluck(side);
      }
      s.current.isPanning    = false;
      s.current.pointerMoved = false;
    }, [onBridgeChange, triggerPluck, onPluck]);

    const handlePointerLeave = useCallback(() => {
      if (s.current.isDragging) {
        onBridgeChange(s.current.bridgePos);
        s.current.isDragging = false;
      }
      s.current.isPanning    = false;
      s.current.pointerMoved = false;
      s.current.hoverX       = null;
    }, [onBridgeChange]);

    // ── Wheel: zoom (vertical) or pan (horizontal / shift) ────────────

    const handleWheel = useCallback((e: WheelEvent) => {
      e.preventDefault();
      const { zoomMin: zMin, zoomMax: zMax, w } = s.current;

      // Horizontal scroll (trackpad) or shift+scroll → pan
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        const range = zMax - zMin;
        const delta = (e.shiftKey ? e.deltaY : e.deltaX);
        const dFrac = (delta / w) * range * 0.8;
        let newMin  = zMin + dFrac;
        let newMax  = zMax + dFrac;
        if (newMin < 0) { newMin = 0; newMax = range; }
        if (newMax > 1) { newMax = 1; newMin = Math.max(0, 1 - range); }
        s.current.zoomMin = newMin;
        s.current.zoomMax = newMax;
        return;
      }

      // Vertical scroll → zoom. When already zoomed in, don't allow zooming out.
      const isZoomed = (zMax - zMin) < 0.99;
      if (isZoomed && e.deltaY > 0) return;  // prevent undoing the zoom

      const cx         = s.current.hoverX ?? w / 2;
      const mt         = xToFrac(cx, zMin, zMax, w);
      const factor     = e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const newRange   = Math.max(ZOOM_MIN_RANGE, Math.min(1, (zMax - zMin) * factor));
      const cursorFrac = cx / w;
      let   newMin     = mt - cursorFrac * newRange;
      let   newMax     = newMin + newRange;
      if (newMin < 0) { newMin = 0; newMax = newRange; }
      if (newMax > 1) { newMax = 1; newMin = Math.max(0, 1 - newRange); }
      s.current.zoomMin = newMin;
      s.current.zoomMax = newMax;
    }, []);

    // Register wheel as non-passive so preventDefault() actually works
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // ── Keyboard: arrow keys pan; enter/space pluck ────────────────────

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const { zoomMin: zMin, zoomMax: zMax } = s.current;
      const range = zMax - zMin;
      // Only handle pan if zoomed in
      if (range >= 0.99) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir    = e.key === 'ArrowLeft' ? -1 : 1;
        const dFrac  = dir * KBD_PAN_FRAC * range;
        let newMin   = zMin + dFrac;
        let newMax   = zMax + dFrac;
        if (newMin < 0) { newMin = 0; newMax = range; }
        if (newMax > 1) { newMax = 1; newMin = Math.max(0, 1 - range); }
        s.current.zoomMin = newMin;
        s.current.zoomMax = newMax;
      }
    }, []);

    // ── Right-click: save tone ─────────────────────────────────────────

    const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      onSaveTone(s.current.bridgePos);
    }, [onSaveTone]);

    // Cursor: 'grab' when zoomed in over empty area, 'ew-resize' for bridge
    const isZoomed = s.current.zoomMax - s.current.zoomMin < 0.98;
    const cursor   = s.current.isDragging ? 'grabbing' : (isZoomed ? 'grab' : 'ew-resize');

    return (
      <div className="w-full relative select-none bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={CANVAS_H}
          className="w-full"
          style={{ display: 'block', cursor, touchAction: 'none' }}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
        />
      </div>
    );
  },
);

export default MonochordString;
