import { useStore } from '../store';
import type { ChordConfig } from '../types';
import tunings from '../lib/tunings';
import useChordDerived from '../hooks/useChordDerived';

interface ChordEditorProps {
  songId: string;
  chord: ChordConfig;
}

export default function ChordEditor({ songId, chord }: ChordEditorProps) {
  const updateSongChord = useStore(s => s.updateSongChord);
  const { sequences } = useChordDerived(chord);

  const update = (data: Partial<ChordConfig>) => updateSongChord(songId, chord.id, data);

  const sequenceControlDisabled = !chord.sequenceEnabled || !sequences.length;
  const prevDisabled = sequenceControlDisabled || chord.sequenceIdx === 0;
  const nextDisabled = sequenceControlDisabled || chord.sequenceIdx === sequences.length - 1;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
        <input
          type="text"
          placeholder="e.g. Intro, Verse"
          value={chord.label ?? ''}
          onChange={e => update({ label: e.target.value || undefined })}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Chord / Scale</label>
        <input
          type="search"
          placeholder="e.g. C major, Am7"
          value={chord.searchStr}
          onChange={e => {
            const searchStr = e.target.value;
            // Reset sequence when search changes
            update({ searchStr, sequenceIdx: 0 });
          }}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Starting Fret</label>
          <input
            type="number"
            min={1}
            max={24}
            value={chord.startingFret}
            onChange={e => update({ startingFret: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fret Count</label>
          <input
            type="number"
            min={1}
            max={24}
            value={chord.fretCount}
            onChange={e => update({ fretCount: parseInt(e.target.value, 10) || 12 })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tuning</label>
        <select
          value={chord.tuning.join(',')}
          onChange={e => update({ tuning: e.target.value.split(',') })}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue"
        >
          {Object.entries(tunings).map(([instrument, instrumentTunings]) =>
            Object.entries(instrumentTunings).map(([name, notes]) => (
              <option key={`${instrument}.${name}`} value={notes.join(',')}>
                {instrument} — {name.replace(/_/g, ' ')}
              </option>
            )),
          )}
        </select>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={chord.sequenceEnabled}
            disabled={!sequences.length}
            onChange={e => update({ sequenceEnabled: e.target.checked })}
            className="rounded border-gray-300 text-fret-blue focus:ring-fret-blue"
          />
          <span className="text-xs font-medium text-gray-600">Sequence mode</span>
        </label>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
            <input
              type="number"
              min={1}
              max={24}
              disabled={sequenceControlDisabled}
              value={chord.position}
              onChange={e => update({ position: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => update({ sequenceIdx: (chord.sequenceIdx ?? 1) - 1 })}
            disabled={prevDisabled}
            className="self-end px-2 py-1.5 text-xs border border-fret-blue text-fret-blue rounded hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => update({ sequenceIdx: (chord.sequenceIdx ?? -1) + 1 })}
            disabled={nextDisabled}
            className="self-end px-2 py-1.5 text-xs border border-fret-blue text-fret-blue rounded hover:bg-fret-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
