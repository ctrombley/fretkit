import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import Chord from '../lib/Chord';
import { optimalStartingFret } from '../lib/fretboardUtils';
import tunings from '../lib/tunings';

export default function ControlPanel() {
  const settings = useStore(s => s.settings);
  const fretboard = useStore(s => s.fretboards[s.settings.settingsId]);
  const updateFretboard = useStore(s => s.updateFretboard);
  const searchAction = useStore(s => s.search);

  const [arrowMode, setArrowMode] = useState<'voicing' | 'inversion'>('voicing');

  if (!fretboard) return null;

  const id = settings.settingsId;

  // Compute maxInversions from current chord
  let maxInversions = 0;
  if (fretboard.current?.type === 'Chord' && fretboard.searchStr) {
    try {
      const chordObj = new Chord(fretboard.searchStr);
      maxInversions = chordObj.maxInversions;
    } catch { /* ignore */ }
  }

  const isVoicing = arrowMode === 'voicing';
  const prevDisabled = isVoicing
    ? !fretboard.sequenceEnabled || !fretboard.sequences.length || fretboard.sequenceIdx === 0
    : fretboard.inversion <= 0;
  const nextDisabled = isVoicing
    ? !fretboard.sequenceEnabled || !fretboard.sequences.length || fretboard.sequenceIdx === fretboard.sequences.length - 1
    : fretboard.inversion >= maxInversions;

  const handlePrev = () => {
    if (isVoicing) {
      const newIdx = (fretboard.sequenceIdx ?? 1) - 1;
      const seq = fretboard.sequences[newIdx];
      updateFretboard(id, {
        sequenceIdx: newIdx,
        ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretboard.fretCount) } : {}),
      });
    } else {
      const newInversion = Math.max(0, fretboard.inversion - 1);
      updateFretboard(id, { inversion: newInversion });
      // Re-run search with new inversion
      searchAction(id, fretboard.searchStr);
    }
  };

  const handleNext = () => {
    if (isVoicing) {
      const newIdx = (fretboard.sequenceIdx ?? -1) + 1;
      const seq = fretboard.sequences[newIdx];
      updateFretboard(id, {
        sequenceIdx: newIdx,
        ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretboard.fretCount) } : {}),
      });
    } else {
      const newInversion = Math.min(maxInversions, fretboard.inversion + 1);
      updateFretboard(id, { inversion: newInversion });
      // Re-run search with new inversion
      searchAction(id, fretboard.searchStr);
    }
  };

  const hasArrows = fretboard.sequences.length > 0 || maxInversions > 0;

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
        <input
          type="search"
          placeholder="Chord or scale (e.g. C major)"
          value={fretboard.searchStr}
          onChange={e => searchAction(id, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Fret</label>
        <input
          type="number"
          min={1}
          max={24}
          value={fretboard.startingFret}
          onChange={e => updateFretboard(id, { startingFret: parseInt(e.target.value, 10) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tuning</label>
        <select
          value={fretboard.tuning.join(',')}
          onChange={e => updateFretboard(id, { tuning: e.target.value.split(',') })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
        >
          {Object.entries(tunings).map(([instrument, instrumentTunings]) =>
            Object.entries(instrumentTunings).map(([name, notes]) => (
              <option key={`${instrument}.${name}`} value={notes.join(',')}>
                {instrument} — {name.replace(/_/g, ' ')}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Voicing / Inversion arrows */}
      {hasArrows && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setArrowMode(m => m === 'voicing' ? 'inversion' : 'voicing')}
              className="text-xs font-mono px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title={isVoicing ? 'Voicing mode — click for inversions' : 'Inversion mode — click for voicings'}
            >
              {isVoicing ? 'Voicing' : 'Inversion'}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={prevDisabled}
                className="p-1.5 rounded border border-fret-blue text-fret-blue hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isVoicing ? 'Previous voicing' : 'Previous inversion'}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="p-1.5 rounded border border-fret-blue text-fret-blue hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isVoicing ? 'Next voicing' : 'Next inversion'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
