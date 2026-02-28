import { Guitar, Music, LayoutGrid, Orbit, AudioWaveform, Triangle, Sliders } from 'lucide-react';
import { useStore } from '../store';

export default function Header() {
  const view = useStore(s => s.view);
  const navigate = useStore(s => s.navigate);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Guitar size={24} className="text-magenta" />
        <span className="text-lg font-semibold text-dark">Fretkit</span>
      </div>
      <nav className="ml-8 flex gap-1">
        <button
          onClick={() => navigate({ name: 'sandbox' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'sandbox'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid size={16} />
          Sandbox
        </button>
        <button
          onClick={() => navigate({ name: 'songList' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'songList' || view.name === 'songDetail'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Music size={16} />
          Songs
        </button>
        <button
          onClick={() => navigate({ name: 'spiral' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'spiral'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Orbit size={16} />
          Spiral
        </button>
        <button
          onClick={() => navigate({ name: 'overtones' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'overtones'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AudioWaveform size={16} />
          Overtones
        </button>
        <button
          onClick={() => navigate({ name: 'coltrane' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'coltrane'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Triangle size={16} />
          Coltrane
        </button>
        <button
          onClick={() => navigate({ name: 'synth' })}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'synth'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sliders size={16} />
          Synth
        </button>
      </nav>
    </header>
  );
}
