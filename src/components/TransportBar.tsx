import { useCallback, useRef, useState } from 'react';
import { Play, Square, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store';
import { lfoFor } from '../lib/synthUtils';
import type { LfoTargetParam } from '../lib/synth';
import { useTransportEngine } from '../hooks/useTransportEngine';
import SynthKnob from './SynthKnob';
import BeatIndicator from './BeatIndicator';
import SubdivisionSelector from './SubdivisionSelector';
import MetronomeControls from './MetronomeControls';
import TransportMixer from './TransportMixer';
import MixerPanel from './MixerPanel';

const TIME_SIGS: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [6, 8],
  [5, 4],
  [7, 8],
];

export default function TransportBar() {
  const [showMixer, setShowMixer] = useState(false);
  const playing = useStore(s => s.transportPlaying);
  const bpm = useStore(s => s.transportBpm);
  const beatsPerMeasure = useStore(s => s.transportBeatsPerMeasure);
  const beatUnit = useStore(s => s.transportBeatUnit);
  const currentBeat = useStore(s => s.transportCurrentBeat);
  const transportBarOpen = useStore(s => s.transportBarOpen);
  const lfo1Target = useStore(s => s.synthLfo1Target);
  const lfo2Target = useStore(s => s.synthLfo2Target);

  const setPlaying = useStore(s => s.setTransportPlaying);
  const setBpm = useStore(s => s.setTransportBpm);
  const setTimeSignature = useStore(s => s.setTransportTimeSignature);
  const setTransportBarOpen = useStore(s => s.setTransportBarOpen);
  const setLfoTarget = useStore(s => s.setSynthLfoTarget);

  useTransportEngine();

  const tapTimesRef = useRef<number[]>([]);

  const togglePlay = useCallback(() => {
    setPlaying(!playing);
  }, [playing, setPlaying]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1]! > 2000) {
      taps.length = 0;
    }

    taps.push(now);
    if (taps.length > 6) taps.shift();

    if (taps.length >= 2) {
      let totalInterval = 0;
      for (let i = 1; i < taps.length; i++) {
        totalInterval += taps[i]! - taps[i - 1]!;
      }
      const avgInterval = totalInterval / (taps.length - 1);
      const newBpm = Math.round(Math.max(30, Math.min(300, 60000 / avgInterval)));
      setBpm(newBpm);
    }
  }, [setBpm]);

  const handleLfoDrop = (param: LfoTargetParam, lfoNum: 1 | 2) => {
    setLfoTarget(lfoNum, param);
  };

  const handleTimeSigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [beats, unit] = e.target.value.split('/').map(Number);
    setTimeSignature(beats!, unit!);
  };

  if (!transportBarOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 h-7 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <span className="text-[9px] uppercase tracking-wider text-gray-400">Transport</span>
        <button
          onClick={() => setTransportBarOpen(true)}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Expand transport"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:h-20 bg-gray-50 border-t border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center px-3 sm:px-4 py-2 sm:py-0 gap-1.5 sm:gap-4">

      {/* Row 1: core playback — dissolves into main row on sm+ */}
      <div className="flex items-center gap-2 sm:contents">
        {/* Play/Stop */}
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 p-2 rounded-md transition-colors ${
            playing
              ? 'bg-magenta text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          aria-label={playing ? 'Stop' : 'Play'}
        >
          {playing ? <Square size={16} /> : <Play size={16} />}
        </button>

        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        {/* BPM */}
        <div className="flex items-center gap-2">
          <SynthKnob
            label="BPM"
            value={bpm}
            min={30}
            max={300}
            onChange={(v) => setBpm(Math.round(v))}
            formatValue={(v) => String(Math.round(v))}
            size={36}
            color="#F73667"
            paramKey="bpm"
            lfoTargeting={lfoFor('bpm', lfo1Target, lfo2Target)}
            onDrop={(lfo) => handleLfoDrop('bpm' as LfoTargetParam, lfo)}
          />
          <button
            onClick={handleTap}
            className="px-2 py-1 text-[10px] uppercase tracking-wider rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            Tap
          </button>
        </div>

        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        {/* Time Sig */}
        <select
          value={`${beatsPerMeasure}/${beatUnit}`}
          onChange={handleTimeSigChange}
          className="text-sm bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
        >
          {TIME_SIGS.map(([b, u]) => (
            <option key={`${b}/${u}`} value={`${b}/${u}`}>
              {b}/{u}
            </option>
          ))}
        </select>

        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        <BeatIndicator beatsPerMeasure={beatsPerMeasure} currentBeat={currentBeat} playing={playing} />
      </div>

      {/* Row 2: secondary controls — dissolves into main row on sm+ */}
      <div className="flex items-center gap-2 sm:contents">
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        <SubdivisionSelector />

        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        <MetronomeControls />

        <div className="flex-1" />

        <div className="w-px h-8 bg-gray-200 hidden sm:block" />

        <TransportMixer onOpenMixer={() => setShowMixer(true)} />

        {/* Mixer button */}
        <button
          onClick={() => setShowMixer(v => !v)}
          className={`p-1 rounded transition-colors ${
            showMixer
              ? 'text-magenta bg-magenta/10'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          aria-label="Toggle mixer"
          title="Mixer"
        >
          <SlidersHorizontal size={14} />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setTransportBarOpen(false)}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Collapse transport"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <MixerPanel open={showMixer} onClose={() => setShowMixer(false)} />
    </div>
  );
}
