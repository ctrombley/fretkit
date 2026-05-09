import { useState, useCallback } from 'react';
import Note from '../lib/Note';
import StringMarker from './StringMarker';
import { useStore } from '../store';
import { STRING_HEIGHT } from '../lib/fretboardConstants';
import { useFretboardContext } from './FretboardContext';

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
  const context = useFretboardContext();
  const { fretboardId, current, litNotes, sequence, sequenceEnabled, onStrum, droneActive, droneFrets, onDroneFretSelect } = context;
  const slideRef = context.slideRef;
  const [isPreview, setIsPreview] = useState(false);
  const sandboxLatch = useStore(s => s.sandboxLatch);
  const arpEnabled = useStore(s => s.arpEnabled);
  const stringNumber = (stringCount - 1) - idx;
  const isMarked = useStore(s => {
    const fbId = fretboardId ?? '';
    const fbNotes = s.sandboxActiveNotes[fbId] ?? [];
    const fb = s.fretboards[fbId];
    const showOctaves = fb?.showOctaves ?? false;
    const showEnharmonic = fb?.showEnharmonic ?? false;

    if (showOctaves) {
      return fbNotes.some(semi => semi % 12 === note.baseSemitones)
        || s.strumPreviewSemitones.some(semi => semi % 12 === note.baseSemitones);
    }
    if (showEnharmonic) {
      return fbNotes.includes(note.semitones)
        || s.strumPreviewSemitones.includes(note.semitones);
    }
    // Default: only the exact string+note position that was activated
    const fbPositions = s.sandboxActiveFretPositions[fbId] ?? [];
    return fbPositions.some(([str, semi]) => str === stringNumber && semi === note.semitones)
      || s.strumPreviewSemitones.includes(note.semitones);
  });
  const fingerLabel = useStore(s =>
    s.arpEnabled && s.arpMode === 'fingerPicking'
      ? (s.arpStrikeFingers[note.semitones] ?? undefined)
      : undefined
  );
  const toggleNote = useStore(s => s.toggleSandboxNote);
  const activateNote = useStore(s => s.activateSandboxNote);
  const deactivateNote = useStore(s => s.deactivateSandboxNote);
  const slideNote = useStore(s => s.slideSandboxNote);
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

    // Clear any stale slide state from a drag that ended off-screen (no pointerup fired).
    // Without this, the next handlePointerUp on any fret would see the leftover slideRef
    // and immediately deactivate the note that was just turned on.
    if (slideRef.current) slideRef.current = null;

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
      slideRef.current = { stringIdx: idx, stringNumber, currentSemitones: note.semitones };
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
      return;
    }

    console.log('[fret] pointerdown', { useLatch, semitones: note.semitones, fretboardId });
    if (useLatch) {
      toggleNote(note.semitones, note.frequency, stringNumber, fretboardId);
    } else {
      activateNote(note.semitones, note.frequency, stringNumber, fretboardId);
    }
  }, [droneActive, onDroneFretSelect, stringNumber, sequenceEnabled, isLit, onStrum, current, useLatch, note.semitones, note.frequency, fretboardId, toggleNote, activateNote, idx, slideRef]);

  const handlePointerEnter = useCallback(() => {
    // Drag to new fret: if pointer is held and we're at a different fret, update pitch instantly (legato)
    if (slideRef.current?.stringIdx === idx && slideRef.current.currentSemitones !== note.semitones) {
      const prev = slideRef.current.currentSemitones;
      slideNote(prev, note.semitones, note.frequency, stringNumber, fretboardId);
      slideRef.current.currentSemitones = note.semitones;
    }
  }, [idx, slideRef, note.semitones, note.frequency, slideNote, stringNumber, fretboardId]);

  const handlePointerUp = useCallback(() => {
    // If any slide is active, stop it — even if the pointer was released on a different string
    if (slideRef.current) {
      deactivateNote(slideRef.current.currentSemitones, slideRef.current.stringNumber, fretboardId);
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
