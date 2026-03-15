# Fretkit Project Tracking

**Status:** Active
**Last Updated:** 2026-03-06
**Next Up:** Sandbox Drone Mode Phase 1
**Stack:** React 19 + TypeScript 5.7 + Zustand 5 + Tailwind CSS 3.4 + Vite 6
**Deploy:** Kamal 2 + Docker + DigitalOcean + GitHub Actions

---

## Project Summary

Interactive fretboard visualizer for drilling scales, chords, and modes on guitar, banjo, and mandolin. Core music theory engine (`Note`, `Interval`, `Scale`, `Mode`) is stable. Web Audio synthesizer, arpeggiator, and metronome engines are in development.

---

## Architecture

### `src/lib/` — Music Theory Engine
Pure computation layer:
- **Note.ts** — Pitch representation & transposition
- **Interval.ts** — Interval arithmetic
- **Scale.ts** — Scale definitions & generation
- **Mode.ts** — Modal derivation
- **Chord.ts** — Chord voicings
- **tunings.ts** — Guitar/banjo/mandolin string tunings
- **synth.ts** — Web Audio synthesizer (in development)
- **arpeggiator.ts** — Arpeggiator engine (in development)
- **metronome.ts** — Metronome engine (in development)
- **pitchClassSet.ts** — M_n harmonic projection operations
- **harmonicSpectrum.ts** — Spectral analysis utilities
- **__tests__/** — Comprehensive unit tests (vitest)

### `src/store/` — Zustand State Management
Slices (per fretkit/cyclekit pattern):
- Fretboard state (selected tuning, visible frets)
- Drill mode state (scale, mode, tempo)
- Settings (instrument, theme, audio feedback)

### `src/components/` — React UI
- **Fretboard** — Interactive fretboard renderer
- **FretMarker** — Individual fret highlight + note display
- **Sidebar** — Scale/mode/tuning selection
- **Label** — Note labels & intervals
- Responsive layout, keyboard navigation

---

## Key Features

- **Multi-instrument support:** Guitar (6-string), banjo (5-string), mandolin (8-string)
- **Comprehensive scale/mode library:** Major, minor, modes, exotic scales
- **Interactive drilling:** Visual feedback, MIDI note playback
- **Music theory engine:** Harmonic projections (M_n operations), pitch class set utilities
- **Dark/light theme** via Tailwind
- **Fully typed:** TypeScript 5.7, strict mode

---

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Run tests
npm run test:watch   # Watch mode
npm run build        # Type-check + build
npm run lint         # Lint
```

---

## Deployment

**Platform:** DigitalOcean droplet (Ubuntu 24.04) + Kamal 2 + Docker + nginx + Let's Encrypt SSL

**Setup (first time):**
```bash
gem install kamal
envchain --set local KAMAL_REGISTRY_USERNAME <DO_API_TOKEN>
envchain --set local KAMAL_REGISTRY_PASSWORD <DO_API_TOKEN>
# Update config/deploy.yml with Droplet IP
envchain local kamal setup
envchain local kamal deploy
```

**Subsequent pushes:** Automatic via GitHub Actions (secrets: `KAMAL_REGISTRY_USERNAME`, `KAMAL_REGISTRY_PASSWORD`, `DEPLOY_SSH_KEY`)

**Local Docker:** `docker compose up -d` → http://localhost:8080

---

## Tasks

### Done
- [x] Core music theory engine (Note, Interval, Scale, Mode)
- [x] Fretboard rendering + interaction
- [x] Scale/mode drill UI
- [x] Multi-instrument support
- [x] Deployment pipeline (Kamal + Docker)
- [x] Theme toggle + Tailwind styling

### In Progress
- [ ] **Sandbox Drone Mode Phase 1** (next up)
  - Resonate all open strings across active fretboards simultaneously
  - Plomp & Levelt consonance scoring (0–1 live meter)
  - Toggleable detune per string (0–5% for chorus effect)
  - Basic interval matrix showing pairwise consonance
  - Saveable drone configurations to localStorage
  - Optional manual string selection (Phase 2)

### Completed
- [x] Web Audio synth + MIDI note playback
- [x] Arpeggiator engine (standard patterns: up/down/random/asPlayed/converge/diverge)
- [x] Metronome engine + transport (BPM, time signature, beat sync)
- [x] **Arp strum mode** — rapid low→high sweep, auto-release after ADSR attack+decay
- [x] **Arp finger picking mode** — 10-pattern library (Travis, PIMA, Waltz, Celtic, Banjo, etc.)
- [x] **Pinch/simultaneous note steps** — PatternStep = number | number[], patterns updated (Travis pinch, Waltz chord, Claw Hammer brush)
- [x] **Finger letter markers (p/i/m/a)** — per-note SVG overlay on playing dots in finger picking mode; arpStrikeFingers store field; onStepPlayed callback
- [x] **Open string arp targets** — fretboard tuning parsed into arp notes; tracked separately to avoid collision with user-held notes
- [x] **Interactive open string fret markers** — clickable nut circles; hint ring when unplayed; bloom/playing animations at nut position
- [x] **Help popover system** — HelpPopover component (click-toggle + hover-hold 400ms); all inline help text blocks replaced with ? buttons
- [x] Multi-fretboard sandbox with + button above DronePanel

### Backlog
- [ ] Drone Mode Phase 2: multi-selection UI, randomization, constraint solver
- [ ] Chord voicing explorer
- [ ] Interval training mode
- [ ] Progress tracking / drill history
- [ ] Practice preset library (scales/modes + arpeggiator patterns)

---

## Session Log

| Date | Agent | Notes |
|------|-------|-------|
| 2026-03-06 | claude | Added fretkit to AKB; designed Sandbox Drone Mode Phase 1 (quick win: multi-guitar resonance + consonance scoring, 1 week) |
| 2026-03-06 | claude | Arp strum + finger picking modes; 10-pattern library; open string arp targets; interactive open string fret markers; help popover system; UI cleanup (+ button above DronePanel) |
| 2026-03-06 | claude | Pinch/simultaneous note steps (PatternStep = number | number[]); Travis/Waltz/Claw Hammer patterns updated; p/i/m/a finger letter markers on playing dots; onStepPlayed callback with per-note finger info |
