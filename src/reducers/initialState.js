import tunings from '../lib/tunings';

const defaultFretboard = {
  current: null,
  fretCount: 24,
  litNotes: [],
  markedNotes: [],
  position: 1,
  searchStr: '',
  sequenceEnabled: false,
  sequenceIdx: null,
  sequences: [],
  startingFret: 1,
  tuning: tunings.guitar.standard,
};

export default {
  defaultFretboard,
  fretboards: {
    "0": { id: 0, ...defaultFretboard }
  },
  settings: {
    settingsId: "0",
    sidebarOpen: false,
    soundEnabled: false,
  }
}
