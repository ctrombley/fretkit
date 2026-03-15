import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import Note from '../lib/Note';
import { calcFretWidth } from './Fretboard';
import { STRING_HEIGHT, FRETBOARD_MARGIN } from '../lib/fretboardConstants';
import { getMasterBus } from '../lib/masterBus';

const VISUAL_HZ = 3.5;
const AMP_SCALE = 8;
const AMP_THRESHOLD = 0.08;
const STEPS = 24;

function calcNodeX(fret: number, startingFret: number, nutX: number): number {
  if (fret === 0 || fret < startingFret) return nutX;
  if (fret === startingFret) return nutX;
  return calcFretWidth(fret - 1) + calcNodeX(fret - 1, startingFret, nutX);
}

function buildWavePath(
  x0: number, x1: number, y: number,
  amp: number, phase: number,
): string {
  if (x1 <= x0 + 1) return '';
  let d = `M ${x0} ${y}`;
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = x0 + t * (x1 - x0);
    const wy = y + amp * Math.sin(Math.PI * t) * Math.cos(phase);
    d += ` L ${x.toFixed(1)} ${wy.toFixed(2)}`;
  }
  return d;
}

interface StringWaveLayerProps {
  tuning: string[];
  startingFret: number;
  boardWidth: number;
}

export default function StringWaveLayer({ tuning, startingFret, boardWidth }: StringWaveLayerProps) {
  const stringCount = tuning.length;
  const nutX = FRETBOARD_MARGIN;
  const endX = boardWidth - FRETBOARD_MARGIN;

  const reversedTuning = useMemo(() => tuning.slice().reverse(), [tuning]);
  const openSemitones = useMemo(
    () => reversedTuning.map(t => new Note(t).semitones),
    [reversedTuning],
  );

  const leftRefs = useRef<(SVGPathElement | null)[]>([]);
  const rightRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const state = useStore.getState();
      const rms = getMasterBus().getRmsLevel();
      const now = performance.now();
      const phase = (now / 1000) * VISUAL_HZ * 2 * Math.PI;
      const amp = rms * AMP_SCALE;

      for (let i = 0; i < stringCount; i++) {
        const leftPath = leftRefs.current[i];
        const rightPath = rightRefs.current[i];
        if (!leftPath || !rightPath) continue;

        const yOffset = FRETBOARD_MARGIN + STRING_HEIGHT * i;
        const stringNumber = stringCount - 1 - i;
        const openSemi = openSemitones[i]!;

        // Find active semitone for this string: latch first, then arp
        let activeSemi: number | undefined;
        if (state.sandboxSoundingStrings.includes(stringNumber)) {
          activeSemi = state.sandboxActiveNotes.find(s => {
            const fret = s - openSemi;
            return fret >= 0 && fret <= 24;
          });
        }
        if (activeSemi === undefined) {
          activeSemi = state.arpStrikeNotes.find(s => {
            const fret = s - openSemi;
            return fret >= 0 && fret <= 24;
          });
        }

        if (activeSemi === undefined || amp < AMP_THRESHOLD) {
          leftPath.setAttribute('d', '');
          rightPath.setAttribute('d', '');
          continue;
        }

        const fret = activeSemi - openSemi;
        const nodeX = Math.min(endX, calcNodeX(fret, startingFret, nutX));

        // Left segment (nut → fret): full-amplitude vibration
        if (fret > 0 && nodeX > nutX + 2) {
          leftPath.setAttribute('d', buildWavePath(nutX, nodeX, yOffset, amp, phase));
        } else {
          leftPath.setAttribute('d', '');
        }

        // Right segment (fret → saddle): dimmer, phase-offset
        rightPath.setAttribute('d', buildWavePath(nodeX, endX, yOffset, amp * 0.45, phase + Math.PI));
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      // Clear all paths on cleanup
      for (let i = 0; i < stringCount; i++) {
        leftRefs.current[i]?.setAttribute('d', '');
        rightRefs.current[i]?.setAttribute('d', '');
      }
    };
  }, [openSemitones, startingFret, nutX, endX, stringCount]);

  return (
    <g className="string-wave-layer" pointerEvents="none">
      <defs>
        <filter id="string-wave-glow" x="-20%" y="-150%" width="140%" height="400%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {reversedTuning.map((_, i) => (
        <g key={i}>
          <path
            ref={el => { leftRefs.current[i] = el; }}
            stroke="#4ade80"
            strokeWidth={1.5}
            fill="none"
            opacity={0.9}
            filter="url(#string-wave-glow)"
          />
          <path
            ref={el => { rightRefs.current[i] = el; }}
            stroke="#4ade80"
            strokeWidth={1.5}
            fill="none"
            opacity={0.3}
            filter="url(#string-wave-glow)"
          />
        </g>
      ))}
    </g>
  );
}
