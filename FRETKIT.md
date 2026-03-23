# Fretkit

**Status:** Active
**Last Updated:** 2026-03-23
**Next Up:** Implement hammer-on/pull-off drag mechanics with fret-to-fret note slides

## Description
Web-based interactive fretboard visualizer for drilling scales/chords on string instruments. Guitar, banjo, mandolin support with multiple tunings. SVG-based fretboard rendering with intelligent sequence generation algorithm.

**Tech Stack:** React 19 + Zustand 5 + Vite 6 + TypeScript 5.7, Tailwind CSS 3.4, Vitest (455 tests across 27 files)

## Tasks

### Next Up
- [ ] [HIGH] [~4h] Implement hammer-on/pull-off drag mechanics (click+drag on string, slide through frets, trigger portamento)
- [ ] [MED] [~1h] Add visual feedback for drag path (fret highlighting, note trail)
- [ ] [MED] [~30m] Test hammer-on/pull-off across different tunings

### Backlog
- [ ] [MED] [~2h] Document angine fretboard engine capabilities
- [ ] [LOW] [~1h] Add performance profiling for large fretboard renders

### Completed
- [x] Commit feature/angine-fretboard changes and merge to master
- [x] Implement per-fretboard synth engines (FretboardEngineRegistry)
- [x] Add TuningEditor component with validation
- [x] Migrate from Redux to Zustand 5
- [x] Update React to v19, Vite to v6, TypeScript to 5.7
- [x] Build comprehensive music theory library (pitchClassSet, harmonicSpectrum, tension, patterns, modalRelations, consonance, monochord, voiceLeading)
- [x] Implement SamplerEngine with factory presets (8 presets across 16 slots)
- [x] Add MIDI router and audio bus architecture (AudioBus, MasterBusEngine)
- [x] Implement monochord with Lissajous visualization
- [x] Build SamplerUI with parameter editor
- [x] Achieve 455 passing tests

## Session Log

### 2026-03-23
- Added p:fretkit to AKB project index
- Assessed feature/angine-fretboard: tests pass, changes uncommitted, ready for merge workflow
- Committed feature/angine-fretboard (20 files, 695 insertions): per-fretboard synth engines + TuningEditor
- Merged feature/angine-fretboard to master (5 commits, all tests passing)
- Starting new feature: hammer-on/pull-off drag mechanics with fret-to-fret note slides
