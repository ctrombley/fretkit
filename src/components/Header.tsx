import { Guitar, Music, LayoutGrid, Orbit, AudioWaveform, Triangle, Sliders, Minus } from 'lucide-react';
import { useStore } from '../store';

function Crossfader() {
  const crossfade = useStore(s => s.samplerCrossfade);
  const setCrossfade = useStore(s => s.setSamplerCrossfade);
  const buses = useStore(s => s.buses);
  const setBusMuted = useStore(s => s.setBusMuted);

  const synthMuted = buses['synth']?.muted ?? false;
  const samplerMuted = buses['sampler']?.muted ?? false;
  const pct = crossfade * 100;

  const trackBg = `linear-gradient(to right,
    ${synthMuted ? '#e5e7eb' : '#111827'} 0%,
    ${synthMuted ? '#e5e7eb' : '#111827'} ${pct}%,
    ${samplerMuted ? '#e5e7eb' : '#7c3aed'} ${pct}%,
    ${samplerMuted ? '#e5e7eb' : '#7c3aed'} 100%)`;

  return (
    <div className="flex items-center gap-2.5 ml-auto flex-shrink-0 pl-3 border-l border-gray-200">
      {/* Synth label — click to mute */}
      <button
        onClick={() => setBusMuted('synth', !synthMuted)}
        title={synthMuted ? 'Unmute synth' : 'Mute synth'}
        className={`text-[10px] font-bold tracking-widest transition-all select-none ${
          synthMuted ? 'text-gray-300 line-through' : 'text-gray-700 hover:text-black'
        }`}
      >
        SYN
      </button>

      {/* Track + thumb */}
      <div className="relative flex items-center w-28">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={crossfade}
          onChange={e => setCrossfade(parseFloat(e.target.value))}
          className="crossfader w-full"
          style={{ background: trackBg }}
        />
        {/* centre notch */}
        <div
          className="absolute left-1/2 -translate-x-px pointer-events-none"
          style={{ top: '50%', transform: 'translate(-50%, -50%)', width: 1, height: 8, background: '#d1d5db' }}
        />
      </div>

      {/* Sampler label — click to mute */}
      <button
        onClick={() => setBusMuted('sampler', !samplerMuted)}
        title={samplerMuted ? 'Unmute sampler' : 'Mute sampler'}
        className={`text-[10px] font-bold tracking-widest transition-all select-none ${
          samplerMuted ? 'text-gray-300 line-through' : 'text-violet-600 hover:text-violet-800'
        }`}
      >
        SMP
      </button>
    </div>
  );
}

export default function Header() {
  const view = useStore(s => s.view);
  const navigate = useStore(s => s.navigate);
  const onSynthView = view.name === 'synth';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Guitar size={24} className="text-magenta" />
        <span className="text-lg font-semibold text-dark">Fretkit</span>
      </div>
      <nav className={`ml-4 sm:ml-8 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${onSynthView ? 'flex-shrink' : 'flex-1'} min-w-0`}>
        <button
          onClick={() => navigate({ name: 'sandbox' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'sandbox' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid size={16} />
          <span className="hidden sm:inline">Sandbox</span>
        </button>
        <button
          onClick={() => navigate({ name: 'songList' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'songList' || view.name === 'songDetail' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Music size={16} />
          <span className="hidden sm:inline">Songs</span>
        </button>
        <button
          onClick={() => navigate({ name: 'spiral' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'spiral' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Orbit size={16} />
          <span className="hidden sm:inline">Spiral</span>
        </button>
        <button
          onClick={() => navigate({ name: 'overtones' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'overtones' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AudioWaveform size={16} />
          <span className="hidden sm:inline">Overtones</span>
        </button>
        <button
          onClick={() => navigate({ name: 'coltrane' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'coltrane' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Triangle size={16} />
          <span className="hidden sm:inline">Coltrane</span>
        </button>
        <button
          onClick={() => navigate({ name: 'synth' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'synth' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sliders size={16} />
          <span className="hidden sm:inline">Synth</span>
        </button>
        <button
          onClick={() => navigate({ name: 'monochord' })}
          className={`flex-shrink-0 p-2.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            view.name === 'monochord' ? 'bg-gray-100 text-dark' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Minus size={16} />
          <span className="hidden sm:inline">Monochord</span>
        </button>
      </nav>

      {onSynthView && <Crossfader />}
    </header>
  );
}
