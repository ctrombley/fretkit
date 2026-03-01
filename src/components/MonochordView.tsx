import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import MonochordString, { type MonochordStringHandle } from './MonochordString';
import MonochordScaleSelector from './MonochordScaleSelector';
import ConchSpiral from './ConchSpiral';
import {
  CANONICAL_RATIOS,
  FUNDAMENTAL_NOTES,
  DEFAULT_FUNDAMENTAL,
  getBridgeInfo,
  pluckMonochord,
  startDrone,
  bridgePosForBeat,
  type FundamentalNote,
} from '../lib/monochord';
import {
  FACTORY_SCALE_PRESETS,
  computeScalePins,
  posToEntry,
  type ScalePin,
} from '../lib/monochordScales';

// ── Module-level drone state (survives navigation) ────────────────────────
const _droneState: { leftStop: (() => void) | null; rightStop: (() => void) | null } = {
  leftStop: null,
  rightStop: null,
};

function _stopDrones() {
  _droneState.leftStop?.();
  _droneState.rightStop?.();
  _droneState.leftStop = null;
  _droneState.rightStop = null;
}

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

function brainwaveLabel(hz: number): string {
  if (hz < 0.5)  return 'sub-delta';
  if (hz < 4)    return 'δ delta — deep sleep';
  if (hz < 8)    return 'θ theta — drowsy / meditation';
  if (hz < 14)   return 'α alpha — relaxed awareness';
  if (hz < 30)   return 'β beta — alert / focused';
  return          'γ gamma — high cognition';
}

const BRAINWAVE_PRESETS = [
  { label: 'δ', hz: 2,  title: 'Delta 2 Hz — deep sleep' },
  { label: 'θ', hz: 6,  title: 'Theta 6 Hz — meditation' },
  { label: 'α', hz: 10, title: 'Alpha 10 Hz — relaxed' },
  { label: 'β', hz: 20, title: 'Beta 20 Hz — alert' },
];

function centsLabel(cents: number): string {
  const et  = Math.round(cents / 100) * 100;
  const dev = cents - et;
  return `${cents.toFixed(2)}¢  (${formatCents(dev)} from ET)`;
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function MonochordView() {
  const bottomPadding = useBottomPadding();

  // Persistent state lives in the store so it survives navigation
  const fundamentalName = useStore(s => s.monochordFundamentalName);
  const bridgePos       = useStore(s => s.monochordBridgePos);
  const droneOn         = useStore(s => s.monochordDroneOn);
  const binaural        = useStore(s => s.monochordBinaural);
  const setFundamentalName = useStore(s => s.setMonochordFundamentalName);
  const setBridgePos       = useStore(s => s.setMonochordBridgePos);
  const setDroneOn         = useStore(s => s.setMonochordDroneOn);
  const setBinaural        = useStore(s => s.setMonochordBinaural);

  const fundamental: FundamentalNote =
    FUNDAMENTAL_NOTES.find(n => n.name === fundamentalName) ?? DEFAULT_FUNDAMENTAL;

  const [beatInput, setBeatInput] = useState('');
  const [leftMuted,  setLeftMuted]  = useState(false);
  const [rightMuted, setRightMuted] = useState(false);

  // Scale state from store
  const scaleId         = useStore(s => s.monochordScaleId);
  const customEntries   = useStore(s => s.monochordCustomEntries);
  const userPresets     = useStore(s => s.monochordUserPresets);
  const addCustomEntry    = useStore(s => s.addMonochordCustomEntry);
  const removeCustomEntry = useStore(s => s.removeMonochordCustomEntry);

  // Compute active scale entries
  const activeEntries = useMemo(() => {
    if (scaleId === 'custom') return customEntries;
    const factory = FACTORY_SCALE_PRESETS.find(p => p.id === scaleId);
    if (factory) return factory.entries;
    const user = userPresets.find(p => p.id === scaleId);
    return user?.entries ?? [];
  }, [scaleId, customEntries, userPresets]);

  // Recompute pins whenever entries or fundamental changes
  const scalePins: ScalePin[] = useMemo(
    () => computeScalePins(activeEntries, fundamental.pitchClass),
    [activeEntries, fundamental.pitchClass],
  );

  const stringRef = useRef<MonochordStringHandle>(null);
  const plucksRef = useRef<{ stop: () => void }[]>([]);

  const info = getBridgeInfo(bridgePos, fundamental.hz, fundamental.pitchClass);

  // ── Audio helpers ──────────────────────────────────────────────────────

  function stopAllPlucks() {
    plucksRef.current.forEach(h => h.stop());
    plucksRef.current = [];
  }

  const handlePluck = useCallback((side: 'left' | 'right' | 'both') => {
    stopAllPlucks();
    const lp = binaural ? -1 : 0;
    const rp = binaural ?  1 : 0;
    if ((side === 'left'  || side === 'both') && !leftMuted)  plucksRef.current.push({ stop: pluckMonochord(info.left.hz,  undefined, lp) });
    if ((side === 'right' || side === 'both') && !rightMuted) plucksRef.current.push({ stop: pluckMonochord(info.right.hz, undefined, rp) });
  }, [info.left.hz, info.right.hz, binaural, leftMuted, rightMuted]);

  function pluckBoth()  { stringRef.current?.pluck('both');  handlePluck('both');  }

  // ── Drone — module-level state survives navigation ─────────────────────

  useEffect(() => {
    if (droneOn) {
      _stopDrones();
      const lp = binaural ? -1 : 0;
      const rp = binaural ?  1 : 0;
      if (!leftMuted)  _droneState.leftStop  = startDrone(info.left.hz,  lp);
      if (!rightMuted) _droneState.rightStop = startDrone(info.right.hz, rp);
    } else {
      _stopDrones();
    }
    // No cleanup — drone keeps running when component navigates away
  }, [droneOn, info.left.hz, info.right.hz, binaural, leftMuted, rightMuted]);

  // ── Snap to canonical ratio ────────────────────────────────────────────

  function snapTo(position: number) {
    setBridgePos(position);
    setTimeout(() => {
      stringRef.current?.pluck('both');
      const i  = getBridgeInfo(position, fundamental.hz, fundamental.pitchClass);
      const lp = binaural ? -1 : 0;
      const rp = binaural ?  1 : 0;
      stopAllPlucks();
      if (!leftMuted)  plucksRef.current.push({ stop: pluckMonochord(i.left.hz,  undefined, lp) });
      if (!rightMuted) plucksRef.current.push({ stop: pluckMonochord(i.right.hz, undefined, rp) });
    }, 30);
  }

  function changeFundamental(fn: FundamentalNote) {
    stopAllPlucks();
    if (droneOn) { _stopDrones(); setDroneOn(false); }
    setFundamentalName(fn.name);
  }

  // ── Pin current position to custom scale ──────────────────────────────

  function saveTone(pos: number) {
    addCustomEntry(posToEntry(pos));
  }

  function handleScalePinSnap(pin: ScalePin) {
    snapTo(pin.pos);
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

        {/* Fundamental + Scale selectors */}
        <div className="flex flex-wrap items-center gap-3">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">Scale</span>
            <MonochordScaleSelector />
          </div>
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
          fundPitchClass={fundamental.pitchClass}
          scalePins={scalePins}
          onPluck={handlePluck}
          onMarkerSnap={snapTo}
          onSaveTone={saveTone}
          onScalePinSnap={handleScalePinSnap}
        />
      </div>

      {/* ── Pluck / mute controls ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-3 px-6">
        {/* Left mute toggle */}
        <button
          onClick={() => setLeftMuted(m => !m)}
          title={leftMuted ? 'Unmute left side' : 'Mute left side'}
          className="px-3 py-1.5 rounded text-xs font-mono transition-all border"
          style={leftMuted ? {
            background: 'transparent',
            color: '#9ca3af',
            borderColor: '#d1d5db',
            textDecoration: 'line-through',
            opacity: 0.55,
          } : {
            background: `${info.left.color}18`,
            color: info.left.color,
            borderColor: `${info.left.color}50`,
          }}
        >
          {leftMuted ? '⊘' : '◂'} Left  ({info.left.noteName})
        </button>
        <button
          onClick={pluckBoth}
          className="px-4 py-1.5 rounded text-xs font-mono transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
        >
          Both
        </button>
        {/* Right mute toggle */}
        <button
          onClick={() => setRightMuted(m => !m)}
          title={rightMuted ? 'Unmute right side' : 'Mute right side'}
          className="px-3 py-1.5 rounded text-xs font-mono transition-all border"
          style={rightMuted ? {
            background: 'transparent',
            color: '#9ca3af',
            borderColor: '#d1d5db',
            textDecoration: 'line-through',
            opacity: 0.55,
          } : {
            background: `${info.right.color}18`,
            color: info.right.color,
            borderColor: `${info.right.color}50`,
          }}
        >
          Right ({info.right.noteName}) {rightMuted ? '⊘' : '▸'}
        </button>
        <button
          onClick={() => setDroneOn(!droneOn)}
          className={`ml-2 px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
            droneOn
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {droneOn ? '◉ Drone' : '○ Drone'}
        </button>
        <button
          onClick={() => setBinaural(!binaural)}
          className={`ml-1 px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
            binaural
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {binaural ? '◉ Binaural' : '○ Binaural'}
        </button>
        <button
          onClick={() => saveTone(bridgePos)}
          title="Favourite this position (adds to custom scale; or right-click the string)"
          className={`ml-1 p-1.5 rounded transition-colors ${
            scaleId === 'custom' && customEntries.some(e => Math.abs(e.pos - bridgePos) < 0.002)
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-gray-400 hover:text-amber-500'
          }`}
        >
          <Star
            size={15}
            fill={
              scaleId === 'custom' && customEntries.some(e => Math.abs(e.pos - bridgePos) < 0.002)
                ? 'currentColor' : 'none'
            }
          />
        </button>
      </div>

      {/* ── Scale pin strip — shows active scale's pins as clickable chips ── */}
      {scalePins.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 px-6">
          {scalePins.map((pin, i) => (
            <button
              key={`${pin.pos.toFixed(7)}-${i}`}
              onClick={() => handleScalePinSnap(pin)}
              title={pin.ratio}
              className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full text-xs font-mono border transition-all hover:opacity-80 active:scale-95"
              style={{
                color:       pin.color,
                borderColor: `${pin.color}55`,
                background:  `${pin.color}12`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: pin.color }}
              />
              {pin.noteName}
              <span className="opacity-40 text-[9px] ml-0.5">{pin.ratio}</span>
              {scaleId === 'custom' && (
                <span
                  onClick={e => { e.stopPropagation(); removeCustomEntry(pin.pos); }}
                  className="ml-0.5 opacity-40 hover:opacity-90 leading-none cursor-pointer select-none"
                >×</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Binaural beat panel ─────────────────────────────────────────── */}
      {binaural && (
        <div className="mt-3 mx-6 rounded-xl p-4 bg-indigo-50 border border-indigo-200">
          <div className="flex flex-wrap items-start gap-4">

            {/* Current beat readout */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-indigo-400">Binaural beat</div>
              <div className="text-3xl font-bold font-mono text-indigo-700 leading-none mt-0.5">
                {info.beatHz.toFixed(2)} <span className="text-base font-normal">Hz</span>
              </div>
              <div className="text-xs font-mono text-indigo-500 mt-1">
                {brainwaveLabel(info.beatHz)}
              </div>
              <div className="text-xs font-mono text-indigo-300 mt-2">
                🎧 Requires headphones
              </div>
            </div>

            {/* Target input + presets */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-mono text-indigo-400">Set target beat</div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={beatInput}
                  onChange={e => setBeatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const hz = parseFloat(beatInput);
                      if (isFinite(hz) && hz > 0) setBridgePos(bridgePosForBeat(hz, fundamental.hz));
                    }
                  }}
                  placeholder="Hz"
                  className="w-20 px-2 py-1 text-sm font-mono border border-indigo-300 rounded bg-white text-dark"
                />
                <button
                  onClick={() => {
                    const hz = parseFloat(beatInput);
                    if (isFinite(hz) && hz > 0) setBridgePos(bridgePosForBeat(hz, fundamental.hz));
                  }}
                  className="px-2 py-1 text-xs font-mono bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Set
                </button>
              </div>
              <div className="flex gap-1">
                {BRAINWAVE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    title={p.title}
                    onClick={() => {
                      setBeatInput(String(p.hz));
                      setBridgePos(bridgePosForBeat(p.hz, fundamental.hz));
                    }}
                    className="px-2 py-1 text-xs font-mono bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 border border-indigo-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
          Drag the bridge · Click a marker to snap · Click a segment to pluck ·
          Scroll to zoom · Drag or Shift+scroll to pan · ← → to navigate when zoomed ·
          ⊕ Pin / right-click to add to custom scale · φ = golden ratio
        </p>
      </div>
    </div>
  );
}
