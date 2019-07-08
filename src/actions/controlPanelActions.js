/*
 * action types
 */

export const SEARCH = 'SEARCH'
export const SET_FILTER_END = 'SET_FILTER_END'
export const SET_FILTER_START = 'SET_FILTER_START'
export const SET_FRET_COUNT = 'SET_FRET_COUNT'
export const SET_POSITION = 'SET_POSITION'
export const SET_SEQUENCE_ENABLED = 'SET_SEQUENCE_ENABLED'
export const SET_STARTING_FRET = 'SET_STARTING_FRET'
export const SET_TUNING = 'SET_TUNING'

/*
 * action creators
 */

export function search(searchTerm) {
  return { type: SEARCH, searchTerm }
}

export function setFilterEnd(filterEnd) {
  return { type: SET_FILTER_END, filterEnd };
}

export function setFilterStart(filterStart) {
  return { type: SET_FILTER_START, filterStart };
}

export function setFretCount(fretCount) {
  return { type: SET_FRET_COUNT, fretCount };
}
export function setPosition(position) {
  return { type: SET_POSITION, position };
}

export function setSequenceEnabled(value) {
  return { type: SET_SEQUENCE_ENABLED, value };
}

export function setStartingFret(startingFret) {
  return { type: SET_STARTING_FRET, startingFret };
}

export function setTuning(tuning) {
  return { type: SET_TUNING, tuning };
}
