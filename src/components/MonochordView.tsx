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
  if (hz < 0.05) return '< 0.05 Hz — nearly pure';
  if (hz < 1)    return `${hz.toFixed(2)} Hz — ghostly slow pulse`;
  if (hz < 6)    return `${hz.toFixed(2)} Hz — perceptible beat`;
  if (hz < 20)   return `${hz.toFixed(1)} Hz — fast roughness`;
  return `${hz.toFixed(0)} Hz — dissonant flutter`;
}

function centsLabel(cents: number): string {
  const et  = Math.round(cents / 100) * 100;
  const dev = cents - et;
  return `${cents.toFixed(2)}¢  (${formatCents(dev)} from ET)`;
}

// ── Comma visualiser ──────────────────────────────────────────────────────

function CommaStacker({ fundHz }: { fundHz: number }) {
  const [steps, setSteps]     = useState(0);
  const [playing, setPlaying] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stacked: CommaStep[] = steps > 0 ? stackFifths(steps, fundHz) : [];
  const totalDeviation = stacked[stacked.length - 1]?.centsDeviation ?? 0;
  const isComplete     = steps === 12;

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
          <span className="text-xs text-amber-600 font-mono uppercase tracking-widest">
            The Pythagorean Comma
          </span>
          <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
            Stack 12 perfect fifths (3:2). You should arrive back at the starting pitch.
            You won't.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={playSequence}
            disabled={playing}
            className="px-3 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40 transition-colors"
          >
            {playing ? 'Playing…' : 'Play All'}
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Step buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Array.from({ length: 12 }, (_, i) => {
          const n    = i + 1;
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
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
            >
              {n}× {stacked[i] ? stacked[i]!.label : '—'}
            </button>
          );
        })}
      </div>

      {/* Comma bar */}
      {steps > 0 && (
        <div className="space-y-2">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (Math.abs(totalDeviation) / COMMA_CENTS) * 100)}%`,
                background: `hsl(${40 - (Math.abs(totalDeviation) / COMMA_CENTS) * 40}deg 70% 50%)`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>
              After {steps} fifth{steps > 1 ? 's' : ''}:{' '}
              <span className={totalDeviation > 0 ? 'text-amber-600' : 'text-blue-600'}>
                {formatCents(totalDeviation)} deviation
              </span>
            </span>
            {isComplete && (
              <span className="text-red-500">≈ {COMMA_CENTS}¢ — the comma</span>
            )}
          </div>

          {isComplete && (
            <p className="text-xs text-gray-500 max-w-md font-mono leading-relaxed border-l-2 border-red-300 pl-3">
              After 12 perfect fifths, you are{' '}
              <span className="text-red-600">{COMMA_CENTS}¢ sharp</span> of where you started.
              The circle never closes. Every tuning system since Pythagoras has
              been an attempt to hide this gap.
            </p>
          )}

          {/* Step grid */}
          <div className="grid grid-cols-6 gap-1 mt-1">
            {stacked.map(step => (
              <div
                key={step.n}
                className="text-center py-1 rounded bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => pluckMonochord(step.hz, 0.9)}
              >
                <div className="text-xs font-bold text-amber-600">{step.label}</div>
                <div className="text-xs font-mono text-gray-400">
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

  const [fundamental, setFundamental] = useState<FundamentalNote>(DEFAULT_FUNDAMENTAL);
  const [bridgePos, setBridgePos]     = useState(2 / 3);
  const [droneOn, setDroneOn]         = useState(false);
  const [showComma, setShowComma]     = useState(false);

  const stringRef = useRef<MonochordStringHandle>(null);
  const droneRef  = useRef<DroneState>({ leftStop: null, rightStop: null });
  const plucksRef = useRef<{ stop: () => void }[]>([]);

  const info = getBridgeInfo(bridgePos, fundamental.hz, fundamental.pitchClass);

  // Lissajous p:q from bridge position
  const rawRatio = bridgePos / (1 - bridgePos);
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

  function pluckBoth()  { stringRef.current?.pluck('both');  handlePluck('both');  }
  function pluckLeft()  { stringRef.current?.pluck('left');  handlePluck('left');  }
  function pluckRight() { stringRef.current?.pluck('right'); handlePluck('right'); }

  // ── Drone ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (droneOn) {
      stopDrones();
      droneRef.current.leftStop  = startDrone(info.left.hz);
      droneRef.current.rightStop = startDrone(info.right.hz);
    } else {
      stopDrones();
    }
    return stopDrones;
  }, [droneOn, info.left.hz, info.right.hz]);

  useEffect(() => () => { stopAllPlucks(); stopDrones(); }, []);

  // ── Snap to canonical ratio ────────────────────────────────────────────

  function snapTo(position: number) {
    setBridgePos(position);
    setTimeout(() => {
      stringRef.current?.pluck('both');
      const i = getBridgeInfo(position, fundamental.hz, fundamental.pitchClass);
      stopAllPlucks();
      plucksRef.current.push({ stop: pluckMonochord(i.left.hz) });
      plucksRef.current.push({ stop: pluckMonochord(i.right.hz) });
    }, 30);
  }

  function changeFundamental(fn: FundamentalNote) {
    stopAllPlucks();
    if (droneOn) { stopDrones(); setDroneOn(false); }
    setFundamental(fn);
  }

  // ── Layout ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: bottomPadding }}>

      {/* ── Title bar ──────────────────────────────────────────────────── */}
      <div className="pt-20 pb-0 px-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-dark">The Monochord</h2>
          <p className="text-xs mt-0.5 font-mono text-gray-400">
            "There is geometry in the humming of the strings." — Pythagoras, ~530 BCE
          </p>
        </div>

        {/* Fundamental selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">Fundamental</span>
          <select
            value={fundamental.name}
            onChange={e => {
              const fn = FUNDAMENTAL_NOTES.find(n => n.name === e.target.value);
              if (fn) changeFundamental(fn);
            }}
            className="text-sm rounded px-2 py-1 font-mono border border-gray-200 bg-white text-dark"
          >
            {FUNDAMENTAL_NOTES.map(fn => (
              <option key={fn.name} value={fn.name}>
                {fn.name}  ({fn.hz.toFixed(1)} Hz)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── String ─────────────────────────────────────────────────────── */}
      <div className="mt-3 border-y border-gray-200">
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
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors border"
          style={{
            background: `${info.left.color}18`,
            color: info.left.color,
            borderColor: `${info.left.color}50`,
          }}
        >
          ◂ Left  ({info.left.noteName})
        </button>
        <button
          onClick={pluckBoth}
          className="px-4 py-1.5 rounded text-xs font-mono transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
        >
          Both
        </button>
        <button
          onClick={pluckRight}
          className="px-3 py-1.5 rounded text-xs font-mono transition-colors border"
          style={{
            background: `${info.right.color}18`,
            color: info.right.color,
            borderColor: `${info.right.color}50`,
          }}
        >
          Right ▸  ({info.right.noteName})
        </button>
        <button
          onClick={() => setDroneOn(d => !d)}
          className={`ml-2 px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
            droneOn
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {droneOn ? '◉ Drone' : '○ Drone'}
        </button>
      </div>

      {/* ── Main info + Lissajous ──────────────────────────────────────── */}
      <div className="mt-5 px-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Left panel: ratio info + canonical buttons ──────────────── */}
        <div className="space-y-5">
          {/* Big ratio display */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <div className="text-center mb-3">
              <div
                className="text-5xl font-bold tracking-tight leading-none text-dark"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {info.segmentRatioStr}
              </div>
              <div className="text-base mt-1 font-medium text-gray-500">
                {info.segmentIntervalName}
              </div>
              {info.nearestCanonical && (
                <div className="text-xs mt-1 font-mono px-2 py-0.5 rounded-full inline-block bg-amber-100 text-amber-700">
                  {info.nearestCanonical.symbol} — {info.nearestCanonical.name}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 mt-2 grid grid-cols-2 gap-2">
              {/* Left segment */}
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-semibold" style={{ color: info.left.color }}>
                  ◂ Left — {info.left.noteName}
                </div>
                <div className="text-xs font-mono text-gray-500">{info.left.ratioStr} above root</div>
                <div className="text-xs font-mono text-gray-400">{info.left.hz.toFixed(2)} Hz</div>
                <div className="text-xs font-mono text-gray-400">{centsLabel(info.left.cents)}</div>
              </div>
              {/* Right segment */}
              <div className="space-y-0.5 text-right">
                <div className="text-xs font-mono font-semibold" style={{ color: info.right.color }}>
                  {info.right.noteName} — Right ▸
                </div>
                <div className="text-xs font-mono text-gray-500">{info.right.ratioStr} above root</div>
                <div className="text-xs font-mono text-gray-400">{info.right.hz.toFixed(2)} Hz</div>
                <div className="text-xs font-mono text-gray-400">{centsLabel(info.right.cents)}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <span className="text-xs font-mono text-gray-400">
                Beat: {beatLabel(info.beatHz)}
              </span>
            </div>

            {info.nearestCanonical && (
              <div className="mt-2 text-xs font-mono text-center text-amber-600">
                {info.nearestCanonical.description}
              </div>
            )}
          </div>

          {/* Canonical ratio buttons */}
          <div>
            <div className="text-xs font-mono mb-2 text-gray-400">Canonical Positions</div>
            <div className="grid grid-cols-3 gap-1.5">
              {CANONICAL_RATIOS.map(cr => {
                const near = Math.abs(bridgePos - cr.position) < 0.015
                          || Math.abs(bridgePos - (1 - cr.position)) < 0.015;
                return (
                  <button
                    key={cr.symbol}
                    onClick={() => snapTo(cr.position)}
                    className={`rounded py-2 px-1 text-center transition-all border ${
                      near
                        ? 'bg-fret-green/10 border-fret-green/40 text-fret-green'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{cr.symbol}</div>
                    <div className={`leading-tight text-xs ${near ? 'text-fret-green/70' : 'text-gray-400'}`}
                      style={{ fontSize: '0.65rem' }}>
                      {cr.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right panel: Lissajous + position + comma ───────────────── */}
        <div className="flex flex-col items-center gap-5">
          {/* Lissajous — keeps dark background, lives in a dark container */}
          <div className="text-center">
            <div className="text-xs font-mono mb-2 text-gray-400">
              Lissajous Figure — {lisP}:{lisQ}
            </div>
            <div className="inline-block rounded-2xl p-3 bg-gray-900 border border-gray-700">
              <LissajousCanvas
                p={lisP}
                q={lisQ}
                size={200}
                label={`${lisP}:${lisQ}`}
              />
            </div>
            <p className="text-xs mt-2 max-w-xs mx-auto text-gray-400" style={{ lineHeight: 1.5 }}>
              When two frequencies in ratio {lisP}:{lisQ} are plotted against each other,
              this is the geometry of their relationship.
            </p>
          </div>

          {/* Bridge position readout */}
          <div className="w-full rounded-lg p-3 text-center bg-gray-50 border border-gray-200">
            <div className="text-xs font-mono text-gray-400">Bridge Position</div>
            <div className="text-lg font-mono mt-0.5 text-dark">
              {(bridgePos * 100).toFixed(1)}%
            </div>
            <div className="text-xs font-mono text-gray-400">
              Left {(bridgePos * 100).toFixed(0)}% · Right {((1 - bridgePos) * 100).toFixed(0)}%
            </div>
          </div>

          {/* Comma toggle */}
          <button
            onClick={() => setShowComma(v => !v)}
            className={`w-full py-2 rounded-lg text-xs font-mono transition-colors border ${
              showComma
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {showComma ? '▾' : '▸'} Pythagorean Comma — The Circle That Never Closes
          </button>
        </div>
      </div>

      {/* ── Comma stacker ─────────────────────────────────────────────── */}
      {showComma && (
        <div className="mx-6 mt-4 rounded-xl p-5 bg-red-50 border border-red-100">
          <CommaStacker fundHz={fundamental.hz} />
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <div className="mt-8 pb-4 px-6 text-center">
        <p className="text-xs font-mono text-gray-300" style={{ lineHeight: 1.8 }}>
          Drag the bridge to divide the string · Click either segment to pluck it ·
          Faint markers show canonical harmonic positions · φ marks the irrational golden ratio
        </p>
      </div>
    </div>
  );
}
