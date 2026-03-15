import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { getMasterBus } from '../lib/masterBus';

const BAR_COUNT = 4;

function VuMeter({ level, muted }: { level: number; muted: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const threshold = (i + 1) / BAR_COUNT;
        const active = !muted && level >= threshold;
        return (
          <div
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              height: `${38 + i * 21}%`,
              background: active
                ? i < 2 ? '#16a34a' : i === 2 ? '#ca8a04' : '#dc2626'
                : '#e5e7eb',
              transition: active ? 'none' : 'background 0.15s',
            }}
          />
        );
      })}
    </div>
  );
}

interface EngineButtonProps {
  busId: 'synth' | 'sampler';
  label: string;
  level: number;
  isActive: boolean;
  isMuted: boolean;
  onActivate: () => void;
  onToggleMute: () => void;
}

function EngineButton({ busId, label, level, isActive, isMuted, onActivate, onToggleMute }: EngineButtonProps) {
  return (
    <button
      onClick={() => isActive ? onToggleMute() : onActivate()}
      title={isActive ? (isMuted ? `Unmute ${label}` : `Mute ${label}`) : `Switch to ${label}`}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all select-none ${
        isActive
          ? isMuted
            ? 'bg-red-50 border border-red-200'
            : 'bg-white border border-gray-200 shadow-sm'
          : 'bg-transparent border border-transparent opacity-35 hover:opacity-65 hover:border-gray-200'
      }`}
    >
      <VuMeter level={level} muted={isMuted} />
      <span
        className={`text-[8px] font-bold tracking-[0.2em] uppercase leading-none ${
          isActive
            ? isMuted
              ? 'text-red-400 line-through'
              : busId === 'synth' ? 'text-gray-600' : 'text-violet-600'
            : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function EngineBar() {
  const samplerMode = useStore(s => s.samplerMode);
  const setSamplerMode = useStore(s => s.setSamplerMode);
  const buses = useStore(s => s.buses);
  const setBusMuted = useStore(s => s.setBusMuted);
  const crossfade = useStore(s => s.samplerCrossfade);
  const setCrossfade = useStore(s => s.setSamplerCrossfade);

  const synthMuted = buses['synth']?.muted ?? false;
  const samplerMuted = buses['sampler']?.muted ?? false;

  const [synthLevel, setSynthLevel] = useState(0);
  const [samplerLevel, setSamplerLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    const master = getMasterBus();
    const tick = (now: number) => {
      if (now - lastRef.current > 60) {
        lastRef.current = now;
        setSynthLevel(master.getBus('synth').getRmsLevel());
        setSamplerLevel(master.getBus('sampler').getRmsLevel());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const pct = crossfade * 100;
  const synthColor = synthMuted ? '#e5e7eb' : '#4b5563';
  const samplerColor = samplerMuted ? '#ede9fe' : '#7c3aed';
  const trackBg = `linear-gradient(to right, ${synthColor} ${pct}%, ${samplerColor} ${pct}%)`;

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-5 border border-gray-200">
      <EngineButton
        busId="synth"
        label="SYN"
        level={synthLevel}
        isActive={samplerMode === 'synth'}
        isMuted={synthMuted}
        onActivate={() => setSamplerMode('synth')}
        onToggleMute={() => setBusMuted('synth', !synthMuted)}
      />

      <div className="flex-1 flex flex-col items-center gap-0.5">
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={crossfade}
            onChange={e => setCrossfade(parseFloat(e.target.value))}
            className="crossfader-sm w-full"
            style={{ background: trackBg }}
          />
          {/* Centre tick */}
          <div
            className="absolute left-1/2 pointer-events-none"
            style={{ top: '50%', transform: 'translate(-50%, -50%)', width: 1, height: 6, background: '#d1d5db' }}
          />
        </div>
        <div className="flex justify-between w-full px-0.5">
          <span className="text-[7px] text-gray-400 uppercase tracking-wider">syn</span>
          <span className="text-[7px] text-gray-400 uppercase tracking-wider">smp</span>
        </div>
      </div>

      <EngineButton
        busId="sampler"
        label="SMP"
        level={samplerLevel}
        isActive={samplerMode === 'sampler'}
        isMuted={samplerMuted}
        onActivate={() => setSamplerMode('sampler')}
        onToggleMute={() => setBusMuted('sampler', !samplerMuted)}
      />
    </div>
  );
}
