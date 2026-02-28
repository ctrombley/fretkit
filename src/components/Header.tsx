import { Guitar, Music, LayoutGrid, Orbit, AudioWaveform, Triangle, Sliders, Minus } from 'lucide-react';
import { useStore } from '../store';

export default function Header() {
  const view = useStore(s => s.view);
  const navigate = useStore(s => s.navigate);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Guitar size={24} className="text-magenta" />
        <span className="text-lg font-semibold text-dark">Fretkit</span>
      </div>
      <nav className="ml-4 sm:ml-8 flex gap-1 overflow-x-auto flex-1 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => navigate({ name: 'sandbox' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'sandbox'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid size={16} />
          <span className="hidden sm:inline">Sandbox</span>
        </button>
        <button
          onClick={() => navigate({ name: 'songList' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'songList' || view.name === 'songDetail'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Music size={16} />
          <span className="hidden sm:inline">Songs</span>
        </button>
        <button
          onClick={() => navigate({ name: 'spiral' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'spiral'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Orbit size={16} />
          <span className="hidden sm:inline">Spiral</span>
        </button>
        <button
          onClick={() => navigate({ name: 'overtones' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'overtones'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AudioWaveform size={16} />
          <span className="hidden sm:inline">Overtones</span>
        </button>
        <button
          onClick={() => navigate({ name: 'coltrane' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'coltrane'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Triangle size={16} />
          <span className="hidden sm:inline">Coltrane</span>
        </button>
        <button
          onClick={() => navigate({ name: 'synth' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'synth'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sliders size={16} />
          <span className="hidden sm:inline">Synth</span>
        </button>
        <button
          onClick={() => navigate({ name: 'monochord' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'monochord'
              ? 'bg-gray-100 text-dark'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Minus size={16} />
          <span className="hidden sm:inline">Monochord</span>
        </button>
      </nav>
    </header>
  );
}
