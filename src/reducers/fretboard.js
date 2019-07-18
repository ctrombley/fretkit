import * as fretboardActions from '../actions/fretboardActions'

import initialState from './initialState'
import generate from '../lib/sequenceGenerator'
import search from '../lib/termSearch'

function fretboardReducer(state = initialState.fretboards, action) {
  switch (action.type) {
    case fretboardActions.CREATE_FRETBOARD:
      return {
        ...state,
        [action.id]:  {
          ...action.data,
        }
      };

    case fretboardActions.UPDATE_FRETBOARD:
      const updated = {
        ...state[action.id],
        ...action.data,
      };

      return {
        ...state,
        [action.id]: updated
      };

    case fretboardActions.DELETE_FRETBOARD:
      const {
        [action.id]: removed,
        ...stateWithoutFretboard
      } = state;

      return stateWithoutFretboard;

    case fretboardActions.SEARCH:
      let sequences = null;

      const {current, notes} = search(action.searchTerm);
      sequences = current ? generate(notes, action.strings, state[action.id].position) : [];

      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          litNotes: notes,
          current: current,
          searchStr: action.searchTerm,
          sequences: sequences,
          sequenceIdx: sequences.length > 0 ? 0 : null,
        }
      };

    default:
      return state;
  }
}

export default fretboardReducer;
