import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { getInternalMidiBus } from '../lib/internalMidiBus';

const KEY_W = 22; // white key width in px
const KEY_H_WHITE = 64;
const KEY_H_BLACK = 40;
const KEY_W_BLACK = 14;

function midiToOctaveNote(midi: number): { octave: number; note: number } {
  return { octave: Math.floor(midi / 12) - 1, note: midi % 12 };
}

function isBlack(note: number): boolean {
  return [1, 3, 6, 8, 10].includes(note);
}

const MIN_MIDI = 21; // A0
const MAX_MIDI = 108; // C8

interface Props {
  selectedSlot: number | null;
  onNoteOn: (midiNote: number) => void;
  onNoteOff: (midiNote: number) => void;
}

export default function PianoKeyboard({ selectedSlot, onNoteOn, onNoteOff }: Props) {
  const keyMap = useStore(s => s.samplerKeyMap);
  const slots = useStore(s => s.samplerSlots);
  const mapSlotToKey = useStore(s => s.mapSlotToKey);
  const setSamplerSelectedSlot = useStore(s => s.setSamplerSelectedSlot);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracks which key is currently held so onPointerLeave can stop the right note.
  const pressedMidiRef = useRef<number | null>(null);

  // Mirror bus activity — lights up keys from any source (fretboard, arp, etc.)
  useEffect(() => {
    const bus = getInternalMidiBus();
    const off1 = bus.onNoteOn(({ semitones }) =>
      setActiveNotes(prev => new Set([...prev, semitones])));
    const off2 = bus.onNoteOff(({ semitones }) =>
      setActiveNotes(prev => { const n = new Set(prev); n.delete(semitones); return n; }));
    const off3 = bus.onAllNotesOff(() => setActiveNotes(new Set()));
    return () => { off1(); off2(); off3(); };
  }, []);

  function getKeyColor(midi: number): string | null {
    const slotIdx = keyMap[midi];
    if (slotIdx == null) return null;
    return slots[slotIdx]?.color ?? null;
  }

  function handlePointerDown(midi: number) {
    pressedMidiRef.current = midi;
    onNoteOn(midi);
  }

  function handlePointerUp(midi: number) {
    if (pressedMidiRef.current === midi) {
      pressedMidiRef.current = null;
      onNoteOff(midi);
    }
  }

  function handlePointerLeave(midi: number) {
    if (pressedMidiRef.current === midi) {
      pressedMidiRef.current = null;
      onNoteOff(midi);
    }
  }

  function handleDrop(e: React.DragEvent, midi: number) {
    e.preventDefault();
    setDragOver(null);
    const dragged = e.dataTransfer.getData('sampler-slot');
    const slotIdx = dragged !== '' ? parseInt(dragged, 10) : selectedSlot;
    if (slotIdx == null || isNaN(slotIdx as number)) return;
    mapSlotToKey(slotIdx, midi);
    setSamplerSelectedSlot(slotIdx);
  }

  // Build white key list (MIDI notes from MIN_MIDI to MAX_MIDI that are white)
  const whiteKeys: number[] = [];
  for (let m = MIN_MIDI; m <= MAX_MIDI; m++) {
    if (!isBlack(m % 12)) whiteKeys.push(m);
  }

  const totalWidth = whiteKeys.length * KEY_W;
  const svgHeight = KEY_H_WHITE + 2;

  return (
    <div className="w-full overflow-x-auto" ref={scrollRef}>
      <div style={{ width: totalWidth, position: 'relative', height: svgHeight }}>
        {/* White keys */}
        {whiteKeys.map((midi, wIdx) => {
          const color = getKeyColor(midi);
          const isPressed = activeNotes.has(midi);
          const isDragOver = dragOver === midi;
          const { note } = midiToOctaveNote(midi);
          const isC = note === 0;

          return (
            <div
              key={midi}
              style={{
                position: 'absolute',
                left: wIdx * KEY_W,
                top: 0,
                width: KEY_W - 1,
                height: KEY_H_WHITE,
                backgroundColor: color
                  ? isDragOver ? '#fff' : color + '55'
                  : isPressed ? '#e0e0e0' : '#f8f8f8',
                border: '1px solid #ccc',
                borderRadius: '0 0 3px 3px',
                cursor: 'pointer',
                zIndex: 1,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 2,
                userSelect: 'none',
                touchAction: 'none',
                transition: 'background-color 0.08s',
              }}
              onPointerDown={() => handlePointerDown(midi)}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
              onDragOver={e => { e.preventDefault(); setDragOver(midi); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, midi)}
            >
              {isC && (
                <span style={{ fontSize: 7, color: '#999', lineHeight: 1 }}>
                  C{midiToOctaveNote(midi).octave + 1}
                </span>
              )}
              {color && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    backgroundColor: color,
                    borderRadius: '0 0 2px 2px',
                    opacity: 0.8,
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Black keys */}
        {(() => {
          const blacks: React.ReactNode[] = [];
          for (let m = MIN_MIDI; m <= MAX_MIDI; m++) {
            if (!isBlack(m % 12)) continue;
            const wIdx = whiteKeys.indexOf(m - 1); // white key to the left
            if (wIdx === -1) continue;
            const x = wIdx * KEY_W + KEY_W - KEY_W_BLACK / 2;
            const color = getKeyColor(m);
            const isPressed = activeNotes.has(m);
            const isDragOver = dragOver === m;
            blacks.push(
              <div
                key={m}
                style={{
                  position: 'absolute',
                  left: x,
                  top: 0,
                  width: KEY_W_BLACK,
                  height: KEY_H_BLACK,
                  backgroundColor: color
                    ? isDragOver ? '#888' : color
                    : isPressed ? '#666' : '#222',
                  border: '1px solid #000',
                  borderRadius: '0 0 2px 2px',
                  zIndex: 2,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  touchAction: 'none',
                  transition: 'background-color 0.08s',
                }}
                onPointerDown={() => handlePointerDown(m)}
                onPointerUp={() => handlePointerUp(m)}
                onPointerLeave={() => handlePointerLeave(m)}
                onDragOver={e => { e.preventDefault(); setDragOver(m); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, m)}
              />
            );
          }
          return blacks;
        })()}
      </div>
      <div className="text-[9px] text-gray-400 mt-1 text-center">
        {selectedSlot != null
          ? `Drag slot ${selectedSlot + 1} or press a key to play — drop on a key to map`
          : 'Select a slot then drop it on a key to map'}
      </div>
    </div>
  );
}
