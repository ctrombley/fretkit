import { useState, useCallback } from 'react';
import Note from '../lib/Note';
import StringMarker from './StringMarker';
import { useStore } from '../store';
import { STRING_HEIGHT } from '../lib/fretboardConstants';
import { useFretboardContext } from './FretboardContext';
import { noteDissonance } from '../lib/harmonicAnalysis';
import { getEngineForFretboard } from '../lib/fretboardEngines';

interface FretStringProps {
  fretIdx: number;
  fretWidth: number;
  idx: number;
  note: Note;
  stringCount: number;
  xOffset: number;
  yOffset: number;
}

export default function FretString({
  fretIdx,
  fretWidth,
  idx,
  note,
  stringCount,
  xOffset,
  yOffset,
}: FretStringProps) {
  const { fretboardId, current, litNotes, sequence, sequenceEnabled, onStrum, droneActive, droneFrets, onDroneFretSelect, slideRef } = useFretboardContext();
  const [isPreview, setIsPreview] = useState(false);
  const [slideActiveFret, setSlideActiveFret] = useState<number | null>(null);
  const sandboxLatch = useStore(s => s.sandboxLatch);
  const arpEnabled = useStore(s => s.arpEnabled);
  const isMarked = useStore(s => {
    if (s.bloomAllOctaves) {
      return s.sandboxActiveNotes.some(semi => semi % 12 === note.baseSemitones)
        || s.strumPreviewSemitones.some(semi => semi % 12 === note.baseSemitones);
    }
    return s.sandboxActiveNotes.includes(note.semitones)
      || s.strumPreviewSemitones.includes(note.semitones);
  });
  const arpStrike = useStore(s =>
    s.arpStrikeNotes.includes(note.semitones) ? s.arpStrikeCount : 0
  );
  const fingerLabel = useStore(s =>
    s.arpEnabled && s.arpMode === 'fingerPicking'
      ? (s.arpStrikeFingers[note.semitones] ?? undefined)
      : undefined
  );
  // Consonance highlight: show when a note is active and this fret is consonant with it
  const isConsonant = useStore(s => {
    if (s.sandboxActiveNotes.length === 0) return false;
    const minDissonance = Math.min(
      ...s.sandboxActiveNotes.map(semi => noteDissonance(note.frequency, new Note(semi).frequency))
    );
    return minDissonance < 0.25;
  });
  const stringNumber = (stringCount - 1) - idx;

  const toggleNote = useStore(s => s.toggleSandboxNote);
  const activateNote = useStore(s => s.activateSandboxNote);
  const deactivateNote = useStore(s => s.deactivateSandboxNote);
  const isDroneSelected = droneActive && (droneFrets[stringNumber] ?? null) === note.semitones;
  // Variable thickness: idx 0 = treble (thin), idx n-1 = bass (thick)
  const stringThickness = 0.5 + (idx / Math.max(1, stringCount - 1)) * 2;
  // Nut position: fretWidth is 0 so the normal rect overlay covers nothing
  const isOpenString = fretIdx === 0;
  // Open string marker cx mirrors StringMarker's nut offset (xOffset + fretWidth/2 - 15 = xOffset - 15)
  const openStringCx = xOffset - 15;

  const isLit = (() => {
    if (sequenceEnabled && sequence) {
      return sequence.stringNotes.some(
        sn => sn.semitones === note.semitones && sn.string === stringNumber
      );
    }
    const litSemitones = litNotes.map(n => n.baseSemitones);
    return litSemitones.includes(note.baseSemitones);
  })();

  const isRoot = current?.root
    ? current.root.semitones === note.baseSemitones
    : false;

  const useLatch = arpEnabled || sandboxLatch;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Stop propagation so FretboardSection doesn't call setPointerCapture,
    // which would swallow our pointerup and leave notes stuck on.
    e.stopPropagation();

    // In drone mode, select this fret for this string (one per string, replaces previous)
    if (droneActive) {
      onDroneFretSelect?.(stringNumber, note.semitones);
      return;
    }

    // In chord voicing mode, clicking a lit note strums the whole voicing
    if (sequenceEnabled && isLit && onStrum) {
      onStrum();
      return;
    }
    // In chord display mode, clicking a lit note plays momentarily — bypass latch
    if (current && isLit) {
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
      return;
    }

    // Click-and-drag mode: non-latch, non-arp
    // Start a note and allow drag to change pitch without retriggering envelope
    if (!useLatch && !current && !isLit) {
      const engine = getEngineForFretboard(fretboardId);
      const voice = engine.synth.play(note.frequency);
      slideRef.current = { stringIdx: idx, voice, currentSemitones: note.semitones };
      setSlideActiveFret(note.semitones);
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
      return;
    }

    if (useLatch) {
      toggleNote(note.semitones, note.frequency, stringNumber, fretboardId);
    } else {
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
    }
  }, [droneActive, onDroneFretSelect, stringNumber, sequenceEnabled, isLit, onStrum, current, useLatch, note.semitones, note.frequency, fretboardId, toggleNote, activateNote, idx, slideRef]);

  const handlePointerEnter = useCallback(() => {
    // Drag to new fret: if pointer is held and we're at a different fret, update pitch instantly
    if (slideRef.current?.stringIdx === idx && slideRef.current.currentSemitones !== note.semitones) {
      const { voice, currentSemitones } = slideRef.current;
      // Update frequency instantly (0 second portamento) without retriggering envelope
      voice.setFrequency(note.frequency, 0);
      slideRef.current.currentSemitones = note.semitones;
      setSlideActiveFret(note.semitones);
      // Update visual state
      deactivateNote(currentSemitones, stringNumber, fretboardId);
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
    }
  }, [idx, slideRef, note.semitones, note.frequency, stringNumber, fretboardId, deactivateNote, activateNote]);

  const handlePointerUp = useCallback(() => {
    // If sliding on this string, stop the voice and clean up
    if (slideRef.current?.stringIdx === idx) {
      slideRef.current.voice.stop();
      deactivateNote(slideRef.current.currentSemitones, stringNumber, fretboardId);
      setSlideActiveFret(null);
      slideRef.current = null;
      return;
    }

    if (current && isLit) {
      deactivateNote(note.semitones, stringNumber, fretboardId);
      return;
    }
    if (!useLatch) {
      deactivateNote(note.semitones, stringNumber, fretboardId);
    }
  }, [idx, slideRef, stringNumber, fretboardId, deactivateNote, current, isLit, useLatch, note.semitones]);

  const handlePointerLeave = useCallback(() => {
    // If sliding on this string, don't deactivate — the slide continues
    if (slideRef.current?.stringIdx === idx) {
      return;
    }

    if (current && isLit) {
      deactivateNote(note.semitones, stringNumber, fretboardId);
      return;
    }
    if (!useLatch && isMarked) {
      deactivateNote(note.semitones, stringNumber, fretboardId);
    }
  }, [idx, slideRef, current, isLit, useLatch, isMarked, note.semitones, stringNumber, fretboardId, deactivateNote]);

  return (
    <g className={`string string-${idx}`}>
      <line
        className="string__line"
        x1={xOffset}
        x2={xOffset + fretWidth}
        y1={yOffset}
        y2={yOffset}
        strokeWidth={stringThickness}
      />
      {isLit && (
        <StringMarker
          className="string__marker-lit"
          fretWidth={fretWidth}
          isNut={fretIdx === 0}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
          isRoot={isRoot}
        />
      )}
      {isMarked && !isLit && !sequenceEnabled && !droneActive && (
        <StringMarker
          fretWidth={fretWidth}
          isNut={isOpenString}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
          isRoot={isRoot}
          isPlaying={isMarked}
          bloomKey={arpEnabled ? arpStrike : undefined}
          fingerLabel={fingerLabel}
        />
      )}
      {isDroneSelected && (
        <StringMarker
          className="string__marker-drone"
          fretWidth={fretWidth}
          isNut={isOpenString}
          xOffset={xOffset}
          yOffset={yOffset}
          note={note}
          isRoot={isRoot}
          isPlaying
        />
      )}
      {/* Consonance ring: frets consonant with a currently active note */}
      {isConsonant && !isMarked && !isLit && !droneActive && !isOpenString && (
        <circle
          cx={xOffset + fretWidth / 2}
          cy={yOffset}
          r={7}
          className="string__marker-consonant"
          pointerEvents="none"
        />
      )}
      {/* Hint ring: shows open string is playable when not lit or active */}
      {isOpenString && !isLit && !isMarked && !droneActive && (
        <circle
          cx={openStringCx}
          cy={yOffset}
          r={8}
          className="string__marker-open"
          pointerEvents="none"
        />
      )}
      {isPreview && (
        <StringMarker
          className="string__marker-preview"
          fretWidth={fretWidth}
          isNut={isOpenString}
          xOffset={xOffset}
          yOffset={yOffset}
        />
      )}
      {/* Normal fret click area */}
      {!isOpenString && (
        <rect
          className="string__overlay"
          height={STRING_HEIGHT}
          width={fretWidth}
          x={xOffset}
          y={yOffset - STRING_HEIGHT / 2}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onMouseEnter={() => setIsPreview(true)}
          onMouseLeave={() => setIsPreview(false)}
        />
      )}
      {/* Open string click area: circle covering the nut marker */}
      {isOpenString && (
        <circle
          cx={openStringCx}
          cy={yOffset}
          r={STRING_HEIGHT / 2 - 1}
          fill="transparent"
          style={{ touchAction: 'none', cursor: 'pointer' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onMouseEnter={() => setIsPreview(true)}
          onMouseLeave={() => setIsPreview(false)}
        />
      )}
    </g>
  );
}
