import { useStore } from '../store';
import tunings from '../lib/tunings';

export default function ControlPanel() {
  const settings = useStore(s => s.settings);
  const fretboard = useStore(s => s.fretboards[s.settings.settingsId]);
  const updateFretboard = useStore(s => s.updateFretboard);
  const searchAction = useStore(s => s.search);

  if (!fretboard) return null;

  const id = settings.settingsId;

  const sequenceControlDisabled = !fretboard.sequenceEnabled || !fretboard.sequences.length;
  const prevDisabled = sequenceControlDisabled || fretboard.sequenceIdx === 0;
  const nextDisabled = sequenceControlDisabled || fretboard.sequenceIdx === fretboard.sequences.length - 1;

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

      <div className="grid grid-cols-2 gap-3">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Fret Count</label>
          <input
            type="number"
            min={1}
            max={24}
            value={fretboard.fretCount}
            onChange={e => updateFretboard(id, { fretCount: parseInt(e.target.value, 10) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
          />
        </div>
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

      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fretboard.sequenceEnabled}
            disabled={!fretboard.sequences.length}
            onChange={e => updateFretboard(id, { sequenceEnabled: e.target.checked })}
            className="rounded border-gray-300 text-fret-blue focus:ring-fret-blue"
          />
          <span className="font-medium text-gray-700">Sequence mode</span>
        </label>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            type="number"
            min={1}
            max={24}
            disabled={sequenceControlDisabled}
            value={fretboard.position}
            onChange={e => updateFretboard(id, { position: parseInt(e.target.value, 10) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateFretboard(id, { sequenceIdx: (fretboard.sequenceIdx ?? 1) - 1 })}
            disabled={prevDisabled}
            className="flex-1 px-3 py-1.5 text-sm border border-fret-blue text-fret-blue rounded-md hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => updateFretboard(id, { sequenceIdx: (fretboard.sequenceIdx ?? -1) + 1 })}
            disabled={nextDisabled}
            className="flex-1 px-3 py-1.5 text-sm border border-fret-blue text-fret-blue rounded-md hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
