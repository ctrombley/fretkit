/** Ergonomic scoring engine for chord voicings. */

export interface StringAssignment {
  string: number;       // 0 = lowest string
  fret: number | null;  // null = muted, 0 = open
}

export interface Barre {
  fret: number;
  fromString: number;   // lowest string index
  toString: number;     // highest string index
}

export interface ErgonomicWeights {
  fretSpan: number;
  fingerCount: number;
  stretchEvenness: number;
  stringContiguity: number;
  openStringBonus: number;
  bassCorrectness: number;
  positionWeight: number;
}

export interface ErgonomicBreakdown {
  fretSpan: number;
  fingerCount: number;
  stretchEvenness: number;
  stringContiguity: number;
  openStringBonus: number;
  bassCorrectness: number;
  positionWeight: number;
  totalCost: number;
}

const MAX_SPAN = 5;

const DEFAULT_WEIGHTS: ErgonomicWeights = {
  fretSpan: 1.0,
  fingerCount: 1.5,
  stretchEvenness: 0.5,
  stringContiguity: 1.2,
  openStringBonus: 0.4,
  bassCorrectness: 1.0,
  positionWeight: 0.2,
};

/**
 * Detect barre chords: same fret on 2+ consecutive strings,
 * spanning from the lowest to highest string at that fret.
 */
export function detectBarres(assignments: StringAssignment[]): Barre[] {
  const fretted = assignments.filter(a => a.fret !== null && a.fret > 0);
  if (fretted.length < 2) return [];

  // Group by fret
  const byFret = new Map<number, number[]>();
  for (const a of fretted) {
    const strings = byFret.get(a.fret!) ?? [];
    strings.push(a.string);
    byFret.set(a.fret!, strings);
  }

  const barres: Barre[] = [];
  for (const [fret, strings] of byFret) {
    if (strings.length < 2) continue;
    const minStr = Math.min(...strings);
    const maxStr = Math.max(...strings);

    // A barre covers all strings from min to max at this fret.
    // Check that every string in between is either at this fret, muted, or open.
    let validBarre = true;
    for (let s = minStr; s <= maxStr; s++) {
      const a = assignments.find(x => x.string === s);
      if (a && a.fret !== null && a.fret > 0 && a.fret < fret) {
        validBarre = false;
        break;
      }
    }

    if (validBarre) {
      barres.push({ fret, fromString: minStr, toString: maxStr });
    }
  }

  // Keep only the lowest-fret barre (index finger)
  barres.sort((a, b) => a.fret - b.fret);
  return barres.slice(0, 1);
}

/**
 * Count fingers needed after accounting for barres.
 * A barre uses 1 finger; each remaining fretted position needs its own finger.
 */
export function countFingersAfterBarre(
  assignments: StringAssignment[],
  barres: Barre[],
): number {
  const fretted = assignments.filter(a => a.fret !== null && a.fret > 0);
  if (fretted.length === 0) return 0;

  if (barres.length === 0) return fretted.length;

  const barre = barres[0]!;
  let fingers = 1; // barre finger

  for (const a of fretted) {
    if (a.fret === barre.fret && a.string >= barre.fromString && a.string <= barre.toString) {
      continue; // covered by barre
    }
    fingers++;
  }

  return fingers;
}

/**
 * Compute a detailed ergonomic score for a voicing.
 * Lower score = more playable.
 */
export function computeErgonomicScore(
  assignments: StringAssignment[],
  rootPitchClass: number,
  weights: ErgonomicWeights = DEFAULT_WEIGHTS,
): ErgonomicBreakdown {
  const sounded = assignments.filter(a => a.fret !== null);
  const fretted = sounded.filter(a => a.fret! > 0);
  const open = sounded.filter(a => a.fret === 0);
  const soundedCount = sounded.length;

  // Fret span (among fretted notes only, open excluded)
  let fretSpanScore = 0;
  if (fretted.length >= 2) {
    const frets = fretted.map(a => a.fret!);
    const span = Math.max(...frets) - Math.min(...frets);
    fretSpanScore = span / MAX_SPAN;
  }

  // Finger count
  const barres = detectBarres(assignments);
  const fingers = countFingersAfterBarre(assignments, barres);
  const fingerCountScore = fingers > 4 ? 2.0 : fingers / 4;

  // Stretch evenness (variance of inter-string fret gaps among fretted notes)
  let stretchEvennessScore = 0;
  if (fretted.length >= 2) {
    const sorted = [...fretted].sort((a, b) => a.string - b.string);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(Math.abs(sorted[i]!.fret! - sorted[i - 1]!.fret!));
    }
    if (gaps.length > 0) {
      const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
      stretchEvennessScore = Math.min(variance / 4, 1.0);
    }
  }

  // String contiguity (inner muted strings penalty)
  let stringContiguityScore = 0;
  if (soundedCount >= 2) {
    const soundedStrings = sounded.map(a => a.string).sort((a, b) => a - b);
    const minS = soundedStrings[0]!;
    const maxS = soundedStrings[soundedStrings.length - 1]!;
    const span = maxS - minS + 1;
    if (span > 2) {
      const innerMuted = span - soundedCount;
      stringContiguityScore = innerMuted / (span - 2);
    }
  }

  // Open string bonus (negative cost)
  const openStringBonusScore = soundedCount > 0
    ? -(open.length / soundedCount)
    : 0;

  // Bass correctness
  let bassCorrectnessScore = 0;
  if (soundedCount > 0) {
    const lowestSounded = sounded.reduce((low, a) =>
      a.string < low.string ? a : low
    );
    // We need to determine the pitch class of the lowest sounded note.
    // For open string: pitchClass comes from tuning, but we only have fret info here.
    // We'll use a convention: the caller provides rootPitchClass, and we check
    // if the lowest string's assignment matches it. We need actual pitch info.
    // Since we don't have tuning here, we rely on a separate bassNote parameter
    // passed via the assignments. We'll add a pitchClass field.
    // For now, use a simpler approach: trust the caller marks bass via rootPitchClass.
    // We'll extend StringAssignment with pitchClass in the voicing generator.
    if ('pitchClass' in lowestSounded) {
      const pc = (lowestSounded as StringAssignment & { pitchClass: number }).pitchClass;
      bassCorrectnessScore = (pc % 12) === (rootPitchClass % 12) ? 0 : 1.0;
    }
  }

  // Position weight (slight preference for lower frets)
  let positionWeightScore = 0;
  if (fretted.length > 0) {
    const minFret = Math.min(...fretted.map(a => a.fret!));
    positionWeightScore = minFret / 12;
  }

  const totalCost =
    weights.fretSpan * fretSpanScore +
    weights.fingerCount * fingerCountScore +
    weights.stretchEvenness * stretchEvennessScore +
    weights.stringContiguity * stringContiguityScore +
    weights.openStringBonus * openStringBonusScore +
    weights.bassCorrectness * bassCorrectnessScore +
    weights.positionWeight * positionWeightScore;

  return {
    fretSpan: fretSpanScore,
    fingerCount: fingerCountScore,
    stretchEvenness: stretchEvennessScore,
    stringContiguity: stringContiguityScore,
    openStringBonus: openStringBonusScore,
    bassCorrectness: bassCorrectnessScore,
    positionWeight: positionWeightScore,
    totalCost,
  };
}

/**
 * Convenience wrapper: returns just the total cost.
 */
export function scoreVoicing(
  assignments: StringAssignment[],
  rootPitchClass: number,
  weights?: ErgonomicWeights,
): number {
  return computeErgonomicScore(assignments, rootPitchClass, weights).totalCost;
}
