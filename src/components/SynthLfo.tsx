import { useStore } from '../store';
import SynthKnob from './SynthKnob';
import { X, Sparkles } from 'lucide-react';
import type { LfoWaveform, LfoTargetParam } from '../lib/synth';
import { lfoStoreKeys } from '../lib/synthUtils';

const LFO_WAVEFORMS: { type: LfoWaveform; path: string }[] = [
  { type: 'sine', path: 'M2 10 Q6 0 10 10 Q14 20 18 10' },
  { type: 'triangle', path: 'M2 10 L6 2 L14 18 L18 10' },
  { type: 'sawtooth', path: 'M2 18 L10 2 L10 18 L18 2' },
  { type: 'square', path: 'M2 18 L2 2 L10 2 L10 18 L18 18 L18 2' },
];

const PLUG_COLORS = { 1: '#F73667', 2: '#00C4CC' } as const;

const PARAM_LABELS: Record<string, string> = {
  filterCutoff: 'Cutoff',
  filterResonance: 'Resonance',
  pan: 'Pan',
  reverbSend: 'Reverb',
  delaySend: 'Delay',
  masterVolume: 'Master',
  osc2Detune: 'Detune',
  osc2Mix: 'Mix',
  fmDepth: 'FM Depth',
};

interface SynthLfoProps {
  lfoNum: 1 | 2;
}

export default function SynthLfo({ lfoNum }: SynthLfoProps) {
  const { rateKey, depthKey, waveformKey, targetKey, bloomKey, paramRate, paramDepth, paramWaveform } = lfoStoreKeys(lfoNum);

  const rate = useStore(s => s[rateKey]) as number;
  const depth = useStore(s => s[depthKey]) as number;
  const waveform = useStore(s => s[waveformKey]) as LfoWaveform;
  const target = useStore(s => s[targetKey]) as LfoTargetParam;
  const bloom = useStore(s => s[bloomKey]) as boolean;
  const setSynthParam = useStore(s => s.setSynthParam);
  const setLfoTarget = useStore(s => s.setSynthLfoTarget);

  const plugColor = PLUG_COLORS[lfoNum];
  const lfoActive = !!target && depth > 0;
  const showBloom = bloom && lfoActive;
  const period = `${(1 / Math.max(rate, 0.05)).toFixed(3)}s`;

  return (
    <div className="flex items-center gap-3">
      {/* Waveform mini-buttons */}
      <div className="flex flex-col gap-0.5">
        {LFO_WAVEFORMS.map(({ type, path }) => (
          <button
            key={type}
            onClick={() => setSynthParam(paramWaveform, type)}
            className={`p-1 rounded transition-colors ${
              waveform === type
                ? 'bg-gray-100 text-fret-green'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <svg width={16} height={16} viewBox="0 0 20 20">
              <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* Rate + Depth knobs */}
      <SynthKnob
        label="Rate"
        value={rate}
        min={0.05}
        max={20}
        logarithmic
        onChange={(v) => setSynthParam(paramRate, v)}
        formatValue={(v) => `${v.toFixed(1)}Hz`}
        size={52}
      />
      <SynthKnob
        label="Depth"
        value={depth}
        min={0}
        max={1}
        onChange={(v) => setSynthParam(paramDepth, v)}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        size={52}
      />

      {/* Drag plug with bloom ring */}
      <div className="relative flex-shrink-0 w-6 h-6">
        {showBloom && (
          <div
            className="lfo-bloom"
            style={{
              '--lfo-period': period,
              '--lfo-color': plugColor,
            } as React.CSSProperties}
          />
        )}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('lfo-num', String(lfoNum));
            e.dataTransfer.effectAllowed = 'link';
          }}
          className="w-6 h-6 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ backgroundColor: plugColor }}
          title={`Drag LFO ${lfoNum} to a knob`}
        >
          <span className="text-white text-[8px] font-bold">{lfoNum}</span>
        </div>
      </div>

      {/* Bloom toggle */}
      <button
        onClick={() => useStore.setState({ [bloomKey]: !bloom })}
        className={`p-1 rounded transition-colors ${
          bloom
            ? 'text-fret-green hover:bg-gray-100'
            : 'text-gray-300 hover:bg-gray-50 hover:text-gray-400'
        }`}
        title={bloom ? 'Bloom on' : 'Bloom off'}
      >
        <Sparkles size={12} />
      </button>

      {/* Target display */}
      <div className="flex items-center gap-1 min-w-[60px]">
        <span className="text-[10px] text-gray-500 truncate">
          {target ? (PARAM_LABELS[target] || target) : '\u2014'}
        </span>
        {target && (
          <button
            onClick={() => setLfoTarget(lfoNum, null)}
            className="p-0.5 rounded hover:bg-gray-100 text-gray-400"
          >
            <X size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
