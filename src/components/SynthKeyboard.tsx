import { useCallback, useRef } from 'react';
import { getSynth } from '../lib/synth';
import { noteName } from '../lib/harmony';

interface SynthKeyboardProps {
  mode: 'classic' | 'isomorphic';
}

// MIDI note to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Classic piano layout: C3 (MIDI 48) to B4 (MIDI 71) = 2 octaves
const START_MIDI = 48;
const OCTAVE_COUNT = 2;
const WHITE_COUNT = OCTAVE_COUNT * 7;

const BLACK_OFFSETS = [1, 3, 6, 8, 10]; // semitone offsets within octave that are black keys
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]; // semitone offsets for white keys

function ClassicKeyboard() {
  const voicesRef = useRef<Map<number, { stop: () => void }>>(new Map());
  const keyW = 28;
  const keyH = 110;
  const blackW = 18;
  const blackH = 68;
  const svgW = WHITE_COUNT * keyW + 2;
  const svgH = keyH + 12;

  // Build white and black keys
  const whites: { midi: number; x: number; label: string }[] = [];
  const blacks: { midi: number; x: number; label: string }[] = [];

  for (let oct = 0; oct < OCTAVE_COUNT; oct++) {
    for (let i = 0; i < 7; i++) {
      const whiteIdx = oct * 7 + i;
      const midi = START_MIDI + oct * 12 + WHITE_SEMITONES[i]!;
      const x = whiteIdx * keyW + 1;
      whites.push({ midi, x, label: noteName(midi % 12) });
    }
    for (const offset of BLACK_OFFSETS) {
      const midi = START_MIDI + oct * 12 + offset;
      // Position black key between its adjacent white keys
      const whiteIdxBefore = WHITE_SEMITONES.filter(s => s < offset).length;
      const x = (oct * 7 + whiteIdxBefore) * keyW - blackW / 2 + keyW + 1;
      blacks.push({ midi, x, label: noteName(midi % 12) });
    }
  }

  const noteOn = useCallback((midi: number, pointerId: number) => {
    if (voicesRef.current.has(pointerId)) return;
    const handle = getSynth().play(midiToFreq(midi));
    voicesRef.current.set(pointerId, handle);
  }, []);

  const noteOff = useCallback((pointerId: number) => {
    const voice = voicesRef.current.get(pointerId);
    if (voice) {
      voice.stop();
      voicesRef.current.delete(pointerId);
    }
  }, []);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="select-none"
      style={{ touchAction: 'none' }}
    >
      {/* White keys */}
      {whites.map(({ midi, x, label }) => (
        <g key={midi}>
          <rect
            x={x}
            y={1}
            width={keyW - 1}
            height={keyH}
            rx={3}
            fill="#e5e5e5"
            stroke="#999"
            strokeWidth={0.5}
            className="hover:fill-[#d5d5d5] active:fill-fret-green cursor-pointer"
            onPointerDown={(e) => {
              (e.target as SVGElement).setPointerCapture(e.pointerId);
              noteOn(midi, e.pointerId);
            }}
            onPointerUp={(e) => noteOff(e.pointerId)}
            onPointerCancel={(e) => noteOff(e.pointerId)}
            onPointerLeave={(e) => noteOff(e.pointerId)}
          />
          <text
            x={x + (keyW - 1) / 2}
            y={keyH - 6}
            textAnchor="middle"
            fill="#666"
            fontSize={8}
            className="pointer-events-none"
          >
            {label}
          </text>
        </g>
      ))}
      {/* Black keys */}
      {blacks.map(({ midi, x, label }) => (
        <g key={midi}>
          <rect
            x={x}
            y={1}
            width={blackW}
            height={blackH}
            rx={2}
            fill="#1a1a1a"
            stroke="#000"
            strokeWidth={0.5}
            className="hover:fill-[#333] active:fill-fret-green cursor-pointer"
            onPointerDown={(e) => {
              (e.target as SVGElement).setPointerCapture(e.pointerId);
              noteOn(midi, e.pointerId);
            }}
            onPointerUp={(e) => noteOff(e.pointerId)}
            onPointerCancel={(e) => noteOff(e.pointerId)}
            onPointerLeave={(e) => noteOff(e.pointerId)}
          />
          <text
            x={x + blackW / 2}
            y={blackH - 6}
            textAnchor="middle"
            fill="#888"
            fontSize={6}
            className="pointer-events-none"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Isomorphic Wicki-Hayden hex grid
const HEX_ROWS = 5;
const HEX_COLS = 10;
const HEX_R = 18;

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function IsomorphicKeyboard() {
  const voicesRef = useRef<Map<number, { stop: () => void }>>(new Map());

  // Wicki-Hayden: right = +2 semitones, up-right = +5 semitones
  // Base MIDI note at bottom-left
  const BASE_MIDI = 48;

  const hexW = HEX_R * Math.sqrt(3);
  const hexH = HEX_R * 2;
  const rowH = hexH * 0.75;
  const svgW = (HEX_COLS + 0.5) * hexW + 10;
  const svgH = HEX_ROWS * rowH + HEX_R + 10;

  const hexes: { midi: number; cx: number; cy: number; label: string }[] = [];

  for (let row = 0; row < HEX_ROWS; row++) {
    for (let col = 0; col < HEX_COLS; col++) {
      const invertedRow = HEX_ROWS - 1 - row;
      const midi = BASE_MIDI + invertedRow * 5 + col * 2;
      const offsetX = row % 2 === 1 ? hexW / 2 : 0;
      const cx = 5 + hexW / 2 + col * hexW + offsetX;
      const cy = 5 + HEX_R + row * rowH;
      hexes.push({ midi, cx, cy, label: noteName(midi % 12) });
    }
  }

  const noteOn = useCallback((midi: number, pointerId: number) => {
    if (voicesRef.current.has(pointerId)) return;
    const handle = getSynth().play(midiToFreq(midi));
    voicesRef.current.set(pointerId, handle);
  }, []);

  const noteOff = useCallback((pointerId: number) => {
    const voice = voicesRef.current.get(pointerId);
    if (voice) {
      voice.stop();
      voicesRef.current.delete(pointerId);
    }
  }, []);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="select-none"
      style={{ touchAction: 'none' }}
    >
      {hexes.map(({ midi, cx, cy, label }, i) => (
        <g key={i}>
          <polygon
            points={hexPoints(cx, cy, HEX_R - 1)}
            fill="#f3f4f6"
            stroke="#d1d5db"
            strokeWidth={1}
            className="hover:fill-[#e5e7eb] active:fill-fret-green cursor-pointer"
            onPointerDown={(e) => {
              (e.target as SVGElement).setPointerCapture(e.pointerId);
              noteOn(midi, e.pointerId);
            }}
            onPointerUp={(e) => noteOff(e.pointerId)}
            onPointerCancel={(e) => noteOff(e.pointerId)}
            onPointerLeave={(e) => noteOff(e.pointerId)}
          />
          <text
            x={cx}
            y={cy + 3.5}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={8}
            className="pointer-events-none"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SynthKeyboard({ mode }: SynthKeyboardProps) {
  return mode === 'classic' ? <ClassicKeyboard /> : <IsomorphicKeyboard />;
}
