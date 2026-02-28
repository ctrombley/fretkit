/**
 * Functional tension analysis: rates pitch classes by their role and
 * instability relative to a tonal center.
 *
 * Inspired by astrokit's Dignity.ts, which ranks each planet's strength
 * in each zodiac sign through an 8-level system:
 *   rulership → exaltation → triplicity → term → face → detriment → fall → peregrine
 *
 * Here each pitch class receives a role and a tension score (0–1) based on
 * its function in a major or minor key. The roles map to the dignity levels:
 *   tonic → rulership (highest stability)
 *   leading tone → exaltation (special strength through tension)
 *   dominant/subdominant → triplicity
 *   mediant/submediant → term/face
 *   supertonic → peregrine (neutral)
 *   chromatic borrowings → detriment
 *   avoid notes → fall (maximum friction)
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type FunctionalRole =
  | 'tonic'        // root — complete rest (dignity: rulership)
  | 'dominant'     // perfect 5th — stable pull toward tonic
  | 'subdominant'  // perfect 4th — mild pull toward dominant
  | 'leading'      // major 7th in major, raised 7th in minor — strong upward pull
  | 'mediant'      // 3rd — stable color tone
  | 'submediant'   // 6th — relatively stable
  | 'supertonic'   // 2nd — mild tension
  | 'chromatic'    // borrowed from parallel mode — contextual
  | 'avoid';       // tritone or strong clash — maximum friction (dignity: fall)

export interface TensionResult {
  pitchClass: number;
  role: FunctionalRole;
  /** 0.0 (complete rest) → 1.0 (maximum tension). */
  tension: number;
  /** Pitch class this tone tends to resolve to, if applicable. */
  resolution?: number;
  /** Scale degree 1–7 for diatonic tones, undefined for chromatic. */
  degree?: number;
}

// ── Degree tables ─────────────────────────────────────────────────────────
// Keyed by semitone offset from the tonal root (0–11).

interface DegreeInfo {
  role: FunctionalRole;
  tension: number;
  /** Semitone offset from root that this tone resolves to. */
  resolves?: number;
}

const MAJOR_DIATONIC: Record<number, DegreeInfo> = {
  0:  { role: 'tonic',       tension: 0.00 },
  2:  { role: 'supertonic',  tension: 0.45 },
  4:  { role: 'mediant',     tension: 0.20 },
  5:  { role: 'subdominant', tension: 0.40, resolves: 4 },
  7:  { role: 'dominant',    tension: 0.25 },
  9:  { role: 'submediant',  tension: 0.20 },
  11: { role: 'leading',     tension: 0.85, resolves: 0 },
};

const MAJOR_CHROMATIC: Record<number, DegreeInfo> = {
  1:  { role: 'chromatic', tension: 0.75, resolves: 0  }, // ♭2 (Phrygian) → tonic
  3:  { role: 'chromatic', tension: 0.60, resolves: 4  }, // ♭3 (minor/Dorian) → 3rd
  6:  { role: 'avoid',     tension: 0.95, resolves: 7  }, // ♭5 / tritone → 5th
  8:  { role: 'chromatic', tension: 0.65, resolves: 7  }, // ♭6 (Aeolian) → 5th or 6th
  10: { role: 'chromatic', tension: 0.50, resolves: 11 }, // ♭7 (Mixolydian) → leading tone
};

const MINOR_DIATONIC: Record<number, DegreeInfo> = {
  0:  { role: 'tonic',       tension: 0.00 },
  2:  { role: 'supertonic',  tension: 0.45 },
  3:  { role: 'mediant',     tension: 0.20 },
  5:  { role: 'subdominant', tension: 0.40, resolves: 3 },
  7:  { role: 'dominant',    tension: 0.25 },
  8:  { role: 'submediant',  tension: 0.20 },
  10: { role: 'supertonic',  tension: 0.55, resolves: 0 }, // ♭7 (natural minor)
};

const MINOR_CHROMATIC: Record<number, DegreeInfo> = {
  1:  { role: 'chromatic', tension: 0.75, resolves: 0  }, // ♭2 → tonic
  4:  { role: 'chromatic', tension: 0.50, resolves: 3  }, // major 3rd (modal color)
  6:  { role: 'avoid',     tension: 0.95, resolves: 7  }, // tritone
  9:  { role: 'chromatic', tension: 0.45, resolves: 8  }, // major 6th (Dorian)
  11: { role: 'leading',   tension: 0.85, resolves: 0  }, // raised 7th → tonic
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Rate the functional tension of a pitch class relative to a tonal center.
 *
 * @param pitchClass - the note to evaluate (0–11)
 * @param root       - tonal center pitch class (0–11)
 * @param scaleType  - 'major' or 'minor'
 */
export function noteTension(
  pitchClass: number,
  root: number,
  scaleType: 'major' | 'minor' = 'major',
): TensionResult {
  const pc = ((pitchClass % 12) + 12) % 12;
  const r  = ((root      % 12) + 12) % 12;
  const offset = ((pc - r) % 12 + 12) % 12;

  const diatonic  = scaleType === 'major' ? MAJOR_DIATONIC  : MINOR_DIATONIC;
  const chromatic = scaleType === 'major' ? MAJOR_CHROMATIC : MINOR_CHROMATIC;

  const lookupResolution = (info: DegreeInfo): number | undefined =>
    info.resolves !== undefined ? ((r + info.resolves) % 12 + 12) % 12 : undefined;

  const dInfo = diatonic[offset];
  if (dInfo) {
    const offsets = Object.keys(diatonic).map(Number).sort((a, b) => a - b);
    return {
      pitchClass: pc,
      role: dInfo.role,
      tension: dInfo.tension,
      resolution: lookupResolution(dInfo),
      degree: offsets.indexOf(offset) + 1,
    };
  }

  const cInfo = chromatic[offset];
  if (cInfo) {
    return {
      pitchClass: pc,
      role: cInfo.role,
      tension: cInfo.tension,
      resolution: lookupResolution(cInfo),
    };
  }

  // Remaining semitones not covered (shouldn't occur for standard 12-tone usage).
  return { pitchClass: pc, role: 'chromatic', tension: 0.60 };
}

/**
 * Average tension of a pitch class set relative to a tonal center.
 */
export function setTension(
  pcs: number[],
  root: number,
  scaleType: 'major' | 'minor' = 'major',
): number {
  if (pcs.length === 0) return 0;
  return pcs.reduce((sum, pc) => sum + noteTension(pc, root, scaleType).tension, 0) / pcs.length;
}

/**
 * Classify the primary functional role of a chord within a key.
 * Prioritises the most structurally significant role present.
 */
export function chordFunction(
  pcs: number[],
  root: number,
  scaleType: 'major' | 'minor' = 'major',
): FunctionalRole {
  if (pcs.length === 0) return 'chromatic';
  const roles = pcs.map(pc => noteTension(pc, root, scaleType).role);
  const priority: FunctionalRole[] = [
    'tonic', 'dominant', 'subdominant', 'leading',
    'mediant', 'submediant', 'supertonic', 'chromatic', 'avoid',
  ];
  return priority.find(r => roles.includes(r)) ?? 'chromatic';
}

// ── Display helpers ───────────────────────────────────────────────────────

export const TENSION_LABELS: Record<FunctionalRole, string> = {
  tonic:       'Tonic',
  dominant:    'Dominant',
  subdominant: 'Subdominant',
  leading:     'Leading tone',
  mediant:     'Mediant',
  submediant:  'Submediant',
  supertonic:  'Supertonic',
  chromatic:   'Chromatic',
  avoid:       'Avoid note',
};

/** Semantic colors matching fretkit's existing palette. */
export const TENSION_COLORS: Record<FunctionalRole, string> = {
  tonic:       '#99C432', // lime  — complete rest
  dominant:    '#F59E0B', // amber — strong pull
  subdominant: '#3B82F6', // blue  — subdominant pull
  leading:     '#EC4899', // pink  — strong tension
  mediant:     '#22c55e', // green — stable color
  submediant:  '#14b8a6', // teal  — relatively stable
  supertonic:  '#8B5CF6', // violet — mild tension
  chromatic:   '#9CA3AF', // gray  — outside key
  avoid:       '#ef4444', // red   — clash
};
