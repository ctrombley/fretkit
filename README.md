# Fretkit

Interactive fretboard visualizer for drilling scales, chords, and modes on guitar, banjo, and mandolin.

---

## Features

-- ???

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
