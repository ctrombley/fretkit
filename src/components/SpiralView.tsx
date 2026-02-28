import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import { noteName, usesSharps } from '../lib/harmony';
import HarmonicSpiral from './HarmonicSpiral';
import DiatonicChordBar from './DiatonicChordBar';
import SynthPresetSelector from './SynthPresetSelector';

const KEY_INTERVALS = [
  { label: 'm2', semitones: 1 },
  { label: 'M2', semitones: 2 },
  { label: 'm3', semitones: 3 },
  { label: 'M3', semitones: 4 },
  { label: 'P4', semitones: 5 },
  { label: 'TT', semitones: 6 },
  { label: 'P5', semitones: 7 },
];

export default function SpiralView() {
  const bottomPadding = useBottomPadding();
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const setSpiralMode = useStore(s => s.setSpiralMode);
  const setSpiralRoot = useStore(s => s.setSpiralRoot);
  const [intervalIdx, setIntervalIdx] = useState(6); // default P5

  const preferSharps = usesSharps(spiralRoot);
  const keyName = `${noteName(spiralRoot, preferSharps)} ${spiralMode}`;
  const semitones = KEY_INTERVALS[intervalIdx]!.semitones;

  return (
    <div className="pt-14 px-4 max-w-2xl mx-auto" style={{ paddingBottom: bottomPadding }}>
      <div className="flex items-center justify-between mt-6 mb-4">
        <h2 className="text-2xl font-bold text-dark">{keyName}</h2>
        <SynthPresetSelector />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSpiralMode('major')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              spiralMode === 'major'
                ? 'bg-white text-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Major
          </button>
          <button
            onClick={() => setSpiralMode('minor')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              spiralMode === 'minor'
                ? 'bg-white text-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Minor
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setSpiralRoot(((spiralRoot - semitones) % 12 + 12) % 12)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Previous key"
        >
          <ChevronLeft size={28} />
        </button>
        <HarmonicSpiral />
        <button
          onClick={() => setSpiralRoot((spiralRoot + semitones) % 12)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Next key"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Interval selector */}
      <div className="flex justify-center gap-1 mt-3">
        {KEY_INTERVALS.map((iv, i) => (
          <button
            key={iv.label}
            onClick={() => setIntervalIdx(i)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              i === intervalIdx
                ? 'bg-fret-green text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {iv.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">Diatonic Chords</h3>
        <DiatonicChordBar />
      </div>

      <p className="text-xs text-gray-400 text-center mt-2 max-w-lg mx-auto">
        Three rings: inner (pitch classes), middle (major keys), outer (relative minor keys).
        Click any segment to set the key; green = root, blue tint = dominant/subdominant, pink tint = other diatonic.
        Use the arrows to step through keys by the selected interval (default: circle of fifths).
        Click chord buttons below to hear diatonic arpeggios.
      </p>
    </div>
  );
}
