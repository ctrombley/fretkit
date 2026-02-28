import { useState, useRef, useCallback, useEffect } from 'react';
import { useBottomPadding } from '../hooks/useBottomPadding';
import MonochordString, { type MonochordStringHandle } from './MonochordString';
import LissajousCanvas from './LissajousCanvas';
import {
  CANONICAL_RATIOS,
  FUNDAMENTAL_NOTES,
  DEFAULT_FUNDAMENTAL,
  getBridgeInfo,
  pluckMonochord,
  startDrone,
  stackFifths,
  toIntegerRatio,
  type FundamentalNote,
  type CommaStep,
} from '../lib/monochord';

// ── Types ─────────────────────────────────────────────────────────────────

type DroneState = { leftStop: (() => void) | null; rightStop: (() => void) | null };

// ── Helpers ───────────────────────────────────────────────────────────────

function formatCents(c: number): string {
  return `${c >= 0 ? '+' : ''}${c.toFixed(2)}¢`;
}

function beatLabel(hz: number): string {
  if (hz < 0.05)  return '< 0.05 Hz — nearly pure';
  if (hz < 1)     return `${hz.toFixed(2)} Hz — ghostly slow pulse`;
  if (hz < 6)     return `${hz.toFixed(2)} Hz — perceptible beat`;
  if (hz < 20)    return `${hz.toFixed(1)} Hz — fast roughness`;
  return `${hz.toFixed(0)} Hz — dissonant flutter`;
}

function centsLabel(cents: number): string {
  const et = Math.round(cents / 100) * 100;
  const dev = cents - et;
  return `${cents.toFixed(2)}¢  (${formatCents(dev)} from ET)`;
}

// ── Comma visualiser ──────────────────────────────────────────────────────

function CommaStacker({ fundHz }: { fundHz: number }) {
  const [steps, setSteps]   = useState(0);
  const [playing, setPlaying] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stacked: CommaStep[] = steps > 0 ? stackFifths(steps, fundHz) : [];
  const totalDeviation = stacked[stacked.length - 1]?.centsDeviation ?? 0;
  const isComplete = steps === 12;

  function clearTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function playSequence() {
    clearTimeouts();
    setPlaying(true);
    const all = stackFifths(12, fundHz);
    all.forEach((step, i) => {
      const tid = setTimeout(() => {
        setSteps(i + 1);
        pluckMonochord(step.hz, 0.8);
      }, i * 420);
      timeoutsRef.current.push(tid);
    });
    const done = setTimeout(() => setPlaying(false), 12 * 420 + 800);
    timeoutsRef.current.push(done);
  }

  function reset() {
    clearTimeouts();
    setSteps(0);
    setPlaying(false);
  }

  useEffect(() => reset, []); // cleanup on unmount

  const COMMA_CENTS = 23.46;

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs text-amber-400/70 font-mono uppercase tracking-widest">
            The Pythagorean Comma
          </span>
          <p className="text-xs text-white/35 mt-0.5 max-w-sm">
            Stack 12 perfect fifths (3:2). You should arrive back at the starting pitch.
            You won't.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={playSequence}
            disabled={playing}
            className="px-3 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
          >
            {playing ? 'Playing…' : 'Play All'}
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 rounded text-xs font-medium bg-white/8 text-white/50 hover:bg-white/12 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Step buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const done = n <= steps;
          const step = stacked[i];
          return (
            <button
              key={n}
              onClick={() => {
                if (!step) return;
                setSteps(n);
                pluckMonochord(step.hz, 1.2);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                done
                  ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/30'
                  : 'bg-white/6 text-white/30 hover:bg-white/10 hover:text-white/50'
              }`}
            >
              {CANONICAL_RATIOS[0]?.name && n}{/* just for n */}
              {n}× {stacked[i] ? stacked[i]!.label : '—'}
            </button>
          );
        })}
      </div>

      {/* Comma bar */}
      {steps > 0 && (
        <div className="space-y-2">
          {/* Progress bar showing deviation accumulation */}
          <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (Math.abs(totalDeviation) / COMMA_CENTS) * 100)}%`,
                background: `hsl(${40 - (Math.abs(totalDeviation) / COMMA_CENTS) * 40}deg 80% 55%)`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/40 font-mono">
            <span>
              After {steps} fifth{steps > 1 ? 's' : ''}:{' '}
              <span className={totalDeviation > 0 ? 'text-amber-300' : 'text-blue-300'}>
                {formatCents(totalDeviation)} deviation
              </span>
            </span>
            {isComplete && (
              <span className="text-red-400/80">
                ≈ {COMMA_CENTS}¢ — the comma
              </span>
            )}
          </div>

          {isComplete && (
            <p className="text-xs text-white/30 max-w-md font-mono leading-relaxed border-l-2 border-red-400/30 pl-3">
              After 12 perfect fifths, you are{' '}
              <span className="text-red-300">{COMMA_CENTS}¢ sharp</span> of where you started.
              The circle never closes. Every tuning system since Pythagoras has
              been an attempt to hide this gap.
            </p>
          )}

          {/* Step list */}
          <div className="grid grid-cols-6 gap-1 mt-1">
            {stacked.map(step => (
              <div
                key={step.n}
                className="text-center py-1 rounded bg-white/4 cursor-pointer hover:bg-white/8"
                onClick={() => pluckMonochord(step.hz, 0.9)}
              >
                <div className="text-xs font-bold text-amber-300">{step.label}</div>
                <div className="text-xs font-mono text-white/30">
                  {step.centsDeviation >= 0 ? '+' : ''}{step.centsDeviation.toFixed(1)}¢
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function MonochordView() {
  const bottomPadding = useBottomPadding();

  // Core state
  const [fundamental, setFundamental] = useState<FundamentalNote>(DEFAULT_FUNDAMENTAL);
  const [bridgePos, setBridgePos]     = useState(2 / 3);   // start at Perfect Fifth
  const [droneOn, setDroneOn]         = useState(false);
  const [showComma, setShowComma]     = useState(false);

  // Refs
  const stringRef  = useRef<MonochordStringHandle>(null);
  const droneRef   = useRef<DroneState>({ leftStop: null, rightStop: null });
  const plucksRef  = useRef<{ stop: () => void }[]>([]);

  // Derived
  const info = getBridgeInfo(bridgePos, fundamental.hz, fundamental.pitchClass);

  // Lissajous p:q from bridge position (ratio of the two segments)
  const rawRatio = bridgePos / (1 - bridgePos);       // rightHz/leftHz direction
  const clampedR = rawRatio > 1 ? rawRatio : 1 / rawRatio;
  const [lisP, lisQ] = toIntegerRatio(Math.min(clampedR, 16), 12);

  // ── Audio helpers ──────────────────────────────────────────────────────

  function stopAllPlucks() {
    plucksRef.current.forEach(h => h.stop());
    plucksRef.current = [];
  }

  function stopDrones() {
    droneRef.current.leftStop?.();
    droneRef.current.rightStop?.();
    droneRef.current = { leftStop: null, rightStop: null };
  }

  const handlePluck = useCallback((side: 'left' | 'right' | 'both') => {
    stopAllPlucks();
    if (side === 'left'  || side === 'both') plucksRef.current.push({ stop: pluckMonochord(info.left.hz) });
    if (side === 'right' || side === 'both') plucksRef.current.push({ stop: pluckMonochord(info.right.hz) });
  }, [info.left.hz, info.right.hz]);

  function pluckBoth() {
    stringRef.current?.pluck('both');
    handlePluck('both');
  }

  function pluckLeft() {
    stringRef.current?.pluck('left');
    handlePluck('left');
  }

  function pluckRight() {
    stringRef.current?.pluck('right');
    handlePluck('right');
  }

  // ── Drone toggle ───────────────────────────────────────────────────────

  useEffect(() => {
    if (droneOn) {
      stopDrones();
      droneRef.current.leftStop  = startDrone(info.left.hz);
      droneRef.current.rightStop = startDrone(info.right.hz);
    } else {
      stopDrones();
    }
    // Cleanup on unmount or when drone turns off
    return stopDrones;
  }, [droneOn, info.left.hz, info.right.hz]);

  // Stop everything on unmount
  useEffect(() => () => { stopAllPlucks(); stopDrones(); }, []);

  // ── Snap to canonical ratio ────────────────────────────────────────────

  function snapTo(position: number) {
    setBridgePos(position);
    // Slight delay so visual updates first
    setTimeout(() => {
      stringRef.current?.pluck('both');
      const i = getBridgeInfo(position, fundamental.hz, fundamental.pitchClass);
      stopAllPlucks();
      plucksRef.current.push({ stop: pluckMonochord(i.left.hz) });
      plucksRef.current.push({ stop: pluckMonochord(i.right.hz) });
    }, 30);
  }

  // ── Fundamental change ─────────────────────────────────────────────────

  function changeFundamental(fn: FundamentalNote) {
    stopAllPlucks();
    if (droneOn) { stopDrones(); setDroneOn(false); }
    setFundamental(fn);
  }

  // ── Layout ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0e0d18', paddingBottom: bottomPadding }}
    >
      {/* ── Title bar ──────────────────────────────────────────────────── */}
      <div className="pt-20 pb-0 px-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#f5f0e0' }}>
            The Monochord
          </h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(245,240,224,0.35)' }}>
            "There is geometry in the humming of the strings." — Pythagoras, ~530 BCE
          </p>
        </div>

        {/* Fundamental selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Fundamental
          </span>
          <select
            value={fundamental.name}
            onChange={e => {
              const fn = FUNDAMENTAL_NOTES.find(n => n.name === e.target.value);
              if (fn) changeFundamental(fn);
            }}
            className="text-sm rounded px-2 py-1 font-mono border-0 outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: '#f5f0e0',
            }}
          >
            {FUNDAMENTAL_NOTES.map(fn => (
              <option key={fn.name} value={fn.name}
                style={{ background: '#1a1930', color: '#f5f0e0' }}>
                {fn.name}  ({fn.hz.toFixed(1)} Hz)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── String ─────────────────────────────────────────────────────── */}
      <div
        className="mt-3 px-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <MonochordString
          ref={stringRef}
          bridgePosition={bridgePos}
          onBridgeChange={setBridgePos}
          leftColor={info.left.color}
          rightColor={info.right.color}
          onPluck={handlePluck}
        />
      </div>

      {/* ── Pluck controls ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-3 px-6">
        <button
          onClick={pluckLeft}
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
          style={{
            background: `${info.left.color}22`,
            color: info.left.color,
            border: `1px solid ${info.left.color}44`,
          }}
        >
          ◂ Left  ({info.left.noteName})
        </button>
        <button
          onClick={pluckBoth}
          className="px-4 py-1.5 rounded text-xs font-mono transition-colors"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          Both
        </button>
        <button
          onClick={pluckRight}
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
          style={{
            background: `${info.right.color}22`,
            color: info.right.color,
            border: `1px solid ${info.right.color}44`,
          }}
        >
          Right ▸  ({info.right.noteName})
        </button>
        <button
          onClick={() => setDroneOn(d => !d)}
          className="ml-2 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          style={{
            background: droneOn ? 'rgba(245,200,74,0.18)' : 'rgba(255,255,255,0.05)',
            color:      droneOn ? '#f5c84a'               : 'rgba(255,255,255,0.4)',
            border:     droneOn ? '1px solid rgba(245,200,74,0.4)' : '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {droneOn ? '◉ Drone' : '○ Drone'}
        </button>
      </div>

      {/* ── Main info + Lissajous ──────────────────────────────────────── */}
      <div className="mt-5 px-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Left panel: ratio info + canonical buttons ──────────────── */}
        <div className="space-y-5">
          {/* Big ratio display */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Segment-to-segment interval (the headline) */}
            <div className="text-center mb-3">
              <div
                className="text-5xl font-bold tracking-tight leading-none"
                style={{ fontFamily: 'Georgia, serif', color: '#f5f0e0' }}
              >
                {info.segmentRatioStr}
              </div>
              <div className="text-base mt-1 font-medium" style={{ color: 'rgba(245,240,224,0.55)' }}>
                {info.segmentIntervalName}
              </div>
              {info.nearestCanonical && (
                <div
                  className="text-xs mt-1 font-mono px-2 py-0.5 rounded-full inline-block"
                  style={{ background: 'rgba(245,200,74,0.12)', color: '#f5c84a' }}
                >
                  {info.nearestCanonical.symbol} — {info.nearestCanonical.name}
                </div>
              )}
            </div>

            <div
              className="border-t pt-3 mt-2 grid grid-cols-2 gap-2"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Left segment info */}
              <div className="space-y-0.5">
                <div className="text-xs font-mono" style={{ color: info.left.color }}>
                  ◂ Left — {info.left.noteName}
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {info.left.ratioStr} above root
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {info.left.hz.toFixed(2)} Hz
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {centsLabel(info.left.cents)}
                </div>
              </div>

              {/* Right segment info */}
              <div className="space-y-0.5 text-right">
                <div className="text-xs font-mono" style={{ color: info.right.color }}>
                  {info.right.noteName} — Right ▸
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {info.right.ratioStr} above root
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {info.right.hz.toFixed(2)} Hz
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {centsLabel(info.right.cents)}
                </div>
              </div>
            </div>

            {/* Beat frequency */}
            <div
              className="mt-3 pt-3 border-t text-center"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Beat: {beatLabel(info.beatHz)}
              </span>
            </div>

            {/* Nearest canonical description */}
            {info.nearestCanonical && (
              <div
                className="mt-2 text-xs font-mono text-center"
                style={{ color: 'rgba(245,200,74,0.5)' }}
              >
                {info.nearestCanonical.description}
              </div>
            )}
          </div>

          {/* Canonical ratio buttons */}
          <div>
            <div className="text-xs font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Canonical Positions
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CANONICAL_RATIOS.map(cr => {
                const near = Math.abs(bridgePos - cr.position) < 0.015
                          || Math.abs(bridgePos - (1 - cr.position)) < 0.015;
                return (
                  <button
                    key={cr.symbol}
                    onClick={() => snapTo(cr.position)}
                    className="rounded py-2 px-1 text-center transition-all"
                    style={{
                      background: near
                        ? 'rgba(245,200,74,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      border: near
                        ? '1px solid rgba(245,200,74,0.40)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: near ? '#f5c84a' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <div className="text-xs font-bold font-mono">{cr.symbol}</div>
                    <div className="text-xs leading-tight" style={{ fontSize: '0.65rem', color: near ? 'rgba(245,200,74,0.7)' : 'rgba(255,255,255,0.3)' }}>
                      {cr.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel: Lissajous + comma ─────────────────────────── */}
        <div className="flex flex-col items-center gap-5">
          {/* Lissajous figure */}
          <div className="text-center">
            <div className="text-xs font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Lissajous Figure — {lisP}:{lisQ}
            </div>
            <div
              className="inline-block rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <LissajousCanvas
                p={lisP}
                q={lisQ}
                size={200}
                label={`${lisP}:${lisQ}`}
              />
            </div>
            <p className="text-xs mt-2 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
              When two frequencies in ratio {lisP}:{lisQ} are plotted against each other,
              this is the geometry of their relationship.
            </p>
          </div>

          {/* Bridge position readout */}
          <div
            className="w-full rounded-lg p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Bridge Position
            </div>
            <div className="text-lg font-mono mt-0.5" style={{ color: '#f5f0e0' }}>
              {(bridgePos * 100).toFixed(1)}%
            </div>
            <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Left {(bridgePos * 100).toFixed(0)}% · Right {((1 - bridgePos) * 100).toFixed(0)}%
            </div>
          </div>

          {/* Comma toggle */}
          <button
            onClick={() => setShowComma(v => !v)}
            className="w-full py-2 rounded-lg text-xs font-mono transition-colors"
            style={{
              background: showComma ? 'rgba(245,100,74,0.12)' : 'rgba(255,255,255,0.04)',
              color:      showComma ? '#f59342'               : 'rgba(255,255,255,0.4)',
              border:     showComma ? '1px solid rgba(245,100,74,0.30)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {showComma ? '▾' : '▸'} Pythagorean Comma — The Circle That Never Closes
          </button>
        </div>
      </div>

      {/* ── Comma stacker ─────────────────────────────────────────────── */}
      {showComma && (
        <div
          className="mx-6 mt-4 rounded-xl p-5"
          style={{ background: 'rgba(255,80,50,0.04)', border: '1px solid rgba(245,100,74,0.14)' }}
        >
          <CommaStacker fundHz={fundamental.hz} />
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <div className="mt-8 pb-4 px-6 text-center">
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.12)', lineHeight: 1.8 }}>
          Drag the bridge to divide the string · Click either segment to pluck it ·
          Faint markers show canonical harmonic positions · φ marks the irrational golden ratio
        </p>
      </div>
    </div>
  );
}
