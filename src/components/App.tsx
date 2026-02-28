import { useStore } from '../store';
import Header from './Header';
import FretboardSection from './FretboardSection';
import Sidebar from './Sidebar';
import ControlPanel from './ControlPanel';
import { Plus } from 'lucide-react';

export default function App() {
  const fretboards = useStore(s => s.fretboards);
  const settings = useStore(s => s.settings);
  const createFretboard = useStore(s => s.createFretboard);

  const activeFretboard = fretboards[settings.settingsId];

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar
        open={settings.sidebarOpen}
        onClose={() => useStore.getState().updateSettings({ sidebarOpen: false })}
      >
        {activeFretboard && <ControlPanel />}
      </Sidebar>
      <main className="pt-14 px-4 max-w-7xl mx-auto">
        {Object.keys(fretboards).map(id => (
          <FretboardSection key={id} id={id} />
        ))}
        <div className="mt-4 mb-8">
          <button
            onClick={createFretboard}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Add fretboard"
          >
            <Plus size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
