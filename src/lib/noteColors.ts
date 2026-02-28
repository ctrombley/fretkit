// 12 chromatic pitch class colors (C=0 through B=11)
export const PITCH_CLASS_COLORS: string[] = [
  '#E84057', // C  - red/magenta
  '#E86040', // C# - red-orange
  '#E88040', // D  - orange
  '#E8A040', // D# - amber
  '#C8C040', // E  - yellow-green (matching root green)
  '#99C432', // F  - green (matches existing root color)
  '#40C8A0', // F# - teal
  '#40A0E8', // G  - blue
  '#4060E8', // G# - indigo
  '#8040E8', // A  - purple
  '#C040E8', // A# - violet
  '#E840C0', // B  - pink
];

// Map absolute semitones to a radius: lower = bigger, higher = smaller
export function pitchToRadius(semitones: number): number {
  // Clamp to reasonable MIDI range (~C2=36 to C6=84)
  const lo = 36;
  const hi = 84;
  const clamped = Math.max(lo, Math.min(hi, semitones));
  const t = (clamped - lo) / (hi - lo); // 0..1, low to high
  return 10 - t * 6; // 10px low notes, 4px high notes
}

export function getPitchClassColor(baseSemitones: number): string {
  return PITCH_CLASS_COLORS[((baseSemitones % 12) + 12) % 12]!;
}
