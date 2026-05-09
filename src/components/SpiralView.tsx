import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import { noteName, usesSharps } from '../lib/harmony';
import HarmonicSpiral from './HarmonicSpiral';
import DiatonicChordBar from './DiatonicChordBar';
import HelpPopover from './HelpPopover';
import { FACTORY_PRESETS } from '../lib/synthPresets';
import { updateSpiralParams } from '../lib/musicbox';

// ─── Euclidean rhythm ─────────────────────────────────────────────────────────
function euclidean(k: number, n: number): boolean[] {
  if (k <= 0) return Array(n).fill(false);
  if (k >= n) return Array(n).fill(true);
  const raw: boolean[] = [];
  let bucket = 0;
  for (let i = 0; i < n; i++) {
    bucket += k;
    if (bucket >= n) { bucket -= n; raw.push(true); } else raw.push(false);
  }
  const first = raw.indexOf(true);
  return first > 0 ? [...raw.slice(first), ...raw.slice(0, first)] : raw;
}

// ─── Euclidean auto-trigger control ──────────────────────────────────────────
interface EucControlProps {
  auto: boolean; hits: number; steps: number;
  onToggle: () => void; onHits: (v: number) => void; onSteps: (v: number) => void;
}
function EucControl({ auto, hits, steps, onToggle, onHits, onSteps }: EucControlProps) {
  const pat = euclidean(hits, steps);
  return (
    <div className="flex flex-col items-center gap-0.5 mt-0.5">
      <button
        onClick={onToggle}
        className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
          auto ? 'bg-fret-green text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title="Euclidean auto-trigger"
      >
        {auto ? '●' : '○'} Auto
      </button>
      {auto && (
        <>
          <div className="flex items-center gap-0.5 text-[9px] text-gray-500">
            <button onClick={() => onHits(Math.max(1, hits - 1))} className="w-3 text-center hover:text-gray-700">−</button>
            <span title="Hits (k)">{hits}</span>
            <button onClick={() => onHits(Math.min(steps, hits + 1))} className="w-3 text-center hover:text-gray-700">+</button>
            <span className="text-gray-300">/</span>
            <button onClick={() => onSteps(Math.max(hits, steps - 1))} className="w-3 text-center hover:text-gray-700">−</button>
            <span title="Steps (n)">{steps}</span>
            <button onClick={() => onSteps(Math.min(16, steps + 1))} className="w-3 text-center hover:text-gray-700">+</button>
          </div>
          <div className="flex gap-[2px] mt-0.5">
            {pat.map((hit, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${hit ? 'bg-fret-green' : 'bg-gray-200'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const KEY_INTERVALS = [
  { label: 'm2', semitones: 1 },
  { label: 'M2', semitones: 2 },
  { label: 'm3', semitones: 3 },
  { label: 'M3', semitones: 4 },
  { label: 'P4', semitones: 5 },
  { label: 'TT', semitones: 6 },
  { label: 'P5', semitones: 7 },
];

const MAJOR_DIATONIC = new Set([0, 2, 4, 5, 7, 9, 11]);
const MINOR_DIATONIC = new Set([0, 2, 3, 5, 7, 8, 10]);
const DEGREE_LABELS: Record<number, string> = {
  0: 'I', 1: '♭II', 2: 'II', 3: '♭III', 4: 'III',
  5: 'IV', 6: '♭V', 7: 'V', 8: '♭VI', 9: 'VI', 10: '♭VII', 11: 'VII',
};

function degreeInfo(root: number, mode: 'major' | 'minor', pc: number) {
  const interval = ((pc - root) % 12 + 12) % 12;
  const diatonic = (mode === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC).has(interval);
  return { label: DEGREE_LABELS[interval] ?? '?', diatonic };
}

export default function CircleView() {
  const bottomPadding = useBottomPadding();
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const setSpiralMode = useStore(s => s.setSpiralMode);
  const setSpiralRoot = useStore(s => s.setSpiralRoot);
  const [leftIdx, setLeftIdx] = useState(6);
  const [rightIdx, setRightIdx] = useState(6);
  const [arrowHover, setArrowHover] = useState<'left' | 'right' | null>(null);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [spiralPresetIdx, setSpiralPresetIdx] = useState(0);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    const close = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setOptionsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [optionsOpen]);

  function handleSpiralPreset(idx: number) {
    setSpiralPresetIdx(idx);
    const preset = FACTORY_PRESETS[idx];
    if (preset) updateSpiralParams(preset.params);
  }

  const [leftAuto, setLeftAuto] = useState(false);
  const [leftHits, setLeftHits] = useState(1);
  const [leftSteps, setLeftSteps] = useState(4);
  const [rightAuto, setRightAuto] = useState(false);
  const [rightHits, setRightHits] = useState(1);
  const [rightSteps, setRightSteps] = useState(4);

  const playing = useStore(s => s.transportPlaying);
  const currentBeat = useStore(s => s.transportCurrentBeat);

  const eucPos = useRef(0);
  const prevBeat = useRef(-1);
  const autoRef = useRef({ leftAuto, leftHits, leftSteps, rightAuto, rightHits, rightSteps });
  useEffect(() => { autoRef.current = { leftAuto, leftHits, leftSteps, rightAuto, rightHits, rightSteps }; });

  useEffect(() => {
    if (!playing || currentBeat === prevBeat.current) return;
    prevBeat.current = currentBeat;
    const pos = eucPos.current;
    const { leftAuto: la, leftHits: lh, leftSteps: ls, rightAuto: ra, rightHits: rh, rightSteps: rs } = autoRef.current;
    if (la) {
      const pat = euclidean(lh, ls);
      if (pat[pos % ls]) setSpiralRoot(((spiralRoot - KEY_INTERVALS[leftIdx]!.semitones) % 12 + 12) % 12);
    }
    if (ra) {
      const pat = euclidean(rh, rs);
      if (pat[pos % rs]) setSpiralRoot((spiralRoot + KEY_INTERVALS[rightIdx]!.semitones) % 12);
    }
    eucPos.current = pos + 1;
  }, [currentBeat, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) { eucPos.current = 0; prevBeat.current = -1; }
  }, [playing]);

  const preferSharps = usesSharps(spiralRoot);
  const keyName = `${noteName(spiralRoot, preferSharps)} ${spiralMode}`;

  const leftSt  = KEY_INTERVALS[leftIdx]!.semitones;
  const rightSt = KEY_INTERVALS[rightIdx]!.semitones;
  const leftPc  = ((spiralRoot - leftSt) % 12 + 12) % 12;
  const rightPc = (spiralRoot + rightSt) % 12;
  const leftInfo  = degreeInfo(spiralRoot, spiralMode, leftPc);
  const rightInfo = degreeInfo(spiralRoot, spiralMode, rightPc);
  const leftNote  = noteName(leftPc,  usesSharps(leftPc));
  const rightNote = noteName(rightPc, usesSharps(rightPc));

  return (
    <div className="pt-14 px-4 max-w-2xl mx-auto" style={{ paddingBottom: bottomPadding }}>
      <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-dark">{keyName}</h2>
          <HelpPopover
            placement="below"
            text="Circle of fifths. Middle ring = major keys, outer ring = relative minors. Click any segment to set the key. Green = root, pink = diatonic, blue = dominant/subdominant. Use the arrows to step by any interval; enable Auto to step on a Euclidean rhythm with the transport. Click chord buttons below to hear diatonic arpeggios."
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Options popover */}
          <div ref={optionsRef} className="relative">
            <button
              onClick={() => setOptionsOpen(o => !o)}
              className={`p-1.5 rounded transition-colors ${optionsOpen ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              title="Circle options"
            >
              <Settings size={16} />
            </button>
            {optionsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Sound</label>
                  <select
                    value={spiralPresetIdx}
                    onChange={e => handleSpiralPreset(Number(e.target.value))}
                    className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
                  >
                    {FACTORY_PRESETS.map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setSpiralMode('major')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                spiralMode === 'major' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Major
            </button>
            <button
              onClick={() => setSpiralMode('minor')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                spiralMode === 'minor' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Minor
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {/* Left arrow */}
        <div className="flex flex-col items-center gap-1">
          <span className={`text-xs font-semibold ${leftInfo.diatonic ? 'text-fret-green' : 'text-gray-400'}`}
            title={leftInfo.label}>
            {leftNote}
          </span>
          <button
            onClick={() => setSpiralRoot(leftPc)}
            onMouseEnter={() => setArrowHover('left')}
            onMouseLeave={() => setArrowHover(null)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Previous key"
          >
            <ChevronLeft size={28} />
          </button>
          <select
            value={leftIdx}
            onChange={e => setLeftIdx(Number(e.target.value))}
            className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-500"
          >
            {KEY_INTERVALS.map((iv, i) => (
              <option key={iv.label} value={i}>{iv.label}</option>
            ))}
          </select>
          <EucControl auto={leftAuto} hits={leftHits} steps={leftSteps}
            onToggle={() => setLeftAuto(v => !v)}
            onHits={setLeftHits} onSteps={setLeftSteps} />
        </div>

        <HarmonicSpiral previewPc={arrowHover === 'left' ? leftPc : arrowHover === 'right' ? rightPc : null} />

        {/* Right arrow */}
        <div className="flex flex-col items-center gap-1">
          <span className={`text-xs font-semibold ${rightInfo.diatonic ? 'text-fret-green' : 'text-gray-400'}`}
            title={rightInfo.label}>
            {rightNote}
          </span>
          <button
            onClick={() => setSpiralRoot(rightPc)}
            onMouseEnter={() => setArrowHover('right')}
            onMouseLeave={() => setArrowHover(null)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Next key"
          >
            <ChevronRight size={28} />
          </button>
          <select
            value={rightIdx}
            onChange={e => setRightIdx(Number(e.target.value))}
            className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-500"
          >
            {KEY_INTERVALS.map((iv, i) => (
              <option key={iv.label} value={i}>{iv.label}</option>
            ))}
          </select>
          <EucControl auto={rightAuto} hits={rightHits} steps={rightSteps}
            onToggle={() => setRightAuto(v => !v)}
            onHits={setRightHits} onSteps={setRightSteps} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">Diatonic Chords</h3>
        <DiatonicChordBar />
      </div>
    </div>
  );
}
