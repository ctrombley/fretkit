import { getArpeggiator } from '../lib/arpeggiator';
import type { ArpPattern, ArpMode } from '../lib/arpeggiator';
import { getPatternById, FINGER_PICKING_PATTERNS } from '../lib/fingerPickingPatterns';
import Note from '../lib/Note';
import { getInternalMidiBus } from '../lib/internalMidiBus';
import { latchFrequencies } from './latchFrequencies';
import type { AppState, StoreSet, StoreGet } from './types';

export const ARP_PERSISTED_KEYS: (keyof AppState)[] = [
  'arpEnabled',
  'arpPattern',
  'arpOctaveRange',
  'arpSync',
  'arpSyncSpeed',
  'arpFreeMs',
  'arpMode',
  'arpFingerPickingPatternId',
];

/** Load the notes from a chord voicing sequence into the arpeggiator, replacing current notes. */
function applySequenceToArp(sequences: import('../lib/Sequence').default[], seqIdx: number): void {
  const seq = sequences[seqIdx];
  if (!seq) return;
  const arp = getArpeggiator();
  arp.clear();
  const seen = new Set<number>();
  for (const sn of seq.stringNotes) {
    if (!seen.has(sn.semitones)) {
      seen.add(sn.semitones);
      arp.addNote(sn.frequency, sn.semitones);
    }
  }
}

export function createArpSlice(set: StoreSet, get: StoreGet) {
  return {
    arpEnabled: false,
    arpPattern: 'up' as ArpPattern,
    arpOctaveRange: 1,
    arpSync: true,
    arpSyncSpeed: 2,
    arpFreeMs: 200,
    arpStrikeNotes: [] as number[],
    arpStrikeCount: 0,
    arpStrikeFingers: {} as Record<string, import('../lib/fingerPickingPatterns').FingerLabel | null>,
    arpMode: 'standard' as ArpMode,
    arpFingerPickingPatternId: FINGER_PICKING_PATTERNS[0]!.id,

    setArpEnabled: (enabled: boolean) => {
      const state = get();
      const arp = getArpeggiator();
      const bus = getInternalMidiBus();
      if (enabled) {
        // Stop latch voices through the bus before handing control to the arp
        for (const semi of Object.values(state.sandboxActiveNotes).flat()) {
          bus.noteOff(semi, 'latch');
          latchFrequencies.delete(semi);
        }
        arp.enable();
        set({ arpEnabled: true });
        get().syncArpToFretboard(state.settings.settingsId);
      } else {
        arp.disable();
        arp.clear();
        set({ arpEnabled: false });
        // Restart latch voices through the bus so the instrument manages them
        for (const semi of Object.values(state.sandboxActiveNotes).flat()) {
          const freq = 440 * Math.pow(2, (semi - 69) / 12);
          bus.noteOn(semi, freq, 'latch');
          latchFrequencies.set(semi, freq);
        }
      }
    },

    setArpPattern: (pattern: ArpPattern) => {
      set({ arpPattern: pattern });
      getArpeggiator().pattern = pattern;
    },

    setArpOctaveRange: (range: number) => {
      set({ arpOctaveRange: range });
      getArpeggiator().setOctaveRange(range);
    },

    setArpSync: (sync: boolean) => set({ arpSync: sync }),
    setArpSyncSpeed: (speed: number) => set({ arpSyncSpeed: speed }),
    setArpFreeMs: (ms: number) => set({ arpFreeMs: ms }),

    setArpMode: (mode: ArpMode) => {
      set({ arpMode: mode });
      const arp = getArpeggiator();
      arp.mode = mode;
      // Sync lit notes immediately when switching to litRandom
      if (mode === 'litRandom') get().syncArpToFretboard(get().settings.settingsId);
    },

    setArpFingerPickingPatternId: (id: string) => {
      set({ arpFingerPickingPatternId: id });
      const pattern = getPatternById(id);
      if (pattern) {
        const arp = getArpeggiator();
        arp.fingerPickingSequence = pattern.sequence;
        arp.fingerPickingFingers = pattern.fingers;
      }
      get().syncArpToFretboard(get().settings.settingsId);
    },

    loadVoicingIntoArp: (fretboardId: string, overrideSeqIdx?: number) => {
      const state = get();
      if (!state.arpEnabled) return;
      const fb = state.fretboards[fretboardId];
      if (!fb?.sequenceEnabled) return;
      const seqIdx = overrideSeqIdx ?? fb.sequenceIdx;
      if (seqIdx === null) return;
      applySequenceToArp(fb.sequences, seqIdx);
    },

    /**
     * Sync arp note set to current state for a fretboard.
     * Priority: chord voicing → manually toggled sandbox notes → open strings.
     * Called whenever the fretboard's chord selection changes.
     */
    syncArpToFretboard: (fretboardId: string) => {
      const state = get();
      if (!state.arpEnabled) return;
      const fb = state.fretboards[fretboardId];
      if (!fb) return;
      const arp = getArpeggiator();

      // litRandom mode: use the fretboard's lit (scale/chord) notes as the random pool
      if (state.arpMode === 'litRandom') {
        const pool = (fb.litNotes ?? []).map(n => ({ frequency: n.frequency, semitones: n.semitones }));
        arp.setLitNotes(pool);
        return;
      }

      // Priority 1: chord voicing
      if (fb.sequenceEnabled && fb.sequenceIdx !== null && fb.sequences.length > 0) {
        applySequenceToArp(fb.sequences, fb.sequenceIdx);
        return;
      }

      // Priority 2: manually toggled notes
      const allActive = Object.values(state.sandboxActiveNotes).flat();
      if (allActive.length > 0) {
        arp.clear();
        for (const semi of allActive) {
          const freq = 440 * Math.pow(2, (semi - 69) / 12);
          arp.addNote(freq, semi);
        }
        return;
      }

      // Priority 3: open strings of the fretboard tuning
      arp.clear();
      for (const noteName of fb.tuning) {
        try {
          const note = new Note(noteName);
          arp.addNote(note.frequency, note.semitones);
        } catch { /* ignore malformed tuning strings */ }
      }
    },
  };
}
