import { useCallback, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { noteName } from '../lib/harmony';
import { getPitchClassColor } from '../lib/noteColors';
import { FACTORY_SCALE_PRESETS, type ScaleEntry } from '../lib/monochordScales';
import { FUNDAMENTAL_NOTES, DEFAULT_FUNDAMENTAL } from '../lib/monochord';

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

/**
 * Returns the JI frequency for a MIDI key given the current monochord scale,
 * or null if that key has no corresponding scale tone.
 *
 * Bridge-position math: left-segment frequency = fundHz / entry.pos
 * Octave transposition: 2^(keyOctave - entryOctave)
 */
function getMonochordFreq(
  midi: number,
  fundMidi: number,
  fundHz: number,
  entries: ScaleEntry[],
): number | null {
  if (entries.length === 0) return null;
  const stepsAboveFund = midi - fundMidi;
  const pcOffset = ((stepsAboveFund % 12) + 12) % 12;

  let match: ScaleEntry | null = null;
  for (const e of entries) {
    if (e.semitones % 12 === pcOffset) { match = e; break; }
  }

  // Implicit unison: the fundamental note always plays even without an explicit entry
  if (!match && pcOffset === 0) {
    return fundHz * Math.pow(2, Math.floor(stepsAboveFund / 12));
  }
  if (!match) return null;

  const baseHz = fundHz / match.pos;
  return baseHz * Math.pow(2, Math.floor(stepsAboveFund / 12) - Math.floor(match.semitones / 12));
}

interface KeyboardInnerProps {
  sandboxActiveNotes: number[];
  bloomAllOctaves: boolean;
  useLatch: boolean;
  toggleSandboxNote: (semitones: number, frequency: number) => void;
  activateSandboxNote: (semitones: number, frequency: number) => void;
  deactivateSandboxNote: (semitones: number) => void;
  scalePcs?: number[];  // pitch classes from active monochord scale
  /** When set, replaces midiToFreq; returning null suppresses the key press. */
  noteFreqOverride?: (midi: number) => number | null;
}

function isNoteActive(midi: number, sandboxActiveNotes: number[], bloomAllOctaves: boolean): boolean {
  return bloomAllOctaves
    ? sandboxActiveNotes.some(s => s % 12 === midi % 12)
    : sandboxActiveNotes.includes(midi);
}

function ClassicKeyboard({
  sandboxActiveNotes,
  bloomAllOctaves,
  useLatch,
  toggleSandboxNote,
  activateSandboxNote,
  deactivateSandboxNote,
  noteFreqOverride,
}: KeyboardInnerProps) {
  // Maps pointerId → midi (for momentary mode noteOff tracking)
  const pointerMidiRef = useRef<Map<number, number>>(new Map());
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
      const whiteIdxBefore = WHITE_SEMITONES.filter(s => s < offset).length;
      const x = (oct * 7 + whiteIdxBefore) * keyW - blackW / 2 + keyW + 1;
      blacks.push({ midi, x, label: noteName(midi % 12) });
    }
  }

  const noteOn = useCallback((midi: number, pointerId: number) => {
    if (pointerMidiRef.current.has(pointerId)) return;
    const freq = noteFreqOverride ? noteFreqOverride(midi) : midiToFreq(midi);
    if (freq === null) return;
    pointerMidiRef.current.set(pointerId, midi);
    if (useLatch) {
      toggleSandboxNote(midi, freq);
    } else {
      activateSandboxNote(midi, freq);
    }
  }, [useLatch, noteFreqOverride, toggleSandboxNote, activateSandboxNote]);

  const noteOff = useCallback((pointerId: number) => {
    const midi = pointerMidiRef.current.get(pointerId);
    pointerMidiRef.current.delete(pointerId);
    if (!useLatch && midi !== undefined) {
      deactivateSandboxNote(midi);
    }
  }, [useLatch, deactivateSandboxNote]);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="select-none"
      style={{ touchAction: 'none' }}
    >
      {/* White keys */}
      {whites.map(({ midi, x, label }) => {
        const active = isNoteActive(midi, sandboxActiveNotes, bloomAllOctaves);
        const color = active ? getPitchClassColor(midi % 12) : undefined;
        return (
          <g key={midi}>
            <rect
              x={x}
              y={1}
              width={keyW - 1}
              height={keyH}
              rx={3}
              fill={color ?? '#e5e5e5'}
              stroke="#999"
              strokeWidth={0.5}
              className={active ? 'cursor-pointer' : 'hover:fill-[#d5d5d5] active:fill-fret-green cursor-pointer'}
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
              fill={active ? 'white' : '#666'}
              fontSize={8}
              className="pointer-events-none"
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* Black keys */}
      {blacks.map(({ midi, x, label }) => {
        const active = isNoteActive(midi, sandboxActiveNotes, bloomAllOctaves);
        const color = active ? getPitchClassColor(midi % 12) : undefined;
        return (
          <g key={midi}>
            <rect
              x={x}
              y={1}
              width={blackW}
              height={blackH}
              rx={2}
              fill={color ?? '#1a1a1a'}
              stroke="#000"
              strokeWidth={0.5}
              className={active ? 'cursor-pointer' : 'hover:fill-[#333] active:fill-fret-green cursor-pointer'}
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
              fill={active ? 'white' : '#888'}
              fontSize={6}
              className="pointer-events-none"
            >
              {label}
            </text>
          </g>
        );
      })}
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

function IsomorphicKeyboard({
  sandboxActiveNotes,
  bloomAllOctaves,
  useLatch,
  toggleSandboxNote,
  activateSandboxNote,
  deactivateSandboxNote,
  scalePcs = [],
  noteFreqOverride,
}: KeyboardInnerProps) {
  const pointerMidiRef = useRef<Map<number, number>>(new Map());

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
    if (pointerMidiRef.current.has(pointerId)) return;
    const freq = noteFreqOverride ? noteFreqOverride(midi) : midiToFreq(midi);
    if (freq === null) return;
    pointerMidiRef.current.set(pointerId, midi);
    if (useLatch) {
      toggleSandboxNote(midi, freq);
    } else {
      activateSandboxNote(midi, freq);
    }
  }, [useLatch, noteFreqOverride, toggleSandboxNote, activateSandboxNote]);

  const noteOff = useCallback((pointerId: number) => {
    const midi = pointerMidiRef.current.get(pointerId);
    pointerMidiRef.current.delete(pointerId);
    if (!useLatch && midi !== undefined) {
      deactivateSandboxNote(midi);
    }
  }, [useLatch, deactivateSandboxNote]);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="select-none"
      style={{ touchAction: 'none' }}
    >
      {hexes.map(({ midi, cx, cy, label }, i) => {
        const active   = isNoteActive(midi, sandboxActiveNotes, bloomAllOctaves);
        const inScale  = scalePcs.includes(midi % 12);
        // Active → solid pitch-class color; in-scale → very faint tint; otherwise grey
        const fill = active
          ? getPitchClassColor(midi % 12)
          : inScale
            ? getPitchClassColor(midi % 12) + '38'  // ~22 % opacity tint
            : '#f3f4f6';
        const textFill = active ? 'white' : inScale ? getPitchClassColor(midi % 12) : '#6b7280';
        const strokeColor = inScale && !active ? getPitchClassColor(midi % 12) + '88' : '#d1d5db';
        return (
          <g key={i}>
            <polygon
              points={hexPoints(cx, cy, HEX_R - 1)}
              fill={fill}
              stroke={strokeColor}
              strokeWidth={inScale && !active ? 1.5 : 1}
              className={active ? 'cursor-pointer' : 'hover:opacity-80 active:fill-fret-green cursor-pointer'}
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
              fill={textFill}
              fontSize={8}
              fontWeight={inScale ? 'bold' : 'normal'}
              className="pointer-events-none"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function SynthKeyboard({ mode }: SynthKeyboardProps) {
  const sandboxActiveNotes    = useStore(s => s.sandboxActiveNotes);
  const bloomAllOctaves       = useStore(s => s.bloomAllOctaves);
  const sandboxLatch          = useStore(s => s.sandboxLatch);
  const arpEnabled            = useStore(s => s.arpEnabled);
  const toggleSandboxNote     = useStore(s => s.toggleSandboxNote);
  const activateSandboxNote   = useStore(s => s.activateSandboxNote);
  const deactivateSandboxNote = useStore(s => s.deactivateSandboxNote);
  const view                  = useStore(s => s.view);

  // Monochord scale overlay + JI frequency routing
  const monochordScaleId      = useStore(s => s.monochordScaleId);
  const monochordCustom       = useStore(s => s.monochordCustomEntries);
  const monochordUserPresets  = useStore(s => s.monochordUserPresets);
  const monochordFundName     = useStore(s => s.monochordFundamentalName);

  const monochordFund = useMemo(
    () => FUNDAMENTAL_NOTES.find(n => n.name === monochordFundName) ?? DEFAULT_FUNDAMENTAL,
    [monochordFundName],
  );

  const monochordEntries = useMemo(() => {
    return monochordScaleId === 'custom'
      ? monochordCustom
      : (FACTORY_SCALE_PRESETS.find(p => p.id === monochordScaleId)?.entries ??
         monochordUserPresets.find(p => p.id === monochordScaleId)?.entries ?? []);
  }, [monochordScaleId, monochordCustom, monochordUserPresets]);

  const scalePcs = useMemo(() => {
    if (mode !== 'isomorphic') return [];
    return monochordEntries.map(e => ((monochordFund.pitchClass + e.semitones) % 12 + 12) % 12);
  }, [mode, monochordEntries, monochordFund]);

  // When the monochord view is active, map each key to its JI frequency
  const noteFreqOverride = useMemo(() => {
    if (view.name !== 'monochord') return undefined;
    const fundMidi = monochordFund.pitchClass + (monochordFund.octave + 1) * 12;
    return (midi: number) => getMonochordFreq(midi, fundMidi, monochordFund.hz, monochordEntries);
  }, [view.name, monochordFund, monochordEntries]);

  const useLatch = sandboxLatch || arpEnabled;

  const props: KeyboardInnerProps = {
    sandboxActiveNotes,
    bloomAllOctaves,
    useLatch,
    toggleSandboxNote,
    activateSandboxNote,
    deactivateSandboxNote,
    scalePcs,
    noteFreqOverride,
  };

  return mode === 'classic' ? <ClassicKeyboard {...props} /> : <IsomorphicKeyboard {...props} />;
}
