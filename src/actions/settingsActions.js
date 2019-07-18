/*
 * action types
 */

export const OPEN_SETTINGS = 'OPEN_SETTINGS'
export const UPDATE_SETTINGS = 'UPDATE_SETTINGS'

/*
 * action creators
 */

export function openSettings(id) {
  return { type: OPEN_SETTINGS, id };
}

export function updateSettings(data) {
  return { type: UPDATE_SETTINGS, data };
}

