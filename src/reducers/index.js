import * as controlPanelActions from '../actions/controlPanelActions'
import * as settingsActions from '../actions/settingsActions'

import initialState from './initialState'
import { getStrings } from '../selectors/index'
import generate from '../lib/sequenceGenerator'
import search from '../lib/termSearch'

function rootReducer(state = initialState, action) {
  let strings, sequences = null;

  switch (action.type) {
    case controlPanelActions.NEXT_SEQUENCE:
      return  {
        ...state,
        sequenceIdx: state.sequenceIdx + 1,
      }
    case controlPanelActions.PREV_SEQUENCE:
      return {
        ...state,
        sequenceIdx: state.sequenceIdx - 1,
      }
    case controlPanelActions.SEARCH:
      const {current, notes} = search(action.searchTerm);
      strings = getStrings(state);
      sequences = current ? generate(notes, strings, state.position) : [];
      return {
        ...state,
        litNotes: notes,
        current: current,
        searchStr: action.searchTerm,
        sequences: sequences,
        sequenceIdx: sequences.length > 0 ? 0 : null,
      };
    case controlPanelActions.SET_FILTER_END:
      return {
        ...state,
        filterEnd: action.filterEnd
      };
    case controlPanelActions.SET_FILTER_START:
      return {
        ...state,
        filterStart: action.filterStart
      };
    case controlPanelActions.SET_FRET_COUNT:
      return {
        ...state,
        fretCount: action.fretCount
      };
    case controlPanelActions.SET_POSITION:
      strings = getStrings(state);
      sequences = state.current ? generate(state.litNotes, strings, state.position) : [];
      return {
        ...state,
        position: action.position,
        sequences: sequences,
        sequenceIdx: sequences.length > 0 ? 0 : null,
      };

    case controlPanelActions.SET_SEQUENCE_ENABLED:
      return {
        ...state,
        sequenceEnabled: action.value
      };
    case controlPanelActions.SET_STARTING_FRET:
      return {
        ...state,
        startingFret: action.startingFret
      };
    case controlPanelActions.SET_TUNING:
      return {
        ...state,
        tuning: action.tuning
      };
    case settingsActions.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    default:
      return state;
  }
}

export default rootReducer;
