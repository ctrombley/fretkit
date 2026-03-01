import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import { noteName, usesSharps } from '../lib/harmony';
import { play } from '../lib/musicbox';
import {
  DIVISION_PRESETS,
  getCadences,
  type SymmetricDivision,
} from '../lib/coltrane';
import ColtraneCircle from './ColtraneCircle';
import ColtraneMandala from './ColtraneMandala';
import SynthPresetSelector from './SynthPresetSelector';

// ── Module-level loop state (survives navigation) ─────────────────────────
let _loopId = 0;
const _voices: { stop: () => void }[] = [];
const _timeouts: ReturnType<typeof setTimeout>[] = [];

function _clearLoop() {
  _timeouts.forEach(clearTimeout);
  _timeouts.length = 0;
  _voices.forEach(h => h.stop());
  _voices.length = 0;
}

const PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DIVISIONS: SymmetricDivision[] = [2, 3, 4, 6];

export default function ColtraneView() {
  const bottomPadding = useBottomPadding();
  const root = useStore(s => s.coltraneRoot);
  const division = useStore(s => s.coltraneDivision);
  const mode = useStore(s => s.coltraneMode);
  const ordering = useStore(s => s.coltraneOrdering);
  const showCadences = useStore(s => s.coltraneShowCadences);
  const highlightedAxis = useStore(s => s.coltraneHighlightedAxis);

  const setRoot = useStore(s => s.setColtraneRoot);
  const setDivision = useStore(s => s.setColtraneDivision);
  const setMode = useStore(s => s.setColtraneMode);
  const setOrdering = useStore(s => s.setColtraneOrdering);
  const setShowCadences = useStore(s => s.setColtraneShowCadences);
  const setHighlightedAxis = useStore(s => s.setColtraneHighlightedAxis);
  const transportBpm = useStore(s => s.transportBpm);
  const seriesPlaying = useStore(s => s.coltraneSeriesPlaying);
  const setSeriesPlaying = useStore(s => s.setColtraneSeriesPlaying);

  const [activePc, setActivePc] = useState<number | null>(null);
  const [bloomKey, setBloomKey] = useState(0);

  const preferSharps = usesSharps(root);
  const rootName = noteName(root, preferSharps);
  const preset = DIVISION_PRESETS[division];

  // Main playback loop — module-level state survives navigation
  useEffect(() => {
    if (!seriesPlaying) {
      _loopId++;
      _clearLoop();
      setActivePc(null);
      return;
    }

    const myId = ++_loopId;
    _clearLoop();

    const interval = 60000 / transportBpm;

    function scheduleLoop() {
      if (_loopId !== myId) return;

      const cadences = getCadences(root, division);
      let step = 0;

      for (const cadence of cadences) {
        const fromFreq = 261.63 * Math.pow(2, ((cadence.from) % 12) / 12);
        const tid1 = setTimeout(() => {
          if (_loopId !== myId) return;
          setActivePc(cadence.from % 12);
          setBloomKey(k => k + 1);
          _voices.push(play(fromFreq));
        }, step * interval);
        _timeouts.push(tid1);
        step++;

        const domFreq = 261.63 * Math.pow(2, ((cadence.dominant) % 12) / 12);
        const tid2 = setTimeout(() => {
          if (_loopId !== myId) return;
          setActivePc(cadence.dominant % 12);
          setBloomKey(k => k + 1);
          _voices.push(play(domFreq));
        }, step * interval);
        _timeouts.push(tid2);
        step++;
      }

      const tid = setTimeout(() => {
        if (_loopId !== myId) return;
        _voices.forEach(h => h.stop());
        _voices.length = 0;
        scheduleLoop();
      }, step * interval);
      _timeouts.push(tid);
    }

    scheduleLoop();
    // No cleanup — loop keeps running when component navigates away
  }, [seriesPlaying, transportBpm, root, division]);

  return (
    <div className="pt-14 px-4 max-w-2xl mx-auto" style={{ paddingBottom: bottomPadding }}>
      {/* Title */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark">
            Coltrane Changes: {rootName} — {preset.name}
          </h2>
          <SynthPresetSelector />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {preset.description}
        </p>
      </div>

      {/* Root note buttons */}
      <div className="flex gap-1 flex-wrap mb-4">
        {PITCH_CLASSES.map(pc => {
          const sharp = usesSharps(pc);
          const name = noteName(pc, sharp);
          const active = pc === root;
          return (
            <button
              key={pc}
              onClick={() => setRoot(pc)}
              className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-fret-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Symmetry type */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {DIVISIONS.map(d => (
            <button
              key={d}
              onClick={() => setDivision(d)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                division === d
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {DIVISION_PRESETS[d].name}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['circle', 'mandala'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'circle' ? 'Circle' : 'Mandala'}
            </button>
          ))}
        </div>

        {/* Ordering (circle mode only) */}
        {mode === 'circle' && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['fifths', 'chromatic'] as const).map(o => (
              <button
                key={o}
                onClick={() => setOrdering(o)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  ordering === o
                    ? 'bg-white text-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {o === 'fifths' ? 'Fifths' : 'Chromatic'}
              </button>
            ))}
          </div>
        )}

        {/* Show V-I cadences (circle mode only) */}
        {mode === 'circle' && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showCadences}
              onChange={e => setShowCadences(e.target.checked)}
              className="accent-fret-green"
            />
            V-I Cadences
          </label>
        )}

        {/* Play */}
        <button
          onClick={() => setSeriesPlaying(!seriesPlaying)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            seriesPlaying
              ? 'bg-magenta text-white ring-2 ring-magenta/50'
              : 'bg-magenta text-white hover:bg-magenta/90'
          }`}
        >
          {seriesPlaying ? 'Stop' : 'Play Cycle'}
        </button>
      </div>

      {/* Visualization */}
      {mode === 'circle' ? (
        <ColtraneCircle
          root={root}
          divisions={division}
          ordering={ordering}
          showCadences={showCadences}
          highlightedAxis={highlightedAxis}
          onHighlightAxis={setHighlightedAxis}
          activePc={activePc}
          bloomKey={bloomKey}
        />
      ) : (
        <ColtraneMandala
          root={root}
          divisions={division}
          highlightedAxis={highlightedAxis}
          onHighlightAxis={setHighlightedAxis}
          activePc={activePc}
          bloomKey={bloomKey}
        />
      )}

      {/* Legend */}
      <p className="text-xs text-gray-400 text-center mt-2 max-w-lg mx-auto">
        {mode === 'circle'
          ? 'Click a note to highlight its axis group. Colored polygons connect symmetric tones. Toggle V-I cadences to see the dominant resolutions Coltrane used.'
          : 'Lines connect every pair of notes, colored by interval class. Use the checkboxes to filter interval types. Polygons show the symmetric axis groups.'}
      </p>
    </div>
  );
}
