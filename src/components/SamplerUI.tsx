import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { FACTORY_SAMPLER_PRESETS } from '../lib/samplerPresets';
import { getSampler } from '../lib/sampler';
import SamplerSlotGrid from './SamplerSlotGrid';
import PianoKeyboard from './PianoKeyboard';
import SamplerParamEditor from './SamplerParamEditor';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

export default function SamplerUI() {
  const selectedSlot = useStore(s => s.samplerSelectedSlot);
  const setSamplerSelectedSlot = useStore(s => s.setSamplerSelectedSlot);
  const loadSamplerPreset = useStore(s => s.loadSamplerPreset);
  const samplerPresets = useStore(s => s.samplerPresets);
  const deleteSamplerPreset = useStore(s => s.deleteSamplerPreset);
  const keyMap = useStore(s => s.samplerKeyMap);
  const slotParams = useStore(s => s.samplerSlotParams);
  const slotRootNotes = useStore(s => s.samplerSlotRootNotes);
  const setSamplerSlot = useStore(s => s.setSamplerSlot);
  const setSamplerKeyMap = useStore(s => s.setSamplerKeyMap);

  const [playingSlots, setPlayingSlots] = useState<Set<number>>(new Set());
  const [showPresets, setShowPresets] = useState(false);

  const handleSelectSlot = useCallback((idx: number) => {
    setSamplerSelectedSlot(idx === selectedSlot ? null : idx);
  }, [selectedSlot, setSamplerSelectedSlot]);

  const handlePianoNote = useCallback((midi: number) => {
    const slotIdx = keyMap[midi];
    if (slotIdx == null) return;
    setPlayingSlots(prev => new Set([...prev, slotIdx]));
    getSampler().noteOn(midi, 100, keyMap, slotParams, slotRootNotes);
    setTimeout(() => {
      setPlayingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotIdx);
        return next;
      });
    }, 300);
  }, [keyMap, slotParams, slotRootNotes]);

  const handleLoadFactory = useCallback((idx: number) => {
    const preset = FACTORY_SAMPLER_PRESETS[idx];
    if (!preset) return;
    preset.slots.forEach((slot, i) => {
      setSamplerSlot(i, slot);
      if (slot?.url) {
        getSampler().loadSample(i, slot.url).catch(console.error);
      }
    });
    setSamplerKeyMap([...preset.keyMap]);
    setShowPresets(false);
  }, [setSamplerSlot, setSamplerKeyMap]);

  return (
    <div className="space-y-2">
      {/* Preset selector */}
      <div className="flex items-center justify-between">
        <SectionHeader>Sampler</SectionHeader>
        <button
          onClick={() => setShowPresets(v => !v)}
          className="text-[9px] uppercase tracking-wider text-gray-500 hover:text-gray-300"
        >
          Presets {showPresets ? '▲' : '▼'}
        </button>
      </div>

      {showPresets && (
        <div className="bg-gray-900 rounded p-2 space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-gray-600 mb-1">Factory</div>
          <div className="grid grid-cols-2 gap-1">
            {FACTORY_SAMPLER_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleLoadFactory(i)}
                className="text-left text-[10px] text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 truncate"
              >
                {p.name}
              </button>
            ))}
          </div>
          {samplerPresets.length > 0 && (
            <>
              <div className="text-[9px] uppercase tracking-wider text-gray-600 mt-2 mb-1">User</div>
              <div className="grid grid-cols-2 gap-1">
                {samplerPresets.map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button
                      onClick={() => { loadSamplerPreset(i); setShowPresets(false); }}
                      className="flex-1 text-left text-[10px] text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 truncate"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deleteSamplerPreset(i)}
                      className="text-[9px] text-gray-600 hover:text-red-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Slot grid */}
      <SectionHeader>Pads</SectionHeader>
      <SamplerSlotGrid
        onSelectSlot={handleSelectSlot}
        selectedSlot={selectedSlot}
        playingSlots={playingSlots}
      />

      {/* Piano keyboard */}
      <SectionHeader>Keyboard Map</SectionHeader>
      <div className="text-[9px] text-gray-500 -mt-1 mb-1">
        Select a pad, then drop it onto a key to assign its pitch range
      </div>
      <PianoKeyboard
        selectedSlot={selectedSlot}
        onNoteClick={handlePianoNote}
      />

      {/* Param editor */}
      {selectedSlot != null && (
        <>
          <SectionHeader>Edit — Pad {selectedSlot + 1}</SectionHeader>
          <SamplerParamEditor slotIdx={selectedSlot} />
        </>
      )}
    </div>
  );
}
