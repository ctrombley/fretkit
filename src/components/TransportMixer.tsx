import { useStore } from '../store';
import { OctagonX } from 'lucide-react';
import { lfoFor, formatPan } from '../lib/synthUtils';
import type { LfoTargetParam } from '../lib/synth';
import SynthKnob from './SynthKnob';
import StereoVU from './StereoVU';

export default function TransportMixer() {
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

  const handleLfoDrop = (param: LfoTargetParam, lfoNum: 1 | 2) => {
    setLfoTarget(lfoNum, param);
  };

  return (
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
  );
}
