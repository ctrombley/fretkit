import { useStore } from '../store';
import { noteName, usesSharps } from '../lib/harmony';
import HarmonicSpiral from './HarmonicSpiral';
import DiatonicChordBar from './DiatonicChordBar';

export default function SpiralView() {
  const spiralRoot = useStore(s => s.spiralRoot);
  const spiralMode = useStore(s => s.spiralMode);
  const setSpiralMode = useStore(s => s.setSpiralMode);

  const preferSharps = usesSharps(spiralRoot);
  const keyName = `${noteName(spiralRoot, preferSharps)} ${spiralMode}`;

  return (
    <div className="pt-14 px-4 pb-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mt-6 mb-4">
        <h2 className="text-2xl font-bold text-dark">{keyName}</h2>
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

      <HarmonicSpiral />

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">Diatonic Chords</h3>
        <DiatonicChordBar />
      </div>
    </div>
  );
}
