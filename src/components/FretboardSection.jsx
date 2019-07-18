import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, ButtonToolbar } from 'react-bootstrap';

import FretboardLabel from './Fretboard/FretboardLabel';
import Fretboard from './Fretboard/Fretboard';

import * as settingsActions from '../actions/settingsActions';
import * as fretboardActions from '../actions/fretboardActions';

const FretboardSection = ({
  fretboards,
  id,
  deleteFretboard,
  openSettings,
}) => (
  <div>
    <ButtonToolbar className="float-right">
      <Button className="btn-sm btn-light">
        <span className="oi oi-x" onClick={() => deleteFretboard(id)}></span>
      </Button>
      <Button className="btn-sm btn-light">
        <span className="oi oi-pencil" onClick={() => openSettings(id)}></span>
      </Button>
    </ButtonToolbar>
    <FretboardLabel {...fretboards[id]} />
    <Fretboard {...fretboards[id]} />
  </div>
)

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators(settingsActions, dispatch),
    ...bindActionCreators(fretboardActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FretboardSection);
