import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { getInternalMidiBus } from '../lib/internalMidiBus';
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
  const keyMap = useStore(s => s.samplerKeyMap);

  const [playingSlots, setPlayingSlots] = useState<Set<number>>(new Set());

  const handleSelectSlot = useCallback((idx: number) => {
    setSamplerSelectedSlot(idx === selectedSlot ? null : idx);
  }, [selectedSlot, setSamplerSelectedSlot]);

  const handlePianoNote = useCallback((midi: number) => {
    const slotIdx = keyMap[midi];
    if (slotIdx == null) return;
    setPlayingSlots(prev => new Set([...prev, slotIdx]));
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const bus = getInternalMidiBus();
    bus.noteOn(midi, freq, 'latch', 100);
    setTimeout(() => {
      bus.noteOff(midi, 'latch');
      setPlayingSlots(prev => { const n = new Set(prev); n.delete(slotIdx); return n; });
    }, 300);
  }, [keyMap]);

  return (
    <div className="space-y-2">
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
