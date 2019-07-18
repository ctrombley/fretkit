import * as settingsActions from '../actions/settingsActions'

import initialState from './initialState'

function settingsReducer(state = initialState.settings, action) {
  switch (action.type) {
    case settingsActions.OPEN_SETTINGS:
      return {
        ...state,
        settingsId: action.id,
        sidebarOpen: true,
      };

    case settingsActions.UPDATE_SETTINGS:
      return {
        ...state,
        ...action.data
      };

    default:
      return state;
  }
}

export default settingsReducer;
