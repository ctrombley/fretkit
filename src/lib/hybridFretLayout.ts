/**
 * Hybrid fret layout for the "angine" mode:
 * quartertone (24-EDO) frets up to a threshold, standard 12-EDO above it.
 *
 * In angine mode, each 12-EDO fret in the quartertone zone is visually split
 * in half: the first half holds the added quartertone wire, the second half
 * holds the original native fret wire. Above the threshold, only native wires
 * are rendered.
 */

export interface FretSlot {
  semitones: number;        // fractional semitones from open string (e.g. 0.5, 1, 1.5)
  isNative12: boolean;      // true = original 12-EDO fret wire, false = added quartertone
  nativeFretNumber: number; // nearest native fret (for inlay marker lookup)
  xOffset: number;          // precomputed x from left margin
  width: number;            // visual width of this slot
}

// Mirrors getFretWidth in Fret.tsx — must stay in sync
function nativeFretWidth(fretNumber: number, baseFretWidth: number): number {
  if (fretNumber <= 1) return baseFretWidth;
  return Math.round(nativeFretWidth(fretNumber - 1, baseFretWidth) * 0.944);
}

/**
 * Build the ordered list of FretSlot objects for an angine fretboard window.
 *
 * @param startingFret  - first native 12-EDO fret in the visible window (1-based)
 * @param fretCount     - number of native frets to display
 * @param thresholdCents - quartertone zone upper bound in cents (e.g. 1500 for guitar)
 * @param baseFretWidth - width of fret 1 in pixels (BASE_FRET_WIDTH)
 * @param margin        - left margin in pixels (FRETBOARD_MARGIN)
 */
export function buildAngineSlots(
  startingFret: number,
  fretCount: number,
  thresholdCents: number,
  baseFretWidth: number,
  margin: number,
): FretSlot[] {
  const slots: FretSlot[] = [];
  let xOffset = margin;

  for (let f = startingFret; f < startingFret + fretCount; f++) {
    const centsFromNut = f * 100;
    const fw = nativeFretWidth(f, baseFretWidth);

    if (centsFromNut <= thresholdCents) {
      // Split this fret's space: quartertone then native
      const qtWidth = Math.ceil(fw / 2);
      const nativeWidth = fw - qtWidth;

      slots.push({
        semitones: f - 0.5,
        isNative12: false,
        nativeFretNumber: f,
        xOffset,
        width: qtWidth,
      });
      xOffset += qtWidth;

      slots.push({
        semitones: f,
        isNative12: true,
        nativeFretNumber: f,
        xOffset,
        width: nativeWidth,
      });
      xOffset += nativeWidth;
    } else {
      slots.push({
        semitones: f,
        isNative12: true,
        nativeFretNumber: f,
        xOffset,
        width: fw,
      });
      xOffset += fw;
    }
  }

  return slots;
}

/** Total rendered width of the slot array (rightmost x + width, minus margin) */
export function angineWidth(slots: FretSlot[], margin: number): number {
  if (slots.length === 0) return margin * 2;
  const last = slots[slots.length - 1]!;
  return last.xOffset + last.width + margin;
}
