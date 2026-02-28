/**
 * Shared utility functions for voicing UI features.
 */

import type Sequence from './Sequence';
import Note from './Note';
import { detectBarres, computeErgonomicScore, type StringAssignment, type ErgonomicBreakdown } from './ergonomics';

export const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
} as const;

export type DifficultyTier = 'easy' | 'medium' | 'hard';

/** Build a tab-style shorthand string, e.g. "x32010". String 0 (lowest) is leftmost. */
export function tabShorthand(sequence: Sequence, stringCount: number): string {
  const byString = new Map<number, number>();
  for (const sn of sequence.stringNotes) {
    byString.set(sn.string, sn.fret);
  }

  let result = '';
  for (let s = 0; s < stringCount; s++) {
    const fret = byString.get(s);
    if (fret === undefined) {
      result += 'x';
    } else if (fret >= 10) {
      result += `(${fret})`;
    } else {
      result += String(fret);
    }
  }
  return result;
}

/** Classify voicing shape: "Open", "Barre", or "Nth pos". */
export function shapeType(sequence: Sequence, tuning: string[]): string {
  const assignments: StringAssignment[] = [];
  const byString = new Map<number, number>();
  for (const sn of sequence.stringNotes) {
    byString.set(sn.string, sn.fret);
  }

  for (let s = 0; s < tuning.length; s++) {
    const fret = byString.get(s);
    assignments.push({ string: s, fret: fret ?? null });
  }

  const barres = detectBarres(assignments);
  if (barres.length > 0) return 'Barre';

  const hasOpen = sequence.stringNotes.some(sn => sn.fret === 0);
  if (hasOpen) return 'Open';

  const minFret = sequence.minFret;
  return `${ordinal(minFret)} pos`;
}

/** Convert inversion number to label. */
export function inversionLabel(inversion: number): string {
  if (inversion === 0) return 'Root';
  if (inversion === 1) return '1st inv';
  if (inversion === 2) return '2nd inv';
  if (inversion === 3) return '3rd inv';
  return `${inversion}th inv`;
}

/** Per-string status for muted/open/fretted indicators. */
export type StringStatus = 'muted' | 'open' | 'fretted';

export function stringStatuses(sequence: Sequence, stringCount: number): StringStatus[] {
  const byString = new Map<number, number>();
  for (const sn of sequence.stringNotes) {
    byString.set(sn.string, sn.fret);
  }

  const result: StringStatus[] = [];
  for (let s = 0; s < stringCount; s++) {
    const fret = byString.get(s);
    if (fret === undefined) {
      result.push('muted');
    } else if (fret === 0) {
      result.push('open');
    } else {
      result.push('fretted');
    }
  }
  return result;
}

/** Compute ergonomic score for a Sequence object. */
export function scoreSequence(
  sequence: Sequence,
  stringCount: number,
  rootPitchClass: number,
  tuning: string[],
): ErgonomicBreakdown {
  const byString = new Map<number, { fret: number; semitones: number }>();
  for (const sn of sequence.stringNotes) {
    byString.set(sn.string, { fret: sn.fret, semitones: sn.semitones });
  }

  const assignments: (StringAssignment & { pitchClass?: number })[] = [];
  for (let s = 0; s < stringCount; s++) {
    const entry = byString.get(s);
    if (entry === undefined) {
      assignments.push({ string: s, fret: null });
    } else {
      const openNote = new Note(tuning[s]!);
      const pc = ((openNote.semitones + entry.fret) % 12 + 12) % 12;
      assignments.push({ string: s, fret: entry.fret, pitchClass: pc });
    }
  }

  return computeErgonomicScore(assignments, rootPitchClass);
}

/** Map total cost to difficulty tier. */
export function difficultyTier(totalCost: number): DifficultyTier {
  if (totalCost < 1.5) return 'easy';
  if (totalCost < 3.0) return 'medium';
  return 'hard';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]!);
}
