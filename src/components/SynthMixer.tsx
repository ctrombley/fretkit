import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { getSynth } from '../lib/synth';
import SynthKnob from './SynthKnob';
import type { LfoTargetParam } from '../lib/synth';
import { lfoFor, formatPan } from '../lib/synthUtils';

const BAR_COUNT = 20;
const BAR_HEIGHT = 8;
const BAR_GAP = 2;
const VU_WIDTH = 200;
const VU_HEIGHT = BAR_COUNT * (BAR_HEIGHT + BAR_GAP);

function barColor(index: number): string {
  if (index >= 17) return '#ef4444'; // red
  if (index >= 13) return '#eab308'; // yellow
  return '#99C432'; // green
}

function VUMeter({ visible }: { visible: boolean }) {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const peakDecayRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;

    const tick = () => {
      const data = getSynth().getAnalyserData();
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const norm = data[i]! / 255;
        sum += norm * norm;
      }
      const rms = Math.sqrt(sum / data.length);
      const scaled = Math.min(1, rms * 2.5);

      setLevel(scaled);

      if (scaled >= peakDecayRef.current) {
        peakDecayRef.current = scaled;
      } else {
        peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.01);
      }
      setPeak(peakDecayRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  const litBars = Math.round(level * BAR_COUNT);
  const peakBar = Math.round(peak * BAR_COUNT) - 1;

  return (
    <svg width={VU_WIDTH} height={VU_HEIGHT} className="block mx-auto">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const y = VU_HEIGHT - (i + 1) * (BAR_HEIGHT + BAR_GAP);
        const lit = i < litBars;
        const isPeak = i === peakBar && peakBar >= litBars;
        return (
          <rect
            key={i}
            x={0}
            y={y}
            width={VU_WIDTH}
            height={BAR_HEIGHT}
            rx={1}
            fill={lit || isPeak ? barColor(i) : '#e5e7eb'}
            opacity={lit ? 1 : isPeak ? 0.8 : 0.3}
          />
        );
      })}
    </svg>
  );
}

interface SynthMixerProps {
  visible: boolean;
  onLfoDrop: (param: LfoTargetParam, lfoNum: 1 | 2) => void;
  lfo1Target: LfoTargetParam;
  lfo2Target: LfoTargetParam;
}

export default function SynthMixer({ visible, onLfoDrop, lfo1Target, lfo2Target }: SynthMixerProps) {
  const pan = useStore(s => s.synthPan);
  const reverbSend = useStore(s => s.synthReverbSend);
  const delaySend = useStore(s => s.synthDelaySend);
  const delayTime = useStore(s => s.synthDelayTime);
  const delayFeedback = useStore(s => s.synthDelayFeedback);
  const masterVolume = useStore(s => s.synthMasterVolume);
  const setSynthParam = useStore(s => s.setSynthParam);

  return (
    <div className="space-y-4">
      <VUMeter visible={visible} />

      <div className="flex flex-wrap justify-center gap-3">
        <SynthKnob
          label="Pan"
          value={pan}
          min={-1}
          max={1}
          onChange={(v) => setSynthParam('pan', v)}
          formatValue={formatPan}
          color="#00C4CC"
          paramKey="pan"
          lfoTargeting={lfoFor('pan', lfo1Target, lfo2Target)}
          onDrop={(lfo) => onLfoDrop('pan', lfo)}
        />
        <SynthKnob
          label="Reverb"
          value={reverbSend}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('reverbSend', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          color="#00C4CC"
          paramKey="reverbSend"
          lfoTargeting={lfoFor('reverbSend', lfo1Target, lfo2Target)}
          onDrop={(lfo) => onLfoDrop('reverbSend', lfo)}
        />
        <SynthKnob
          label="Delay"
          value={delaySend}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('delaySend', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          color="#00C4CC"
          paramKey="delaySend"
          lfoTargeting={lfoFor('delaySend', lfo1Target, lfo2Target)}
          onDrop={(lfo) => onLfoDrop('delaySend', lfo)}
        />
        <SynthKnob
          label="D.Time"
          value={delayTime}
          min={0.05}
          max={1}
          onChange={(v) => setSynthParam('delayTime', v)}
          formatValue={(v) => `${Math.round(v * 1000)}ms`}
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
          color="#00C4CC"
          paramKey="delayFeedback"
        />
      </div>

      <div className="flex justify-center">
        <SynthKnob
          label="Master"
          value={masterVolume}
          min={0}
          max={1}
          onChange={(v) => setSynthParam('masterVolume', v)}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          size={80}
          color="#F73667"
          paramKey="masterVolume"
          lfoTargeting={lfoFor('masterVolume', lfo1Target, lfo2Target)}
          onDrop={(lfo) => onLfoDrop('masterVolume', lfo)}
        />
      </div>
    </div>
  );
}
