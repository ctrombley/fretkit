import { combineReducers } from 'redux'

import fretboardReducer from './fretboard';
import settingsReducer from './settings';

export default combineReducers({
  fretboards: fretboardReducer,
  settings: settingsReducer
});
