# Fretkit

Interactive fretboard visualizer for drilling scales, chords, and modes on guitar, banjo, and mandolin.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |

## Deploy

Fretkit deploys via [Kamal 2](https://kamal-deploy.org) to a Digital Ocean Droplet with automatic SSL via Let's Encrypt.

### Prerequisites

- Ruby ≥ 3.1: `gem install kamal`
- A DO Droplet (Ubuntu 24.04) with your SSH key
- A DO Container Registry named `fretkit`
- A DO API token with read/write scope

Set credentials in your environment (the project uses `envchain`):

```bash
envchain --set local KAMAL_REGISTRY_USERNAME  # your DO API token
envchain --set local KAMAL_REGISTRY_PASSWORD  # same token
```

Update `config/deploy.yml` with your Droplet's IP, then:

```bash
# First time — installs Docker and kamal-proxy on the server
envchain local kamal setup

# Deploy
envchain local kamal deploy
```

Subsequent pushes to `master` deploy automatically via GitHub Actions. Add `KAMAL_REGISTRY_USERNAME`, `KAMAL_REGISTRY_PASSWORD`, and `DEPLOY_SSH_KEY` as repository secrets.

### Useful Kamal commands

```bash
envchain local kamal logs        # tail production logs
envchain local kamal rollback    # revert to previous image
envchain local kamal app exec "sh"  # shell into the running container
```

### Local Docker

```bash
docker compose up -d    # build and run on http://localhost:8080
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, Tailwind CSS 3.4 |
| State | Zustand 5 |
| Build | Vite 6, TypeScript 5.7 |
| Test | Vitest |
| Icons | Lucide React |
| Deploy | Kamal 2, Docker, nginx |
| CI/CD | GitHub Actions |

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
    __tests__/      Unit tests
  store/            Zustand store slices
  components/       React components
  hooks/            Custom React hooks
```

## License

MIT

---

<details>
<summary>The whole-tone scale vanishes under M6</summary>

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

The same symmetry shows up in every other maximally symmetric set:

| Set | Collapse multiplier | Why |
|---|---|---|
| Augmented triad `{0, 4, 8}` | M3 | 4k × 3 = 12k |
| Diminished 7th `{0, 3, 6, 9}` | M4 | 3k × 4 = 12k |
| Whole-tone scale `{0, 2, 4, 6, 8, 10}` | M6 | 2k × 6 = 12k |
| Chromatic scale `{0…11}` | M12 | trivially 0 |

These **M_n operations** are implemented in `src/lib/pitchClassSet.ts` as `multiplySet(pcs, n)`
and `harmonicProjection(pcs, n)`.

</details>
