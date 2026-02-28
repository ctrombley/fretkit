import { useState, useRef, useCallback, useEffect } from 'react';
import { useBottomPadding } from '../hooks/useBottomPadding';
import MonochordString, { type MonochordStringHandle } from './MonochordString';
import ConchSpiral from './ConchSpiral';
import {
  CANONICAL_RATIOS,
  FUNDAMENTAL_NOTES,
  DEFAULT_FUNDAMENTAL,
  getBridgeInfo,
  pluckMonochord,
  startDrone,
  type FundamentalNote,
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

// ── Main view ─────────────────────────────────────────────────────────────

export default function MonochordView() {
  const bottomPadding = useBottomPadding();

  const [fundamental, setFundamental] = useState<FundamentalNote>(DEFAULT_FUNDAMENTAL);
  const [bridgePos, setBridgePos]     = useState(2 / 3);
  const [droneOn, setDroneOn]         = useState(false);

  const stringRef = useRef<MonochordStringHandle>(null);
  const droneRef  = useRef<DroneState>({ leftStop: null, rightStop: null });
  const plucksRef = useRef<{ stop: () => void }[]>([]);

  const info = getBridgeInfo(bridgePos, fundamental.hz, fundamental.pitchClass);

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
          onMarkerSnap={snapTo}
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

      {/* ── Main info + spiral ──────────────────────────────────────────── */}
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

        {/* ── Right panel: harmonic spiral + position ──────────────────── */}
        <div className="flex flex-col items-center gap-5">

          {/* Harmonic spiral */}
          <div className="text-center">
            <div className="text-xs font-mono mb-2 text-gray-400">
              Harmonic Series — logarithmic spiral
            </div>
            <div className="inline-block rounded-2xl p-3 bg-gray-900 border border-gray-700">
              <ConchSpiral
                fundHz={fundamental.hz}
                fundPitchClass={fundamental.pitchClass}
                leftHz={info.left.hz}
                rightHz={info.right.hz}
                leftColor={info.left.color}
                rightColor={info.right.color}
                size={240}
              />
            </div>
            <p className="text-xs mt-2 max-w-xs mx-auto text-gray-400" style={{ lineHeight: 1.5 }}>
              Each revolution is one octave. Harmonics spiral outward as the series grows.
              Lit dots are the current string segments.
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
        </div>
      </div>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <div className="mt-8 pb-4 px-6 text-center">
        <p className="text-xs font-mono text-gray-300" style={{ lineHeight: 1.8 }}>
          Drag the bridge · Click a marker to snap to it · Click a segment to pluck ·
          φ marks the irrational golden ratio
        </p>
      </div>
    </div>
  );
}
