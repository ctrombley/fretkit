import { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { getSampler } from '../lib/sampler';
import type { SamplerParams } from '../lib/sampler';
import { DEFAULT_SAMPLER_PARAMS } from '../lib/sampler';

interface Props {
  slotIdx: number;
}

export default function SamplerParamEditor({ slotIdx }: Props) {
  const slot = useStore(s => s.samplerSlots[slotIdx]);
  const params = useStore(s => s.samplerSlotParams[slotIdx] ?? DEFAULT_SAMPLER_PARAMS);
  const rootNote = useStore(s => s.samplerSlotRootNotes[slotIdx]);
  const setSamplerSlotParam = useStore(s => s.setSamplerSlotParam);
  const saveSamplerPreset = useStore(s => s.saveSamplerPreset);
  const keyMap = useStore(s => s.samplerKeyMap);
  const allParams = useStore(s => s.samplerSlotParams);
  const allRoots = useStore(s => s.samplerSlotRootNotes);

  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const buffer = getSampler().getBuffer(slotIdx);

  // Draw waveform thumbnail
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / W);
    const color = slot?.color ?? '#00C4CC';

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    // Draw waveform
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const v = data[x * step + j] ?? 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const yMin = ((1 - max) / 2) * H;
      const yMax = ((1 - min) / 2) * H;
      ctx.moveTo(x + 0.5, yMin);
      ctx.lineTo(x + 0.5, yMax);
    }
    ctx.stroke();

    // Draw start/end region overlay
    const sX = params.startFraction * W;
    const eX = params.endFraction * W;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, sX, H);
    ctx.fillRect(eX, 0, W - eX, H);

    // Start/end handles
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sX, 0); ctx.lineTo(sX, H);
    ctx.moveTo(eX, 0); ctx.lineTo(eX, H);
    ctx.stroke();

    // Loop region
    if (params.loop) {
      const lsX = params.loopStartFraction * W;
      const leX = params.loopEndFraction * W;
      ctx.fillStyle = color + '22';
      ctx.fillRect(lsX, 0, leX - lsX, H);
      ctx.strokeStyle = color + 'aa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lsX, 0); ctx.lineTo(lsX, H);
      ctx.moveTo(leX, 0); ctx.lineTo(leX, H);
      ctx.stroke();
    }
  }, [buffer, params, slot]);

  function p<K extends keyof SamplerParams>(key: K, val: SamplerParams[K]) {
    setSamplerSlotParam(slotIdx, key, val);
  }

  function playPreview() {
    if (!buffer) return;
    getSampler().noteOn(rootNote ?? 60, 100, keyMap, allParams, allRoots);
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function midiName(n: number): string {
    return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
  }

  if (!slot) {
    return (
      <div className="text-[11px] text-gray-500 text-center py-4">
        No slot selected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Waveform thumbnail + play button */}
      <div className="relative">
        <canvas
          ref={waveformCanvasRef}
          width={400}
          height={60}
          className="w-full rounded"
          style={{ imageRendering: 'pixelated' }}
        />
        {!buffer && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 bg-gray-900/80 rounded">
            {slot.url ? 'Loading…' : 'No audio loaded'}
          </div>
        )}
        <button
          onClick={playPreview}
          disabled={!buffer}
          className="absolute right-2 top-2 text-[9px] uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded hover:bg-black/80 disabled:opacity-30"
        >
          ▶ Play
        </button>
      </div>

      {/* Slot name + root note */}
      <div className="flex items-center gap-3 text-[10px]">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: slot.color }}
        />
        <span className="font-semibold text-gray-200 truncate flex-1">{slot.name}</span>
        {rootNote != null && (
          <span className="text-gray-500">Root: <span className="text-gray-300">{midiName(rootNote)}</span></span>
        )}
      </div>

      {/* Start / End */}
      <div className="space-y-1">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">Range</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-400 w-8">Start</span>
          <input
            type="range"
            min={0}
            max={params.endFraction}
            step={0.001}
            value={params.startFraction}
            onChange={e => p('startFraction', parseFloat(e.target.value))}
            className="flex-1 h-1 accent-fret-green"
          />
          <span className="text-[9px] text-gray-400 w-8 text-right">
            {(params.startFraction * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-400 w-8">End</span>
          <input
            type="range"
            min={params.startFraction}
            max={1}
            step={0.001}
            value={params.endFraction}
            onChange={e => p('endFraction', parseFloat(e.target.value))}
            className="flex-1 h-1 accent-fret-green"
          />
          <span className="text-[9px] text-gray-400 w-8 text-right">
            {(params.endFraction * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Loop */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => p('loop', !params.loop)}
            className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
              params.loop ? 'bg-fret-green text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Loop
          </button>
          <button
            onClick={() => p('reverse', !params.reverse)}
            className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
              params.reverse ? 'bg-fret-blue text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Reverse
          </button>
        </div>
        {params.loop && (
          <div className="pl-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-10">Loop In</span>
              <input
                type="range"
                min={0}
                max={params.loopEndFraction}
                step={0.001}
                value={params.loopStartFraction}
                onChange={e => p('loopStartFraction', parseFloat(e.target.value))}
                className="flex-1 h-1 accent-fret-green"
              />
              <span className="text-[9px] text-gray-400 w-8 text-right">
                {(params.loopStartFraction * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-10">Loop Out</span>
              <input
                type="range"
                min={params.loopStartFraction}
                max={1}
                step={0.001}
                value={params.loopEndFraction}
                onChange={e => p('loopEndFraction', parseFloat(e.target.value))}
                className="flex-1 h-1 accent-fret-green"
              />
              <span className="text-[9px] text-gray-400 w-8 text-right">
                {(params.loopEndFraction * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Amplitude + Pitch */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Amplitude</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={params.amplitude}
              onChange={e => p('amplitude', parseFloat(e.target.value))}
              className="flex-1 h-1 accent-fret-green"
            />
            <span className="text-[9px] text-gray-400 w-10 text-right">
              {Math.round(params.amplitude * 100)}%
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Pitch</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-24}
              max={24}
              step={1}
              value={params.pitchSemitones}
              onChange={e => p('pitchSemitones', parseInt(e.target.value))}
              className="flex-1 h-1 accent-fret-green"
            />
            <span className="text-[9px] text-gray-400 w-10 text-right">
              {params.pitchSemitones > 0 ? '+' : ''}{params.pitchSemitones} st
            </span>
          </div>
        </div>
      </div>

      {/* Save as preset */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
        {showSaveInput ? (
          <>
            <input
              autoFocus
              type="text"
              placeholder="Preset name…"
              value={saveNameInput}
              onChange={e => setSaveNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && saveNameInput.trim()) {
                  saveSamplerPreset(saveNameInput.trim());
                  setSaveNameInput('');
                  setShowSaveInput(false);
                }
                if (e.key === 'Escape') setShowSaveInput(false);
              }}
              className="flex-1 text-xs bg-gray-800 rounded px-2 py-1 outline-none border border-gray-600 focus:border-fret-green text-white"
            />
            <button
              onClick={() => {
                if (saveNameInput.trim()) {
                  saveSamplerPreset(saveNameInput.trim());
                  setSaveNameInput('');
                  setShowSaveInput(false);
                }
              }}
              className="text-[9px] uppercase tracking-wider bg-fret-green text-white px-2 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveInput(false)}
              className="text-[9px] text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="text-[9px] uppercase tracking-wider text-gray-500 hover:text-gray-300"
          >
            + Save as preset
          </button>
        )}
      </div>
    </div>
  );
}
