import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import { getMetronome } from '../lib/metronome';
import { getArpeggiator } from '../lib/arpeggiator';
import type { MetronomeTimbre } from '../lib/metronome';
import type { LfoTargetParam } from '../lib/synth';
import SynthKnob from './SynthKnob';

const TIME_SIGS: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [6, 8],
  [5, 4],
  [7, 8],
];

const TIMBRES: { id: MetronomeTimbre; label: string }[] = [
  { id: 'click', label: 'Click' },
  { id: 'wood', label: 'Wood' },
  { id: 'beep', label: 'Beep' },
  { id: 'cowbell', label: 'Bell' },
];

const SUBDIVISIONS: { value: number; label: string }[] = [
  { value: 1, label: '1/4' },
  { value: 2, label: '1/8' },
  { value: 3, label: 'Trip' },
  { value: 4, label: '1/16' },
];

function lfoFor(param: string, t1: LfoTargetParam, t2: LfoTargetParam): 1 | 2 | null {
  if (t1 === param) return 1;
  if (t2 === param) return 2;
  return null;
}

function formatPan(v: number): string {
  if (Math.abs(v) < 0.05) return 'C';
  return v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`;
}

export default function TransportBar() {
  const playing = useStore(s => s.transportPlaying);
  const bpm = useStore(s => s.transportBpm);
  const beatsPerMeasure = useStore(s => s.transportBeatsPerMeasure);
  const beatUnit = useStore(s => s.transportBeatUnit);
  const currentBeat = useStore(s => s.transportCurrentBeat);
  const volume = useStore(s => s.metronomeVolume);
  const muted = useStore(s => s.metronomeMuted);
  const timbre = useStore(s => s.metronomeTimbre);
  const subdivision = useStore(s => s.metronomeSubdivision);
  const subdivisionAccent = useStore(s => s.metronomeSubdivisionAccent);
  const transportBarOpen = useStore(s => s.transportBarOpen);
  const arpEnabled = useStore(s => s.arpEnabled);
  const arpSync = useStore(s => s.arpSync);
  const arpSyncSpeed = useStore(s => s.arpSyncSpeed);
  const arpFreeMs = useStore(s => s.arpFreeMs);

  // Mixer state
  const masterVolume = useStore(s => s.synthMasterVolume);
  const pan = useStore(s => s.synthPan);
  const reverbSend = useStore(s => s.synthReverbSend);
  const delaySend = useStore(s => s.synthDelaySend);
  const delayTime = useStore(s => s.synthDelayTime);
  const delayFeedback = useStore(s => s.synthDelayFeedback);
  const lfo1Target = useStore(s => s.synthLfo1Target);
  const lfo2Target = useStore(s => s.synthLfo2Target);
  const setSynthParam = useStore(s => s.setSynthParam);
  const setLfoTarget = useStore(s => s.setSynthLfoTarget);

  const setPlaying = useStore(s => s.setTransportPlaying);
  const setBpm = useStore(s => s.setTransportBpm);
  const setTimeSignature = useStore(s => s.setTransportTimeSignature);
  const setBeat = useStore(s => s.setTransportBeat);
  const setVolume = useStore(s => s.setMetronomeVolume);
  const setMuted = useStore(s => s.setMetronomeMuted);
  const setTimbre = useStore(s => s.setMetronomeTimbre);
  const setSubdivision = useStore(s => s.setMetronomeSubdivision);
  const setSubdivisionAccent = useStore(s => s.setMetronomeSubdivisionAccent);
  const setTransportBarOpen = useStore(s => s.setTransportBarOpen);

  const handleLfoDrop = (param: LfoTargetParam, lfoNum: 1 | 2) => {
    setLfoTarget(lfoNum, param);
  };

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Sync metronome engine with store
  useEffect(() => {
    const m = getMetronome();
    m.bpm = bpm;
    m.beatsPerMeasure = beatsPerMeasure;
    m.beatUnit = beatUnit;
    m.volume = volume;
    m.muted = muted;
    m.timbre = timbre;
    m.subdivision = subdivision;
    m.subdivisionAccent = subdivisionAccent;
  }, [bpm, beatsPerMeasure, beatUnit, volume, muted, timbre, subdivision, subdivisionAccent]);

  // Hook up arpeggiator: synced (metronome arp ticks) or free (own timer)
  useEffect(() => {
    const m = getMetronome();
    const arp = getArpeggiator();

    if (!arpEnabled) {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.stopFreeRunning();
      return;
    }

    if (arpSync) {
      arp.stopFreeRunning();
      m.onSubTick = null;
      m.arpTicksPerBeat = arpSyncSpeed;
      m.onArpTick = (time) => arp.tick(time);
    } else {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.startFreeRunning(arpFreeMs);
    }

    return () => {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.stopFreeRunning();
    };
  }, [arpEnabled, arpSync, arpSyncSpeed, arpFreeMs]);

  // Set up onBeat callback
  useEffect(() => {
    const m = getMetronome();
    m.onBeat = (beat, measure) => {
      setBeat(beat, measure);
    };
    return () => {
      m.onBeat = null;
    };
  }, [setBeat]);

  // Handle play/stop
  useEffect(() => {
    const m = getMetronome();
    if (playing) {
      m.start();
    } else {
      m.stop();
      setBeat(0, 0);
    }
    return () => {
      m.stop();
    };
  }, [playing, setBeat]);

  const togglePlay = useCallback(() => {
    setPlaying(!playing);
  }, [playing, setPlaying]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // Reset if gap > 2 seconds
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

  const [bpmInput, setBpmInput] = useState(String(bpm));
  useEffect(() => {
    setBpmInput(String(bpm));
  }, [bpm]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpmInput(e.target.value);
  };

  const handleBpmBlur = () => {
    const val = parseInt(bpmInput, 10);
    if (!isNaN(val) && val >= 30 && val <= 300) {
      setBpm(val);
    } else {
      setBpmInput(String(bpm));
    }
  };

  const handleBpmKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleTimeSigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [beats, unit] = e.target.value.split('/').map(Number);
    setTimeSignature(beats!, unit!);
  };

  // Beat indicator dots
  const dots = [];
  for (let i = 0; i < beatsPerMeasure; i++) {
    const isActive = playing && i === currentBeat;
    const isAccent = i === 0;
    dots.push(
      <div
        key={i}
        className={`rounded-full transition-all duration-75 ${
          isActive
            ? isAccent
              ? 'w-3 h-3 bg-magenta beat-pulse'
              : 'w-3 h-3 bg-fret-green beat-pulse'
            : 'w-2.5 h-2.5 bg-gray-300'
        }`}
      />,
    );
  }

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
    <div className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-gray-50 border-t border-gray-200 flex items-center px-4 gap-4 shadow-sm">
      {/* Play/Stop */}
      <button
        onClick={togglePlay}
        className={`p-2 rounded-md transition-colors ${
          playing
            ? 'bg-magenta text-white'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        aria-label={playing ? 'Stop' : 'Play'}
      >
        {playing ? <Square size={16} /> : <Play size={16} />}
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* BPM */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={bpmInput}
          onChange={handleBpmChange}
          onBlur={handleBpmBlur}
          onKeyDown={handleBpmKeyDown}
          className="w-12 text-center text-sm font-mono bg-white border border-gray-200 rounded px-1 py-0.5"
        />
        <span className="text-[9px] uppercase tracking-wider text-gray-400">BPM</span>
        <button
          onClick={handleTap}
          className="px-2 py-1 text-[10px] uppercase tracking-wider rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
        >
          Tap
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

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

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Beat dots */}
      <div className="flex items-center gap-1.5">
        {dots}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Subdivisions */}
      <div className="flex items-center gap-1">
        {SUBDIVISIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSubdivision(value)}
            className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded transition-colors ${
              subdivision === value
                ? 'bg-gray-200 text-fret-green'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
        {subdivision > 1 && (
          <button
            onClick={() => setSubdivisionAccent(!subdivisionAccent)}
            className={`px-1 py-0.5 text-[8px] uppercase tracking-wider rounded transition-colors ${
              subdivisionAccent
                ? 'bg-gray-200 text-fret-green'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Subdivision accent clicks"
          >
            Acc
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Metronome controls */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Compact Mixer */}
      <div className="flex items-center gap-1">
        <SynthKnob
          label="Master"
          value={masterVolume}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('masterVolume', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          size={32}
          color="#F73667"
          paramKey="masterVolume"
          lfoTargeting={lfoFor('masterVolume', lfo1Target, lfo2Target)}
          onDrop={(lfo) => handleLfoDrop('masterVolume', lfo)}
        />
        <SynthKnob
          label="Pan"
          value={pan}
          min={-1}
          max={1}
          onChange={(v) => setSynthParam('pan', v)}
          formatValue={formatPan}
          size={32}
          color="#00C4CC"
          paramKey="pan"
          lfoTargeting={lfoFor('pan', lfo1Target, lfo2Target)}
          onDrop={(lfo) => handleLfoDrop('pan', lfo)}
        />
        <SynthKnob
          label="Reverb"
          value={reverbSend}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('reverbSend', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          size={32}
          color="#00C4CC"
          paramKey="reverbSend"
          lfoTargeting={lfoFor('reverbSend', lfo1Target, lfo2Target)}
          onDrop={(lfo) => handleLfoDrop('reverbSend', lfo)}
        />
        <SynthKnob
          label="Delay"
          value={delaySend}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('delaySend', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          size={32}
          color="#00C4CC"
          paramKey="delaySend"
          lfoTargeting={lfoFor('delaySend', lfo1Target, lfo2Target)}
          onDrop={(lfo) => handleLfoDrop('delaySend', lfo)}
        />
        <SynthKnob
          label="D.Time"
          value={delayTime}
          min={0.05}
          max={1}
          onChange={(v) => setSynthParam('delayTime', v)}
          formatValue={(v) => `${Math.round(v * 1000)}ms`}
          size={32}
          color="#00C4CC"
          paramKey="delayTime"
        />
        <SynthKnob
          label="D.Fdbk"
          value={delayFeedback}
          min={0}
          max={0.9}
          onChange={(v) => setSynthParam('delayFeedback', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          size={32}
          color="#00C4CC"
          paramKey="delayFeedback"
        />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setTransportBarOpen(false)}
        className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Collapse transport"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}
