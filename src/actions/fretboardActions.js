import initialState from '../reducers/initialState'

/*
 * action types
 */

export const CREATE_FRETBOARD = 'CREATE_FRETBOARD'
export const UPDATE_FRETBOARD = 'UPDATE_FRETBOARD'
export const DELETE_FRETBOARD = 'DELETE_FRETBOARD'
export const SEARCH = 'SEARCH'

/*
 * action creators
 */

let currentId = 0

export function createFretboard() {
  currentId = currentId + 1;
  const data = { ...initialState.defaultFretboard, id: currentId }
  return { type: CREATE_FRETBOARD, id: currentId, data }
}

export function updateFretboard(id, data) {
  return { type: UPDATE_FRETBOARD, id, data}
}

export function deleteFretboard(id) {
  return { type: DELETE_FRETBOARD, id };
}

export function search(id, strings, searchTerm) {
  return { type: SEARCH, id, strings, searchTerm }
}
