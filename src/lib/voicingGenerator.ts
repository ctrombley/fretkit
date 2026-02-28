/**
 * Voicing search algorithm: models the fretboard as a layered graph
 * (one layer per string) and finds ergonomically ranked chord voicings.
 */

import Note from './Note';
import StringNote from './StringNote';
import Sequence from './Sequence';
import {
  detectBarres,
  countFingersAfterBarre,
  computeErgonomicScore,
  type StringAssignment,
  type ErgonomicWeights,
} from './ergonomics';

/** A candidate note on a specific string. null fret = muted. */
interface Candidate {
  fret: number | null;
  pitchClass: number | null; // null when muted
  semitones: number | null;  // absolute semitones, null when muted
}

/** Extended assignment carrying pitch class for ergonomic scoring. */
type ScoredAssignment = StringAssignment & { pitchClass: number; semitones: number };

export interface VoicingConfig {
  maxSpan?: number;
  maxFingers?: number;
  minSounded?: number;
  maxResults?: number;
  allowOpen?: boolean;
  weights?: ErgonomicWeights;
}

const DEFAULT_CONFIG: Required<VoicingConfig> = {
  maxSpan: 4,
  maxFingers: 4,
  minSounded: 4,
  maxResults: 20,
  allowOpen: true,
  weights: undefined!,
};

/**
 * For each string, find all fret positions that produce a chord tone,
 * plus the muted option.
 */
export function buildCandidateMap(
  pitchClasses: number[],
  tuning: string[],
  maxFret: number,
  allowOpen: boolean,
): Candidate[][] {
  const pcSet = new Set(pitchClasses.map(pc => ((pc % 12) + 12) % 12));
  const candidates: Candidate[][] = [];

  for (let s = 0; s < tuning.length; s++) {
    const openNote = new Note(tuning[s]!);
    const stringCandidates: Candidate[] = [
      { fret: null, pitchClass: null, semitones: null }, // muted
    ];

    const startFret = allowOpen ? 0 : 1;
    for (let f = startFret; f <= maxFret; f++) {
      const semitones = openNote.semitones + f;
      const pc = ((semitones % 12) + 12) % 12;
      if (pcSet.has(pc)) {
        stringCandidates.push({ fret: f, pitchClass: pc, semitones });
      }
    }

    candidates.push(stringCandidates);
  }

  return candidates;
}

/**
 * Main voicing generator. DFS enumeration with pruning.
 * Returns voicings sorted by ergonomic score (best first).
 */
export function generateVoicings(
  pitchClasses: number[],
  rootPitchClass: number,
  tuning: string[],
  maxFret: number,
  config?: VoicingConfig,
): Sequence[] {
  if (pitchClasses.length === 0) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const normalizedPCs = new Set(pitchClasses.map(pc => ((pc % 12) + 12) % 12));
  const normalizedRoot = ((rootPitchClass % 12) + 12) % 12;
  const candidates = buildCandidateMap(pitchClasses, tuning, maxFret, cfg.allowOpen);
  const stringCount = tuning.length;

  const results: { assignments: (ScoredAssignment | { string: number; fret: null })[]; score: number }[] = [];
  const current: (Candidate & { string: number })[] = [];

  function dfs(stringIdx: number): void {
    if (stringIdx === stringCount) {
      // Leaf: check completeness
      const sounded = current.filter(c => c.fret !== null);
      if (sounded.length < cfg.minSounded) return;

      const coveredPCs = new Set(sounded.map(c => c.pitchClass!));
      for (const pc of normalizedPCs) {
        if (!coveredPCs.has(pc)) return; // missing pitch class
      }

      // Build assignments for scoring
      const assignments: (ScoredAssignment | { string: number; fret: null })[] = current.map(c => {
        if (c.fret === null) {
          return { string: c.string, fret: null };
        }
        return {
          string: c.string,
          fret: c.fret,
          pitchClass: c.pitchClass!,
          semitones: c.semitones!,
        };
      });

      // Exact finger count check with barre detection
      const barres = detectBarres(assignments as StringAssignment[]);
      const fingers = countFingersAfterBarre(assignments as StringAssignment[], barres);
      if (fingers > cfg.maxFingers) return;

      const breakdown = computeErgonomicScore(
        assignments as StringAssignment[],
        normalizedRoot,
        cfg.weights,
        stringCount,
      );
      results.push({ assignments, score: breakdown.totalCost });
      return;
    }

    for (const candidate of candidates[stringIdx]!) {
      // Push candidate
      const entry = { ...candidate, string: stringIdx };
      current.push(entry);

      // Pruning checks
      let prune = false;

      if (candidate.fret !== null && candidate.fret > 0) {
        // Span pruning: check fretted span
        const frettedFrets: number[] = [];
        for (const c of current) {
          if (c.fret !== null && c.fret > 0) frettedFrets.push(c.fret);
        }
        if (frettedFrets.length >= 2) {
          const span = Math.max(...frettedFrets) - Math.min(...frettedFrets);
          if (span > cfg.maxSpan) prune = true;
        }
      }

      if (!prune) {
        // Finger pruning (rough): estimate minimum fingers needed.
        // A barre can cover all strings at the same fret with 1 finger,
        // so minimum fingers = distinctFretValues (not total fretted count).
        const frettedEntries = current.filter(c => c.fret !== null && c.fret > 0);
        if (frettedEntries.length > 0) {
          const distinctFrets = new Set(frettedEntries.map(c => c.fret!));
          // Best case: one barre covers the largest fret group, rest need individual fingers
          // Minimum fingers = distinctFrets.size (each distinct fret needs at least 1 finger)
          if (distinctFrets.size > cfg.maxFingers) prune = true;
        }
      }

      if (!prune) {
        // Completeness look-ahead: can remaining strings supply missing PCs?
        const coveredPCs = new Set<number>();
        for (const c of current) {
          if (c.pitchClass !== null) coveredPCs.add(c.pitchClass);
        }
        const missingPCs = new Set<number>();
        for (const pc of normalizedPCs) {
          if (!coveredPCs.has(pc)) missingPCs.add(pc);
        }
        if (missingPCs.size > 0) {
          const remainingCanSupply = new Set<number>();
          for (let s = stringIdx + 1; s < stringCount; s++) {
            for (const c of candidates[s]!) {
              if (c.pitchClass !== null) remainingCanSupply.add(c.pitchClass);
            }
          }
          for (const pc of missingPCs) {
            if (!remainingCanSupply.has(pc)) {
              prune = true;
              break;
            }
          }
        }
      }

      if (!prune) {
        // Minimum sounded look-ahead
        const soundedSoFar = current.filter(c => c.fret !== null).length;
        const remaining = stringCount - stringIdx - 1;
        if (soundedSoFar + remaining < cfg.minSounded) prune = true;
      }

      if (!prune) {
        dfs(stringIdx + 1);
      }

      current.pop();
    }
  }

  dfs(0);

  // Sort by score ascending (best first)
  results.sort((a, b) => a.score - b.score);

  // Remove subset voicings (dominated by a superset with same frets on shared strings)
  const pruned = pruneSubsets(results);

  const topResults = pruned.slice(0, cfg.maxResults);

  return topResults.map(r => assignmentsToSequence(r.assignments, tuning));
}

type VoicingResult = { assignments: ({ string: number; fret: number | null; semitones?: number | null; pitchClass?: number | null })[]; score: number };

/**
 * Remove voicings that are strict subsets of another voicing.
 * A voicing A is a subset of B if every sounded string in A has the same fret in B,
 * and B sounds strictly more strings. Since results are already sorted by score,
 * we keep the better-scoring voicing (earlier in the list) and remove later subsets.
 */
function pruneSubsets(sorted: VoicingResult[]): VoicingResult[] {
  const kept: VoicingResult[] = [];

  for (const candidate of sorted) {
    const cFrets = candidate.assignments.map(a => a.fret);
    const cSounded = cFrets.filter(f => f !== null).length;

    let isSubset = false;
    for (const existing of kept) {
      const eFrets = existing.assignments.map(a => a.fret);
      const eSounded = eFrets.filter(f => f !== null).length;

      if (cSounded >= eSounded) continue; // candidate has same or more strings — not a subset

      // Check if candidate is a subset: every sounded string in candidate matches existing
      let subset = true;
      for (let i = 0; i < cFrets.length; i++) {
        if (cFrets[i] !== null && cFrets[i] !== eFrets[i]) {
          subset = false;
          break;
        }
      }
      if (subset) {
        isSubset = true;
        break;
      }
    }

    if (!isSubset) {
      kept.push(candidate);
    }
  }

  return kept;
}

/**
 * Convert internal assignments to a Sequence (for UI compatibility).
 */
export function assignmentsToSequence(
  assignments: ({ string: number; fret: number | null; semitones?: number | null; pitchClass?: number | null })[],
  tuning: string[],
): Sequence {
  const stringNotes: StringNote[] = [];

  for (const a of assignments) {
    if (a.fret === null) continue; // skip muted strings

    const openNote = new Note(tuning[a.string]!);
    const semitones = openNote.semitones + a.fret;
    const note = new Note(semitones);
    stringNotes.push(new StringNote(a.string, note, a.fret));
  }

  return new Sequence(stringNotes);
}
