import { useStore } from '../store';
import type { ChordConfig } from '../types';
import tunings from '../lib/tunings';

interface ChordEditorProps {
  songId: string;
  chord: ChordConfig;
}

export default function ChordEditor({ songId, chord }: ChordEditorProps) {
  const updateSongChord = useStore(s => s.updateSongChord);

  const update = (data: Partial<ChordConfig>) => updateSongChord(songId, chord.id, data);

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
            update({ searchStr, sequenceIdx: 0, inversion: 0 });
          }}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-fret-blue focus:border-transparent"
        />
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
    </div>
  );
}
