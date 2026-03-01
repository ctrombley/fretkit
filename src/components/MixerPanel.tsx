import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, X, Gauge } from 'lucide-react';
import { useStore } from '../store';
import { getMasterBus, BUS_IDS } from '../lib/masterBus';

// ── Mini VU bar for one channel strip ─────────────────────────────────────

function BusVU({ busId }: { busId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const bars = 8;
    const barH = Math.floor((H - (bars - 1)) / bars);

    const draw = () => {
      const level = getMasterBus().getBus(busId).getRmsLevel();

      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < bars; i++) {
        const threshold = (i + 1) / bars;
        const y = H - (i + 1) * (barH + 1);
        const lit = level >= threshold - 0.1;
        if (i >= 6) ctx.fillStyle = lit ? '#EF4444' : '#3a1111';
        else if (i >= 5) ctx.fillStyle = lit ? '#EAB308' : '#2a2500';
        else ctx.fillStyle = lit ? '#22C55E' : '#0a2010';
        ctx.fillRect(0, y, W, barH);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [busId]);

  return <canvas ref={canvasRef} width={6} height={64} className="flex-shrink-0" />;
}

// ── Master VU (stereo) ────────────────────────────────────────────────────

function MasterVU() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const bars = 10;
    const barW = 7;
    const gap = 2;
    const barH = Math.floor((H - (bars - 1)) / bars);

    const draw = () => {
      const { left, right } = getMasterBus().getStereoLevels();
      ctx.clearRect(0, 0, W, H);

      for (const [ch, level] of [[0, left], [1, right]] as [number, number][]) {
        const x = ch * (barW + gap);
        for (let i = 0; i < bars; i++) {
          const threshold = (i + 1) / bars;
          const y = H - (i + 1) * (barH + 1);
          const lit = level >= threshold - 0.08;
          if (i >= 8) ctx.fillStyle = lit ? '#EF4444' : '#3a1111';
          else if (i >= 6) ctx.fillStyle = lit ? '#EAB308' : '#2a2500';
          else ctx.fillStyle = lit ? '#22C55E' : '#0a2010';
          ctx.fillRect(x, y, barW, barH);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} width={16} height={80} className="flex-shrink-0" />;
}

// ── Vertical fader ────────────────────────────────────────────────────────

interface FaderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function Fader({ value, onChange, disabled = false }: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getValueFromY = (clientY: number): number => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    return Math.max(0, Math.min(1, ratio));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(getValueFromY(e.clientY));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    onChange(getValueFromY(e.clientY));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const thumbPct = (1 - value) * 100;

  return (
    <div
      ref={trackRef}
      className={`relative w-3 h-16 rounded-full cursor-pointer select-none ${disabled ? 'opacity-40' : ''}`}
      style={{ background: 'linear-gradient(to top, #1e293b, #334155)' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Filled track */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        style={{
          height: `${value * 100}%`,
          background: 'linear-gradient(to top, #F73667, #ff6b8e)',
        }}
      />
      {/* Thumb */}
      <div
        className="absolute left-1/2 w-4 h-1.5 rounded-sm shadow-md"
        style={{
          top: `${thumbPct}%`,
          transform: 'translate(-50%, -50%)',
          background: '#f8fafc',
          border: '1px solid #94a3b8',
        }}
      />
    </div>
  );
}

// ── Channel strip ─────────────────────────────────────────────────────────

const BUS_LABELS: Record<string, string> = {
  sandbox: 'Sandbox',
  songs: 'Songs',
  spiral: 'Spiral',
  overtones: 'Overtones',
  coltrane: 'Coltrane',
  synth: 'Synth',
  monochord: 'Mono',
  metronome: 'Metro',
};

interface ChannelStripProps {
  busId: string;
}

function ChannelStrip({ busId }: ChannelStripProps) {
  const buses = useStore(s => s.buses);
  const setBusVolume = useStore(s => s.setBusVolume);
  const setBusMuted = useStore(s => s.setBusMuted);

  const bs = buses[busId] ?? { volume: 1, muted: false };

  return (
    <div className="flex flex-col items-center gap-1.5 px-1.5 min-w-[44px]">
      <BusVU busId={busId} />
      <Fader
        value={bs.volume}
        onChange={(v) => setBusVolume(busId, v)}
        disabled={bs.muted}
      />
      <button
        onClick={() => setBusMuted(busId, !bs.muted)}
        className={`p-0.5 rounded transition-colors ${
          bs.muted
            ? 'text-red-500 bg-red-500/10'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label={bs.muted ? 'Unmute' : 'Mute'}
      >
        {bs.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
      </button>
      <span className="text-[8px] uppercase tracking-wider text-gray-500 text-center leading-tight">
        {BUS_LABELS[busId] ?? busId}
      </span>
    </div>
  );
}

// ── Master strip ──────────────────────────────────────────────────────────

function MasterStrip({ onToggleLimiter, limiterEnabled }: {
  onToggleLimiter: () => void;
  limiterEnabled: boolean;
}) {
  const masterBusVolume = useStore(s => s.masterBusVolume);
  const masterBusMuted = useStore(s => s.masterBusMuted);
  const setMasterBusVolume = useStore(s => s.setMasterBusVolume);
  const setMasterBusMuted = useStore(s => s.setMasterBusMuted);

  return (
    <div className="flex flex-col items-center gap-1.5 px-2 border-l border-gray-200 min-w-[52px]">
      <MasterVU />
      <Fader
        value={masterBusVolume}
        onChange={setMasterBusVolume}
        disabled={masterBusMuted}
      />
      <button
        onClick={() => setMasterBusMuted(!masterBusMuted)}
        className={`p-0.5 rounded transition-colors ${
          masterBusMuted
            ? 'text-red-500 bg-red-500/10'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label={masterBusMuted ? 'Unmute master' : 'Mute master'}
      >
        {masterBusMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
      </button>
      <button
        onClick={onToggleLimiter}
        className={`p-0.5 rounded transition-colors ${
          limiterEnabled
            ? 'text-fret-green bg-fret-green/10'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label={limiterEnabled ? 'Disable limiter' : 'Enable limiter'}
        title={limiterEnabled ? 'Limiter on' : 'Limiter off'}
      >
        <Gauge size={12} />
      </button>
      <span className="text-[8px] uppercase tracking-wider text-gray-700 font-semibold text-center">
        Master
      </span>
    </div>
  );
}

// ── MixerPanel ────────────────────────────────────────────────────────────

interface MixerPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function MixerPanel({ open, onClose }: MixerPanelProps) {
  const [limiterEnabled, setLimiterEnabled] = useState(false);

  const handleToggleLimiter = () => {
    const next = !limiterEnabled;
    setLimiterEnabled(next);
    getMasterBus().setLimiterEnabled(next);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-[5.5rem] left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Mixer</span>
        <button
          onClick={onClose}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close mixer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-end gap-0">
        {BUS_IDS.map((id) => (
          <ChannelStrip key={id} busId={id} />
        ))}
        <MasterStrip
          limiterEnabled={limiterEnabled}
          onToggleLimiter={handleToggleLimiter}
        />
      </div>
    </div>
  );
}
