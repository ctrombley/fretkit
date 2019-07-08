import tunings from '../lib/tunings'

export default {
  current: null,
  filterEnd: 24,
  filterStart: 1,
  fretCount: 24,
  litNotes: [],
  markedNotes: [],
  position: 1,
  searchStr: '',
  sequenceEnabled: false,
  sequenceIdx: null,
  sequences: [],
  sidebarOpen: false,
  soundEnabled: false,
  startingFret: 1,
  tuning: tunings.guitar.standard,
}
