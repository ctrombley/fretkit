import { useStore } from '../store';
import Fretboard from './Fretboard';
import FretboardLabel from './FretboardLabel';
import { X, Settings } from 'lucide-react';

interface FretboardSectionProps {
  id: string;
}

export default function FretboardSection({ id }: FretboardSectionProps) {
  const fretboard = useStore(s => s.fretboards[id]);
  const settings = useStore(s => s.settings);
  const deleteFretboard = useStore(s => s.deleteFretboard);
  const openSettings = useStore(s => s.openSettings);

  if (!fretboard) return null;

  const isSelected = settings.settingsId === id && settings.sidebarOpen;

  return (
    <div
      className={`relative overflow-hidden rounded-lg my-4 p-2 transition-all ${
        isSelected ? 'ring-2 ring-fret-blue' : ''
      }`}
    >
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={() => deleteFretboard(id)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Delete fretboard"
        >
          <X size={16} />
        </button>
        <button
          onClick={() => openSettings(id)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fretboard settings"
        >
          <Settings size={16} />
        </button>
      </div>
      <FretboardLabel
        current={fretboard.current}
        sequenceEnabled={fretboard.sequenceEnabled}
        sequences={fretboard.sequences}
        sequenceIdx={fretboard.sequenceIdx}
      />
      <Fretboard
        fretCount={fretboard.fretCount}
        litNotes={fretboard.litNotes}
        startingFret={fretboard.startingFret}
        tuning={fretboard.tuning}
        current={fretboard.current}
        sequences={fretboard.sequences}
        sequenceEnabled={fretboard.sequenceEnabled}
        sequenceIdx={fretboard.sequenceIdx}
      />
    </div>
  );
}
