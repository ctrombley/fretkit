import type { SamplerParams } from './sampler';
import { DEFAULT_SAMPLER_PARAMS } from './sampler';

export const SLOT_COLORS = [
  '#F73667', '#00C4CC', '#99C432', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#06B6D4', '#84CC16', '#A855F7', '#EF4444',
  '#3B82F6', '#22D3EE', '#FBBF24', '#10B981',
] as const;

export interface SamplerSlotDef {
  name: string;
  url: string;       // empty string = no sample loaded yet
  color: string;
  rootNote: number | null;
  params: SamplerParams;
}

export interface SamplerPreset {
  name: string;
  isFactory: boolean;
  slots: (SamplerSlotDef | null)[];   // length 16
  keyMap: (number | null)[];          // 128 entries: MIDI note → slot index
}

function p(overrides?: Partial<SamplerParams>): SamplerParams {
  return { ...DEFAULT_SAMPLER_PARAMS, ...overrides };
}

function makeEmptyKeyMap(): (number | null)[] {
  return new Array<number | null>(128).fill(null);
}

function mapRange(keyMap: (number | null)[], slotIdx: number, from: number, to: number) {
  for (let n = from; n <= to; n++) keyMap[n] = slotIdx;
}

// ---------------------------------------------------------------------------
// Slot helpers — all URLs empty; user drops their own samples in
// Each preset ships with the pad names, colors, key-map ranges & root notes
// so loading your own samples is a one-drag-per-pad operation.
// ---------------------------------------------------------------------------
function slot(name: string, color: string, root: number | null, params?: Partial<SamplerParams>): SamplerSlotDef {
  return { name, url: '', color, rootNote: root, params: p(params) };
}

// ---------------------------------------------------------------------------
// 1. Cuffer Garrote  (anagram of "Forge & Fracture")
//    Punchy electronic drum kit — standard GM mapping
// ---------------------------------------------------------------------------
function makeCufferGarrote(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 36, 36);   // C2  kick
  mapRange(keyMap, 1, 38, 38);   // D2  snare
  mapRange(keyMap, 2, 42, 42);   // F#2 closed HH
  mapRange(keyMap, 3, 46, 46);   // A#2 open HH
  mapRange(keyMap, 4, 49, 49);   // C#3 crash
  mapRange(keyMap, 5, 51, 51);   // D#3 ride
  mapRange(keyMap, 6, 41, 41);   // F2  low tom
  mapRange(keyMap, 7, 43, 43);   // G2  mid tom
  return {
    name: 'Cuffer Garrote',
    isFactory: true, keyMap,
    slots: [
      slot('Kick',       SLOT_COLORS[0]!, 36),
      slot('Snare',      SLOT_COLORS[1]!, 38),
      slot('Closed HH',  SLOT_COLORS[2]!, 42),
      slot('Open HH',    SLOT_COLORS[3]!, 46),
      slot('Crash',      SLOT_COLORS[4]!, 49),
      slot('Ride',       SLOT_COLORS[5]!, 51),
      slot('Low Tom',    SLOT_COLORS[6]!, 41),
      slot('Mid Tom',    SLOT_COLORS[7]!, 43),
      null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 2. Glumose Keno  (anagram of "Smoke Lounge")
//    Brushed jazz acoustic kit
// ---------------------------------------------------------------------------
function makeGlumoseKeno(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 36, 36);
  mapRange(keyMap, 1, 38, 38);
  mapRange(keyMap, 2, 42, 42);
  mapRange(keyMap, 3, 46, 46);
  mapRange(keyMap, 4, 49, 49);
  mapRange(keyMap, 5, 51, 53);
  return {
    name: 'Glumose Keno',
    isFactory: true, keyMap,
    slots: [
      slot('Jazz Kick',     SLOT_COLORS[8]!,  36),
      slot('Brush Snare',   SLOT_COLORS[9]!,  38),
      slot('Brush HH',      SLOT_COLORS[10]!, 42),
      slot('Open Brush',    SLOT_COLORS[11]!, 46),
      slot('Jazz Crash',    SLOT_COLORS[12]!, 49),
      slot('Ride Bell',     SLOT_COLORS[13]!, 51),
      null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 3. Cupric Viator  (anagram of "Vapor Circuit")
//    Lo-fi hip-hop / vinyl kit
// ---------------------------------------------------------------------------
function makeCupricViator(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 36, 36);
  mapRange(keyMap, 1, 38, 38);
  mapRange(keyMap, 2, 42, 42);
  mapRange(keyMap, 3, 46, 46);
  mapRange(keyMap, 4, 37, 37);
  mapRange(keyMap, 5, 39, 39);
  return {
    name: 'Cupric Viator',
    isFactory: true, keyMap,
    slots: [
      slot('Lo Kick',  SLOT_COLORS[0]!, 36, { amplitude: 0.9 }),
      slot('Lo Snare', SLOT_COLORS[1]!, 38, { amplitude: 0.8 }),
      slot('Lo HH',    SLOT_COLORS[2]!, 42, { amplitude: 0.7 }),
      slot('Open HH',  SLOT_COLORS[3]!, 46, { amplitude: 0.7 }),
      slot('Rim',      SLOT_COLORS[4]!, 37),
      slot('Clap',     SLOT_COLORS[5]!, 39),
      null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 4. Genet Sepiment  (anagram of "Tempest Engine")
//    Hard industrial / metal kit
// ---------------------------------------------------------------------------
function makeGenetSepiment(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 36, 36);
  mapRange(keyMap, 1, 38, 38);
  mapRange(keyMap, 2, 42, 42);
  mapRange(keyMap, 3, 46, 46);
  mapRange(keyMap, 4, 49, 49);
  mapRange(keyMap, 5, 51, 51);
  mapRange(keyMap, 6, 41, 41);
  mapRange(keyMap, 7, 43, 43);
  return {
    name: 'Genet Sepiment',
    isFactory: true, keyMap,
    slots: [
      slot('Metal Kick',  SLOT_COLORS[0]!, 36, { amplitude: 1.2 }),
      slot('Metal Snare', SLOT_COLORS[1]!, 38, { amplitude: 1.2 }),
      slot('Metal HH',    SLOT_COLORS[2]!, 42),
      slot('Blast Open',  SLOT_COLORS[3]!, 46),
      slot('China',       SLOT_COLORS[4]!, 49),
      slot('Ride',        SLOT_COLORS[5]!, 51),
      slot('Floor Tom',   SLOT_COLORS[6]!, 41),
      slot('Rack Tom',    SLOT_COLORS[7]!, 43),
      null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 5. Dossel Fictile  (anagram of "Solstice Field")
//    Nature pack: birds, rain, wind, water
// ---------------------------------------------------------------------------
function makeDosselFictile(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 48, 59);   // C3–B3 → bird call
  mapRange(keyMap, 1, 60, 71);   // C4–B4 → rain
  mapRange(keyMap, 2, 72, 83);   // C5–B5 → wind
  mapRange(keyMap, 3, 36, 47);   // C2–B2 → water stream
  return {
    name: 'Dossel Fictile',
    isFactory: true, keyMap,
    slots: [
      slot('Bird Call', SLOT_COLORS[2]!,  60),
      slot('Rain',      SLOT_COLORS[5]!,  60, { loop: true, loopStartFraction: 0.1, loopEndFraction: 0.9 }),
      slot('Wind',      SLOT_COLORS[8]!,  60, { loop: true, loopStartFraction: 0.2, loopEndFraction: 0.95 }),
      slot('Stream',    SLOT_COLORS[13]!, 60, { loop: true, loopStartFraction: 0.05, loopEndFraction: 0.9 }),
      null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 6. Abyss Shoaler  (anagram of "Abyssal Shore")
//    Nature pack: ocean, cave drip, thunder
// ---------------------------------------------------------------------------
function makeAbyssShoaler(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 48, 71);   // C3–B4 → ocean
  mapRange(keyMap, 1, 36, 47);   // C2–B2 → cave drip
  mapRange(keyMap, 2, 72, 83);   // C5–B5 → thunder
  return {
    name: 'Abyss Shoaler',
    isFactory: true, keyMap,
    slots: [
      slot('Ocean',     SLOT_COLORS[12]!, 60, { loop: true, loopStartFraction: 0.1, loopEndFraction: 0.9 }),
      slot('Cave Drip', SLOT_COLORS[5]!,  60),
      slot('Thunder',   SLOT_COLORS[0]!,  60),
      null, null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 7. Assign Toll  (anagram of "Signal Lost")
//    Mysterious: metallic drone, reversed chime, static hiss
// ---------------------------------------------------------------------------
function makeAssignToll(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 36, 59);   // C2–B3 → metallic drone
  mapRange(keyMap, 1, 60, 83);   // C4–B5 → reversed chime
  mapRange(keyMap, 2, 84, 107);  // C6–B7 → static hiss
  return {
    name: 'Assign Toll',
    isFactory: true, keyMap,
    slots: [
      slot('Metal Drone', SLOT_COLORS[4]!, 60, { loop: true, loopStartFraction: 0.3, loopEndFraction: 0.9 }),
      slot('Rev Chime',   SLOT_COLORS[1]!, 60, { reverse: true }),
      slot('Static Hiss', SLOT_COLORS[7]!, 60, { loop: true, amplitude: 0.3 }),
      null, null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

// ---------------------------------------------------------------------------
// 8. Ashore Turf  (anagram of "After Hours")
//    Chromatic instruments: sax, glass clink, piano, whisper
// ---------------------------------------------------------------------------
function makeAshoreTurf(): SamplerPreset {
  const keyMap = makeEmptyKeyMap();
  mapRange(keyMap, 0, 48, 72);   // chromatic → sax
  mapRange(keyMap, 1, 36, 47);   // lower → glass clink
  mapRange(keyMap, 2, 73, 96);   // upper → piano
  mapRange(keyMap, 3, 24, 35);   // bass → whisper pad
  return {
    name: 'Ashore Turf',
    isFactory: true, keyMap,
    slots: [
      slot('Sax Hit',     SLOT_COLORS[0]!, 60),
      slot('Glass Clink', SLOT_COLORS[1]!, 60),
      slot('Piano Decay', SLOT_COLORS[9]!, 60),
      slot('Whisper Pad', SLOT_COLORS[4]!, 60, { loop: true, amplitude: 0.5 }),
      null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  };
}

export const FACTORY_SAMPLER_PRESETS: SamplerPreset[] = [
  makeCufferGarrote(),
  makeGlumoseKeno(),
  makeCupricViator(),
  makeGenetSepiment(),
  makeDosselFictile(),
  makeAbyssShoaler(),
  makeAssignToll(),
  makeAshoreTurf(),
];
