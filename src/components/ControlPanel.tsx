import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Dice5 } from 'lucide-react';
import { useStore } from '../store';
import Chord from '../lib/Chord';
import { optimalStartingFret } from '../lib/fretboardUtils';
import tunings from '../lib/tunings';
import { FACTORY_SAMPLER_PRESETS } from '../lib/samplerPresets';
import TuningEditor from './TuningEditor';

export default function ControlPanel() {
  const settings = useStore(s => s.settings);
  const fretboard = useStore(s => s.fretboards[s.settings.settingsId]);
  const updateFretboard = useStore(s => s.updateFretboard);
  const searchAction = useStore(s => s.search);

  const deleteFretboard = useStore(s => s.deleteFretboard);
  const randomizeFretboard = useStore(s => s.randomizeFretboard);

  const arpEnabled = useStore(s => s.arpEnabled);
  const loadVoicingIntoArp = useStore(s => s.loadVoicingIntoArp);
  const setFretboardSoundPreset = useStore(s => s.setFretboardSoundPreset);
  const synthPresets = useStore(s => s.synthPresets);
  const samplerPresets = useStore(s => s.samplerPresets);

  const [arrowMode, setArrowMode] = useState<'voicing' | 'inversion'>('voicing');
  const [editingTuning, setEditingTuning] = useState(false);

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
    ? !fretboard.sequenceEnabled || !(fretboard.sequences ?? []).length || fretboard.sequenceIdx === 0
    : fretboard.inversion <= 0;
  const nextDisabled = isVoicing
    ? !fretboard.sequenceEnabled || !(fretboard.sequences ?? []).length || fretboard.sequenceIdx === (fretboard.sequences ?? []).length - 1
    : fretboard.inversion >= maxInversions;

  const handlePrev = () => {
    if (isVoicing) {
      const newIdx = (fretboard.sequenceIdx ?? 1) - 1;
      const seq = fretboard.sequences[newIdx];
      updateFretboard(id, {
        sequenceIdx: newIdx,
        ...(seq ? { startingFret: optimalStartingFret(seq, 1, fretboard.fretCount) } : {}),
      });
      if (arpEnabled) loadVoicingIntoArp(id, newIdx);
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
      if (arpEnabled) loadVoicingIntoArp(id, newIdx);
    } else {
      const newInversion = Math.min(maxInversions, fretboard.inversion + 1);
      updateFretboard(id, { inversion: newInversion });
      // Re-run search with new inversion
      searchAction(id, fretboard.searchStr);
    }
  };

  const hasArrows = (fretboard.sequences ?? []).length > 0 || maxInversions > 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Fretboard actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => randomizeFretboard(id)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          title="Pick a random chord or scale"
        >
          <Dice5 size={13} />
          Randomize
        </button>
        <button
          onClick={() => deleteFretboard(id)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete this fretboard"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>

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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Tuning</label>
          <button
            onClick={() => setEditingTuning(!editingTuning)}
            className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
              editingTuning
                ? 'bg-gray-200 text-fret-blue'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Edit
          </button>
        </div>
        <select
          value={(fretboard.tuning ?? tunings['guitar']!['standard']!).join(',')}
          onChange={e => {
            updateFretboard(id, { tuning: e.target.value.split(',') });
            setEditingTuning(false);
          }}
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

      {editingTuning && (
        <TuningEditor
          tuning={fretboard.tuning}
          onChange={t => updateFretboard(id, { tuning: t })}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sound</label>
        <select
          value={fretboard.soundPreset || ''}
          onChange={e => setFretboardSoundPreset(id, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
        >
          <optgroup label="Synth">
            {synthPresets.filter(p => p.isFactory).map((p, i) => (
              <option key={`sf${i}`} value={p.name}>{p.name}</option>
            ))}
            {synthPresets.filter(p => !p.isFactory).map((p, i) => (
              <option key={`su${i}`} value={p.name}>{p.name}</option>
            ))}
          </optgroup>
          <optgroup label="Sampler">
            {FACTORY_SAMPLER_PRESETS.map((p, i) => (
              <option key={`ssf${i}`} value={p.name}>{p.name}</option>
            ))}
            {samplerPresets.map((p, i) => (
              <option key={`ssu${i}`} value={p.name}>{p.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Fret layout (EDO mode) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Fret layout</label>
          <button
            onClick={() => updateFretboard(id, {
              edoMode: fretboard.edoMode === 'angine' ? '12' : 'angine',
            })}
            className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
              fretboard.edoMode === 'angine'
                ? 'bg-gray-200 text-fret-blue'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {fretboard.edoMode === 'angine' ? '24-EDO' : '12-EDO'}
          </button>
        </div>
      </div>

      {/* String labels toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">String labels</label>
        <button
          onClick={() => updateFretboard(id, { showStringLabels: !fretboard.showStringLabels })}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
            fretboard.showStringLabels
              ? 'bg-gray-200 text-fret-green'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {fretboard.showStringLabels ? 'On' : 'Off'}
        </button>
      </div>

      {/* Enharmonic: same note on other strings */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Show enharmonic</label>
        <button
          onClick={() => updateFretboard(id, { showEnharmonic: !fretboard.showEnharmonic })}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
            fretboard.showEnharmonic
              ? 'bg-gray-200 text-fret-green'
              : 'bg-gray-100 text-gray-500'
          }`}
          title="Highlight the same note on other strings when active"
        >
          {fretboard.showEnharmonic ? 'On' : 'Off'}
        </button>
      </div>

      {/* Octaves: all octave equivalents */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Show octaves</label>
        <button
          onClick={() => updateFretboard(id, { showOctaves: !fretboard.showOctaves })}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
            fretboard.showOctaves
              ? 'bg-gray-200 text-fret-green'
              : 'bg-gray-100 text-gray-500'
          }`}
          title="Highlight all octave equivalents of the active note"
        >
          {fretboard.showOctaves ? 'On' : 'Off'}
        </button>
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
