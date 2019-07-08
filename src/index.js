import React from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import rootReducer from './reducers/index'
import initialState from './reducers/initialState'
import App from './components/App';

import 'bootstrap/dist/css/bootstrap.css';

const store = createStore(rootReducer, initialState);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
