import { useCallback, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, ChevronDown, ChevronUp, OctagonX } from 'lucide-react';
import { useStore } from '../store';
import { getMetronome } from '../lib/metronome';
import { getArpeggiator } from '../lib/arpeggiator';
import { getSynth } from '../lib/synth';
import type { MetronomeTimbre } from '../lib/metronome';
import type { LfoTargetParam } from '../lib/synth';
import SynthKnob from './SynthKnob';

function StereoVU() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const barW = 6;
    const gap = 2;
    const bars = 5;
    const barH = Math.floor((H - (bars - 1)) / bars);

    const draw = () => {
      const { left, right } = getSynth().getStereoLevels();
      ctx.clearRect(0, 0, W, H);

      for (const [ch, level] of [[0, left], [1, right]] as [number, number][]) {
        const x = ch * (barW + gap);
        for (let i = 0; i < bars; i++) {
          const threshold = (i + 1) / bars;
          const y = H - (i + 1) * (barH + 1);
          const lit = level >= threshold - 0.1;
          if (i >= 4) ctx.fillStyle = lit ? '#EF4444' : '#4B1113';
          else if (i >= 3) ctx.fillStyle = lit ? '#EAB308' : '#3D3510';
          else ctx.fillStyle = lit ? '#22C55E' : '#0D3320';
          ctx.fillRect(x, y, barW, barH);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} width={14} height={19} className="flex-shrink-0" />;
}

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
  const delayPingPong = useStore(s => s.synthDelayPingPong);
  const lfo1Target = useStore(s => s.synthLfo1Target);
  const lfo2Target = useStore(s => s.synthLfo2Target);
  const killAllNotes = useStore(s => s.killAllNotes);
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
      arp.onNotePlayed = null;
      arp.stopFreeRunning();
      return;
    }

    arp.onNotePlayed = (semitones) => {
      useStore.setState(s => ({ arpStrikeNote: semitones, arpStrikeCount: s.arpStrikeCount + 1 }));
    };

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
      arp.onNotePlayed = null;
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

  // Wire up LFO → BPM modulation callback
  useEffect(() => {
    getSynth().onBpmModulation = (modBpm) => setBpm(modBpm);
    return () => { getSynth().onBpmModulation = null; };
  }, [setBpm]);

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
        <button
          onClick={killAllNotes}
          className="p-1.5 rounded text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
          title="Kill all notes"
        >
          <OctagonX size={16} />
        </button>
        <StereoVU />
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
        <button
          onClick={() => setSynthParam('delayPingPong', !delayPingPong)}
          className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded transition-colors ${
            delayPingPong
              ? 'bg-gray-200 text-fret-green'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title="Ping pong delay"
        >
          PP
        </button>
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
