import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import { noteName, usesSharps } from '../lib/harmony';
import { fundamentalFrequency } from '../lib/overtones';
import { play } from '../lib/musicbox';
import { getDerivation, GENERATOR_PRESETS, type GeneratorPreset } from '../lib/derivation';
import OvertoneSpiral from './OvertoneSpiral';
import DerivationRing from './DerivationRing';
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
const OCTAVES = [1, 2, 3, 4, 5];
const MODES = ['ji', 'et', 'derive'] as const;
const MODE_LABELS: Record<typeof MODES[number], string> = { ji: 'JI', et: 'ET', derive: 'Derive' };
const GENERATOR_LABELS: Record<GeneratorPreset, string> = { fifths: '5ths', thirds: '3rds', sevenths: '7ths' };
const GENERATOR_KEYS: GeneratorPreset[] = ['fifths', 'thirds', 'sevenths'];

export default function OvertoneView() {
  const bottomPadding = useBottomPadding();
  const overtoneRoot = useStore(s => s.overtoneRoot);
  const overtoneOctave = useStore(s => s.overtoneOctave);
  const overtoneCount = useStore(s => s.overtoneCount);
  const overtoneShowET = useStore(s => s.overtoneShowET);
  const overtoneMode = useStore(s => s.overtoneMode);
  const setOvertoneRoot = useStore(s => s.setOvertoneRoot);
  const setOvertoneOctave = useStore(s => s.setOvertoneOctave);
  const setOvertoneCount = useStore(s => s.setOvertoneCount);
  const setOvertoneShowET = useStore(s => s.setOvertoneShowET);
  const setOvertoneMode = useStore(s => s.setOvertoneMode);

  const derivationGenerator = useStore(s => s.derivationGenerator);
  const derivationSteps = useStore(s => s.derivationSteps);
  const derivationActiveStep = useStore(s => s.derivationActiveStep);
  const derivationDivisions = useStore(s => s.derivationDivisions);
  const setDerivationGenerator = useStore(s => s.setDerivationGenerator);
  const setDerivationSteps = useStore(s => s.setDerivationSteps);
  const setDerivationActiveStep = useStore(s => s.setDerivationActiveStep);
  const setDerivationDivisions = useStore(s => s.setDerivationDivisions);
  const transportBpm = useStore(s => s.transportBpm);
  const seriesPlaying = useStore(s => s.overtoneSeriesPlaying);
  const setSeriesPlaying = useStore(s => s.setOvertoneSeriesPlaying);

  const [activeN, setActiveN] = useState<number | null>(null);
  const [bloomKey, setBloomKey] = useState(0);

  const fundHz = fundamentalFrequency(overtoneRoot, overtoneOctave);
  const preferSharps = usesSharps(overtoneRoot);
  const rootName = noteName(overtoneRoot, preferSharps);
  const isDeriveMode = overtoneMode === 'derive';

  // Main playback loop — module-level state survives navigation
  useEffect(() => {
    if (!seriesPlaying) {
      _loopId++;
      _clearLoop();
      setDerivationActiveStep(null);
      setActiveN(null);
      return;
    }

    const myId = ++_loopId;
    _clearLoop();

    const interval = 60000 / transportBpm;

    function scheduleLoop() {
      if (_loopId !== myId) return;

      if (isDeriveMode) {
        const derivation = getDerivation(derivationGenerator, fundHz, overtoneRoot, derivationSteps, derivationDivisions);
        derivation.steps.forEach((note, i) => {
          const tid = setTimeout(() => {
            if (_loopId !== myId) return;
            setDerivationActiveStep(note.step);
            _voices.push(play(note.frequency));
          }, i * interval);
          _timeouts.push(tid);
        });
        const tid = setTimeout(() => {
          if (_loopId !== myId) return;
          _voices.forEach(h => h.stop());
          _voices.length = 0;
          setDerivationActiveStep(null);
          scheduleLoop();
        }, derivationSteps * interval);
        _timeouts.push(tid);
      } else {
        const useET = overtoneMode === 'et';
        for (let n = 1; n <= overtoneCount; n++) {
          const freq = useET
            ? fundHz * Math.pow(2, Math.round(1200 * Math.log2(n) / 100) / 12)
            : n * fundHz;
          const tid = setTimeout(() => {
            if (_loopId !== myId) return;
            setActiveN(n);
            setBloomKey(k => k + 1);
            _voices.push(play(freq));
          }, (n - 1) * interval);
          _timeouts.push(tid);
        }
        const tid = setTimeout(() => {
          if (_loopId !== myId) return;
          _voices.forEach(h => h.stop());
          _voices.length = 0;
          scheduleLoop();
        }, overtoneCount * interval);
        _timeouts.push(tid);
      }
    }

    scheduleLoop();
    // No cleanup — loop keeps running when component navigates away
  }, [seriesPlaying, transportBpm, isDeriveMode, derivationGenerator, fundHz, overtoneRoot, derivationSteps, derivationDivisions, overtoneMode, overtoneCount, setDerivationActiveStep]);

  return (
    <div className="pt-14 px-4 max-w-2xl mx-auto" style={{ paddingBottom: bottomPadding }}>
      {/* Title */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark">
            {isDeriveMode
              ? `ET Derivation: ${rootName} (${GENERATOR_PRESETS[derivationGenerator].name}, ${derivationDivisions}-TET)`
              : `Overtone Series: ${rootName}${overtoneOctave}`
            }
          </h2>
          <SynthPresetSelector />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Fundamental: {fundHz.toFixed(1)} Hz
        </p>
      </div>

      {/* Root note buttons */}
      <div className="flex gap-1 flex-wrap mb-4">
        {PITCH_CLASSES.map(pc => {
          const sharp = usesSharps(pc);
          const name = noteName(pc, sharp);
          const active = pc === overtoneRoot;
          return (
            <button
              key={pc}
              onClick={() => setOvertoneRoot(pc)}
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
        {/* Octave selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Octave</span>
          {OCTAVES.map(oct => (
            <button
              key={oct}
              onClick={() => setOvertoneOctave(oct)}
              className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                oct === overtoneOctave
                  ? 'bg-fret-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {oct}
            </button>
          ))}
        </div>

        {/* Harmonic count slider (spiral modes only) */}
        {!isDeriveMode && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Harmonics: {overtoneCount}
            <input
              type="range"
              min={1}
              max={32}
              value={overtoneCount}
              onChange={e => setOvertoneCount(Number(e.target.value))}
              className="w-24 accent-fret-green"
            />
          </label>
        )}

        {/* Show ET toggle (spiral modes only) */}
        {!isDeriveMode && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={overtoneShowET}
              onChange={e => setOvertoneShowET(e.target.checked)}
              className="accent-fret-green"
            />
            Show ET
          </label>
        )}

        {/* Generator selector (derive mode only) */}
        {isDeriveMode && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {GENERATOR_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setDerivationGenerator(key)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  derivationGenerator === key
                    ? 'bg-white text-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {GENERATOR_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        {/* Step count slider (derive mode only) */}
        {isDeriveMode && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Steps: {derivationSteps}
            <input
              type="range"
              min={1}
              max={24}
              value={derivationSteps}
              onChange={e => setDerivationSteps(Number(e.target.value))}
              className="w-24 accent-fret-green"
            />
          </label>
        )}

        {/* ET divisions slider (derive mode only) */}
        {isDeriveMode && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            ET: {derivationDivisions}
            <input
              type="range"
              min={2}
              max={53}
              value={derivationDivisions}
              onChange={e => setDerivationDivisions(Number(e.target.value))}
              className="w-24 accent-fret-green"
            />
          </label>
        )}

        {/* JI / ET / Derive mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setOvertoneMode(mode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                overtoneMode === mode
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Play */}
        <button
          onClick={() => setSeriesPlaying(!seriesPlaying)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            seriesPlaying
              ? 'bg-magenta text-white ring-2 ring-magenta/50'
              : 'bg-magenta text-white hover:bg-magenta/90'
          }`}
        >
          {seriesPlaying ? 'Stop' : isDeriveMode ? 'Play Sequence' : 'Play Series'}
        </button>
      </div>

      {/* Visualization */}
      {isDeriveMode ? (
        <>
          <DerivationRing
            fundamentalHz={fundHz}
            pitchClass={overtoneRoot}
            generator={derivationGenerator}
            steps={derivationSteps}
            divisions={derivationDivisions}
            activeStep={derivationActiveStep}
            onActiveStepChange={setDerivationActiveStep}
          />
          <p className="text-xs text-gray-400 text-center mt-2 max-w-lg mx-auto">
            Inner dots show pitches from stacking pure-ratio intervals.
            The outer ring marks {derivationDivisions}-TET positions.
            Arcs show how far each pitch misses its nearest ET step:
            {' '}<span className="text-red-400">red = sharp</span>,
            {' '}<span className="text-blue-400">blue = flat</span>.
            The <span className="text-red-400">dashed line</span> shows
            the comma gap — how far the chain misses closing the octave.
            Hover a dot for details.
          </p>
        </>
      ) : (
        <>
          <OvertoneSpiral
            fundamentalHz={fundHz}
            pitchClass={overtoneRoot}
            count={overtoneCount}
            showET={overtoneShowET}
            useET={overtoneMode === 'et'}
            activeN={activeN}
            bloomKey={bloomKey}
          />
          <p className="text-xs text-gray-400 text-center mt-2 max-w-lg mx-auto">
            Spiral shows the overtone series of the selected fundamental.
            Each node is a harmonic partial — hover for frequency and pitch info.
            Inner nodes = lower partials, outer = higher.
            Toggle "Show ET" to compare natural harmonics with the 12-TET grid.
            Switch JI/ET to hear natural vs. equal-tempered tuning.
          </p>
        </>
      )}
    </div>
  );
}
