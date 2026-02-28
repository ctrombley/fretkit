import { Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store';
import type { MetronomeTimbre } from '../lib/metronome';
import SynthKnob from './SynthKnob';

const TIMBRES: { id: MetronomeTimbre; label: string }[] = [
  { id: 'click', label: 'Click' },
  { id: 'wood', label: 'Wood' },
  { id: 'beep', label: 'Beep' },
  { id: 'cowbell', label: 'Bell' },
];

export default function MetronomeControls() {
  const volume = useStore(s => s.metronomeVolume);
  const muted = useStore(s => s.metronomeMuted);
  const timbre = useStore(s => s.metronomeTimbre);
  const setVolume = useStore(s => s.setMetronomeVolume);
  const setMuted = useStore(s => s.setMetronomeMuted);
  const setTimbre = useStore(s => s.setMetronomeTimbre);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMuted(!muted)}
        className={`p-1.5 rounded transition-colors ${
          muted ? 'text-gray-400' : 'text-fret-green'
        }`}
        aria-label={muted ? 'Unmute metronome' : 'Mute metronome'}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <SynthKnob
        label=""
        value={volume}
        min={0}
        max={1}
        onChange={setVolume}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        size={36}
      />
      <div className="flex gap-0.5">
        {TIMBRES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTimbre(id)}
            className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded transition-colors ${
              timbre === id
                ? 'bg-gray-200 text-fret-green'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
