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
      <select
        value={timbre}
        onChange={e => setTimbre(e.target.value as MetronomeTimbre)}
        className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
      >
        {TIMBRES.map(({ id, label }) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
    </div>
  );
}
