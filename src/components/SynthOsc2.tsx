import { useStore } from '../store';
import SynthKnob from './SynthKnob';
import type { OscWaveform, LfoTargetParam } from '../lib/synth';
import { lfoFor } from '../lib/synthUtils';

const WAVEFORMS: { type: OscWaveform; label: string; path: string }[] = [
  { type: 'sine', label: 'Sin', path: 'M2 10 Q6 0 10 10 Q14 20 18 10' },
  { type: 'triangle', label: 'Tri', path: 'M2 10 L6 2 L14 18 L18 10' },
  { type: 'sawtooth', label: 'Saw', path: 'M2 18 L10 2 L10 18 L18 2' },
  { type: 'square', label: 'Sq', path: 'M2 18 L2 2 L10 2 L10 18 L18 18 L18 2' },
];

interface SynthOsc2Props {
  onLfoDrop: (param: LfoTargetParam, lfoNum: 1 | 2) => void;
  lfo1Target: LfoTargetParam;
  lfo2Target: LfoTargetParam;
}

export default function SynthOsc2({ onLfoDrop, lfo1Target, lfo2Target }: SynthOsc2Props) {
  const osc2Waveform = useStore(s => s.synthOsc2Waveform);
  const osc2Detune = useStore(s => s.synthOsc2Detune);
  const osc2Mix = useStore(s => s.synthOsc2Mix);
  const fmMode = useStore(s => s.synthFmMode);
  const fmDepth = useStore(s => s.synthFmDepth);
  const setSynthParam = useStore(s => s.setSynthParam);

  return (
    <div>
      {/* Waveform selector */}
      <div className="flex gap-1 mb-3">
        {WAVEFORMS.map(({ type, label, path }) => (
          <button
            key={type}
            onClick={() => setSynthParam('osc2Waveform', type)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded transition-colors ${
              osc2Waveform === type
                ? 'bg-gray-100 text-fret-green'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <svg width={20} height={20} viewBox="0 0 20 20">
              <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[9px] uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* FM mode toggle */}
      <div className="flex gap-1 mb-3">
        {(['additive', 'fm'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSynthParam('fmMode', mode === 'fm')}
            className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded transition-colors ${
              (mode === 'fm') === fmMode
                ? 'bg-gray-100 text-fret-green'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            {mode === 'fm' ? 'FM' : 'Additive'}
          </button>
        ))}
      </div>

      {/* Knobs */}
      <div className="flex justify-center gap-4">
        <SynthKnob
          label="Detune"
          value={osc2Detune}
          min={-1200}
          max={1200}
          onChange={(v) => setSynthParam('osc2Detune', v)}
          formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}c`}
          paramKey="osc2Detune"
          lfoTargeting={lfoFor('osc2Detune', lfo1Target, lfo2Target)}
          onDrop={(lfo) => onLfoDrop('osc2Detune', lfo)}
        />
        {fmMode ? (
          <SynthKnob
            label="FM Depth"
            value={fmDepth}
            min={0}
            max={5000}
            logarithmic
            onChange={(v) => setSynthParam('fmDepth', v)}
            unit="Hz"
            paramKey="fmDepth"
            lfoTargeting={lfoFor('fmDepth', lfo1Target, lfo2Target)}
            onDrop={(lfo) => onLfoDrop('fmDepth', lfo)}
          />
        ) : (
          <SynthKnob
            label="Mix"
            value={osc2Mix}
            min={0}
            max={1}
            onChange={(v) => setSynthParam('osc2Mix', v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            paramKey="osc2Mix"
            lfoTargeting={lfoFor('osc2Mix', lfo1Target, lfo2Target)}
            onDrop={(lfo) => onLfoDrop('osc2Mix', lfo)}
          />
        )}
      </div>
    </div>
  );
}
