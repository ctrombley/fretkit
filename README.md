# Fretkit

Interactive fretboard visualizer for drilling scales, chords, and modes on guitar, banjo, and mandolin.

---

## Features

-- ???

## The Whole-Tone Scale Vanishes Under M6

While building the harmonic spectrum analyser (`src/lib/harmonicSpectrum.ts`), a neat
algebraic fact surfaced: multiply every note of the whole-tone scale by 6 in mod-12
arithmetic and all six notes collapse to a single point — zero.

```
Whole-tone scale:  C  D  E  F#  G#  A#
Pitch classes:     0  2  4  6   8   10
× 6 (mod 12):      0  0  0  0   0   0
```

This isn't a coincidence. Every note in the whole-tone scale is an *even* pitch class,
and any even number times 6 is a multiple of 12:

> **2k × 6 = 12k ≡ 0 (mod 12)**

The same symmetry shows up in every other maximally symmetric set, each collapsing
completely under its own characteristic multiplier:

| Set | Interval | Collapse multiplier | Why |
|---|---|---|---|
| Augmented triad `{0, 4, 8}` | Major third (×3) | M3 | 4k × 3 = 12k |
| Diminished 7th `{0, 3, 6, 9}` | Minor third (×4) | M4 | 3k × 4 = 12k |
| Whole-tone scale `{0, 2, 4, 6, 8, 10}` | Whole step (×6) | M6 | 2k × 6 = 12k |
| Chromatic scale `{0…11}` | Semitone (×12) | M12 | trivially 0 |

The M6 collapse is the most dramatic because six notes become one. It also explains
why the whole-tone scale sounds "untethered" — the operation that should reveal its
inner structure instead flattens it entirely, leaving no tonal hierarchy to stand on.

These **M_n operations** (pitch class multiplication) are implemented in
`src/lib/pitchClassSet.ts` as `multiplySet(pcs, n)` and `harmonicProjection(pcs, n)`,
and the full harmonic spectrum — which multiplier makes each set cluster or collapse —
is computed by `harmonicSpectrum(pcs)` in `src/lib/harmonicSpectrum.ts`.

M7 and M5 are also useful: multiplying any diatonic scale by 7 reorders its notes
into the circle-of-fifths sequence, and M5 gives the circle-of-fourths sequence — the
same 7 pitch classes, just visited in a different order.

---

## Quick Start

```bash
# Development
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Docker

```bash
# Build and run
docker compose up -d

# Or build manually
docker build -t fretkit .
docker run -p 8080:80 fretkit
```

Open [http://localhost:8080](http://localhost:8080)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, Tailwind CSS 3.4 |
| State | Zustand 5 (sliced store with localStorage persistence) |
| Build | Vite 6, TypeScript 5.7 |
| Test | Vitest |
| Icons | Lucide React |
| Deploy | Docker (node:22-alpine + nginx) |
| CI | GitHub Actions |

## Project Structure

```
src/
  lib/              Core music theory engine
    Note.ts         Pitch representation & transposition
    Interval.ts     Interval arithmetic
    Scale.ts        Scale definitions & generation
    Mode.ts         Modal derivation
    Chord.ts        Chord voicings
    synth.ts        Web Audio synthesizer
    arpeggiator.ts  Arpeggiator engine
    metronome.ts    Metronome engine
    synthUtils.ts   Shared synth helpers
    __tests__/      193 unit tests
  store/            Zustand store slices
  components/       React components
  hooks/            Custom React hooks
```

## License

MIT
