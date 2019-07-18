import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { ButtonToolbar, Button, Form } from 'react-bootstrap';

import tunings from '../lib/tunings'
import { getStrings } from '../selectors/index'
import * as settingsActions from '../actions/settingsActions'
import * as fretboardActions from '../actions/fretboardActions'

const ControlPanel = ({
  fretCount,
  position,
  search,
  searchStr,
  sequenceEnabled,
  sequenceIdx,
  sequences,
  settingsId,
  startingFret,
  strings,
  toggleSidebar,
  tuning,
  updateFretboard,
  updateSettings,
}) => {
  function onSetStartingFret(event) {
    const startingFret = parseInt(event.target.value, 10);
    updateFretboard(settingsId, { startingFret });
  }

  function onSetPosition(event) {
    const position = parseInt(event.target.value, 10);
    updateFretboard(settingsId, { position });
  }

  function onSetSequenceEnabled(event) {
    const sequenceEnabled = event.target.checked;
    updateFretboard(settingsId, { sequenceEnabled });
  }

  function onSetFretCount(event) {
    const fretCount = parseInt(event.target.value, 10);
    updateFretboard(settingsId, { fretCount });
  }

  function onSetTuning(event) {
    const tuning = event.target.selectedOptions[0].value.split(',');
    updateFretboard(settingsId, { tuning });
  }

  function onSearch(event) {
    const value = event.target.value;
    console.log([settingsId, strings, value])
    search(settingsId, strings, value);
  }

  function onNextSequence() {
    updateFretboard(settingsId, { sequenceIdx: sequenceIdx + 1 });
  }

  function onPrevSequence() {
    updateFretboard(settingsId, { sequenceIdx: sequenceIdx - 1 });
  }

  function onCloseSidebar() {
    updateSettings({ sidebarOpen: false });
  }

  function prevSequenceDisabled() {
    return sequenceControlDisabled() || sequenceIdx === 0;
  }

  function nextSequenceDisabled() {
    return sequenceControlDisabled() || sequenceIdx === sequences.length - 1;
  }

  function sequenceControlDisabled() {
    return !sequenceEnabled || !sequences.length;
  }

  const tuningOptions = (
    Object.keys(tunings).map(instrument =>
      Object.keys(tunings[instrument]).map(tuning =>
         <option key={`${instrument}.${tuning}`} value={tunings[instrument][tuning]}>{instrument} -> {tuning}</option>
      )
    )
  )

  return (
    <Form>
      <ButtonToolbar className="float-right">
        <Button className="btn-sm btn-light" onClick={onCloseSidebar}>
          <span className="oi oi-x"></span>
        </Button>
      </ButtonToolbar>
      <Form.Group controlId="controlPanel.Search">
        <Form.Label>Show</Form.Label>
        <Form.Control
          type="search"
          name="search"
          placeholder="Chord or scale"
          value={searchStr}
          onChange={onSearch}
        />
      </Form.Group>
      <Form.Group controlId="controlPanel.StartingFret">
        <Form.Label>Starting Fret</Form.Label>
        <Form.Control
          type="number"
          name="startingFret"
          min="1"
          max="24"
          value={startingFret}
          onChange={onSetStartingFret}
        />
      </Form.Group>
      <Form.Group controlId="controlPanel.FretCount">
        <Form.Label>Fret Count</Form.Label>
        <Form.Control
          type="number"
          name="fretCount"
          min="1"
          max="24"
          value={fretCount}
          onChange={onSetFretCount}
        />
      </Form.Group>
      <Form.Group controlId="controlPanel.Tuning">
        <Form.Label>Tuning</Form.Label>
        <Form.Control as="select"
          type="select"
          name="tuning"
          value={tuning}
          onChange={onSetTuning}
        >
          {tuningOptions}
        </Form.Control>
      </Form.Group>
      <Form.Check inline
        name="sequenceEnabled"
        label="Sequence"
        value={sequenceEnabled}
        disabled={!sequences.length}
        onChange={onSetSequenceEnabled} />
      <Form.Group controlId="controlPanel.Position">
        <Form.Label>Position</Form.Label>
        <Form.Control
          type="number"
          name="position"
          min="1"
          max="24"
          disabled={sequenceControlDisabled()}
          value={position}
          onChange={onSetPosition}
        />
      </Form.Group>
      <ButtonToolbar>
        <Button variant="outline-primary" onClick={onPrevSequence} disabled={prevSequenceDisabled()}>Prev</Button>
        <Button variant="outline-primary" onClick={onNextSequence} disabled={nextSequenceDisabled()}>Next</Button>
      </ButtonToolbar>
    </Form>
  );
}

ControlPanel.propTypes = {
  search: PropTypes.func.isRequired,
  settingsId: PropTypes.string.isRequired,
  updateFretboard: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  settingsId: state.settings.settingsId,
  strings: getStrings(state),
  ...state.fretboards[state.settings.settingsId],
});

const mapDispatchToProps = dispatch => {
  return {
    ...bindActionCreators(settingsActions, dispatch),
    ...bindActionCreators(fretboardActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);
