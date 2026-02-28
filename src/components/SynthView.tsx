import { useStore } from '../store';
import SynthKnob from './SynthKnob';
import SynthKeyboard from './SynthKeyboard';
import SynthMixer from './SynthMixer';
import SynthOsc2 from './SynthOsc2';
import SynthLfo from './SynthLfo';
import SynthPresetSelector from './SynthPresetSelector';
import type { OscWaveform, LfoTargetParam } from '../lib/synth';

const WAVEFORMS: { type: OscWaveform; label: string; path: string }[] = [
  {
    type: 'sine',
    label: 'Sine',
    path: 'M2 10 Q6 0 10 10 Q14 20 18 10',
  },
  {
    type: 'triangle',
    label: 'Tri',
    path: 'M2 10 L6 2 L14 18 L18 10',
  },
  {
    type: 'sawtooth',
    label: 'Saw',
    path: 'M2 18 L10 2 L10 18 L18 2',
  },
  {
    type: 'square',
    label: 'Sq',
    path: 'M2 18 L2 2 L10 2 L10 18 L18 18 L18 2',
  },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function lfoFor(param: string, t1: LfoTargetParam, t2: LfoTargetParam): 1 | 2 | null {
  if (t1 === param) return 1;
  if (t2 === param) return 2;
  return null;
}

export default function SynthView() {
  const waveform = useStore(s => s.synthWaveform);
  const filterCutoff = useStore(s => s.synthFilterCutoff);
  const filterResonance = useStore(s => s.synthFilterResonance);
  const attack = useStore(s => s.synthAttack);
  const decay = useStore(s => s.synthDecay);
  const sustain = useStore(s => s.synthSustain);
  const release = useStore(s => s.synthRelease);
  const keyboardMode = useStore(s => s.synthKeyboardMode);
  const setSynthParam = useStore(s => s.setSynthParam);
  const setKeyboardMode = useStore(s => s.setSynthKeyboardMode);
  const setLfoTarget = useStore(s => s.setSynthLfoTarget);
  const lfo1Target = useStore(s => s.synthLfo1Target);
  const lfo2Target = useStore(s => s.synthLfo2Target);

  const handleLfoDrop = (param: LfoTargetParam, lfoNum: 1 | 2) => {
    setLfoTarget(lfoNum, param);
  };

  return (
    <main className="pt-14 pb-16 px-4 max-w-7xl mx-auto">
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[13px] uppercase tracking-[0.3em] text-gray-400 font-semibold">
            Synth
          </h2>
          <SynthPresetSelector />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Oscillators, Filter, LFOs, Envelope */}
          <div className="space-y-2">
            {/* Oscillator 1 */}
            <SectionHeader>Oscillator 1</SectionHeader>
            <div className="flex gap-1">
              {WAVEFORMS.map(({ type, label, path }) => (
                <button
                  key={type}
                  onClick={() => setSynthParam('waveform', type)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded transition-colors ${
                    waveform === type
                      ? 'bg-gray-100 text-fret-green'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <svg width={20} height={20} viewBox="0 0 20 20">
                    <path
                      d={path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[9px] uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>

            {/* Oscillator 2 / FM */}
            <SectionHeader>Oscillator 2 / FM</SectionHeader>
            <SynthOsc2
              onLfoDrop={handleLfoDrop}
              lfo1Target={lfo1Target}
              lfo2Target={lfo2Target}
            />

            {/* Filter */}
            <SectionHeader>Filter</SectionHeader>
            <div className="flex justify-center gap-6">
              <SynthKnob
                label="Cutoff"
                value={filterCutoff}
                min={20}
                max={20000}
                logarithmic
                onChange={(v) => setSynthParam('filterCutoff', v)}
                unit="Hz"
                paramKey="filterCutoff"
                lfoTargeting={lfoFor('filterCutoff', lfo1Target, lfo2Target)}
                onDrop={(lfo) => handleLfoDrop('filterCutoff', lfo)}
              />
              <SynthKnob
                label="Resonance"
                value={filterResonance}
                min={0}
                max={30}
                onChange={(v) => setSynthParam('filterResonance', v)}
                formatValue={(v) => v.toFixed(1)}
                unit="Q"
                paramKey="filterResonance"
                lfoTargeting={lfoFor('filterResonance', lfo1Target, lfo2Target)}
                onDrop={(lfo) => handleLfoDrop('filterResonance', lfo)}
              />
            </div>

            {/* LFOs */}
            <SectionHeader>LFO 1</SectionHeader>
            <SynthLfo lfoNum={1} />

            <SectionHeader>LFO 2</SectionHeader>
            <SynthLfo lfoNum={2} />

            {/* Envelope */}
            <SectionHeader>Envelope</SectionHeader>
            <div className="flex justify-center gap-3">
              <SynthKnob
                label="Attack"
                value={attack}
                min={0.001}
                max={2}
                logarithmic
                onChange={(v) => setSynthParam('attack', v)}
                formatValue={(v) => v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(1)}s`}
                paramKey="attack"
              />
              <SynthKnob
                label="Decay"
                value={decay}
                min={0.001}
                max={2}
                logarithmic
                onChange={(v) => setSynthParam('decay', v)}
                formatValue={(v) => v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(1)}s`}
                paramKey="decay"
              />
              <SynthKnob
                label="Sustain"
                value={sustain}
                min={0}
                max={1}
                onChange={(v) => setSynthParam('sustain', v)}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                paramKey="sustain"
              />
              <SynthKnob
                label="Release"
                value={release}
                min={0.01}
                max={5}
                logarithmic
                onChange={(v) => setSynthParam('release', v)}
                formatValue={(v) => v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(1)}s`}
                paramKey="release"
              />
            </div>
          </div>

          {/* Right column: Keyboard, Mixer */}
          <div className="space-y-2">
            <SectionHeader>Keyboard</SectionHeader>
            <div className="flex gap-1 mb-3">
              {(['classic', 'isomorphic'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setKeyboardMode(mode)}
                  className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded transition-colors ${
                    keyboardMode === mode
                      ? 'bg-gray-100 text-fret-green'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <SynthKeyboard mode={keyboardMode} />

            <SectionHeader>Mixer</SectionHeader>
            <SynthMixer
              visible={true}
              onLfoDrop={handleLfoDrop}
              lfo1Target={lfo1Target}
              lfo2Target={lfo2Target}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
