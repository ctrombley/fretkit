import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { ButtonToolbar, Button, Form } from 'react-bootstrap';

import tunings from '../lib/tunings'
import * as controlPanelActions from '../actions/controlPanelActions'

const ControlPanel = ({
  clear,
  filterEnd,
  filterStart,
  fretCount,
  nextSequence,
  position,
  prevSequence,
  search,
  searchTerm,
  sequenceEnabled,
  //setFilterEnd,
  //setFilterStart,
  setFretCount,
  setPosition,
  setSequenceEnabled,
  setStartingFret,
  setTuning,
  startingFret,
  tuning,
}) => {

  function onSetStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    setStartingFret(value);
  }

  function onSetPosition(event) {
    const value = parseInt(event.target.value, 10);
    setPosition(value);
  }

  // function onSetFilterStart(event) {
  //   const value = parseInt(event.target.value, 10);
  //   setFilterStart(value);
  // }

  // function onSetFilterEnd(event) {
  //   const value = parseInt(event.target.value, 10);
  //   setFilterEnd(value);
  // }

  function onSetSequenceEnabled(event) {
    const value = event.target.checked;
    setSequenceEnabled(value);
  }

  function onSetFretCount(event) {
    const value = parseInt(event.target.value, 10);
    setFretCount(value);
  }

  function onSetTuning(event) {
    const value = event.target.selectedOptions[0].value;
    const [instrument, tuning] = value.split(".")
    setTuning(tunings[instrument][tuning]);
  }

  function onSearch(event) {
    const value = event.target.value;
    search(value);
  }

  const tuningOptions = (
    Object.keys(tunings).map(instrument =>
      Object.keys(tunings[instrument]).map(tuning =>
         <option key={`${instrument}.${tuning}`} value={`${instrument}.${tuning}`}>{instrument} -> {tuning}</option>
      )
    )
  )

  return (
    <Form>
      <Form.Group controlId="controlPanel.Search">
        <Form.Label>Show</Form.Label>
        <Form.Control
          type="search"
          name="search"
          placeholder="Chord or scale"
          value={searchTerm}
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
      <Form.Group controlId="controlPanel.FretCount">
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
      {/*
      <Form.Group controlId="controlPanel.FilterStart">
        <Form.Label>Filter Start</Form.Label>
        <Form.Control
          type="number"
          min="1"
          max="24"
          value={filterStart}
          onChange={onSetFilterStart} />
      </Form.Group>
      <Form.Group controlId="controlPanel.FilterEnd">
        <Form.Label>Filter End</Form.Label>
        <Form.Control
          type="number"
          min="1"
          max="24"
          value={filterEnd}
          onChange={onSetFilterEnd} />
      </Form.Group>
      */}
      <Form.Check inline
        name="sequenceEnabled"
        label="Sequence"
        value={sequenceEnabled}
        onChange={onSetSequenceEnabled} />
      <Form.Group controlId="controlPanel.Position">
        <Form.Label>Position</Form.Label>
        <Form.Control
          type="number"
          name="position"
          min="1"
          max="24"
          value={position}
          onChange={onSetPosition}
        />
      </Form.Group>
      <ButtonToolbar>
        <Button variant="outline-primary" onClick={clear}>Clear Fretboard</Button>
        <Button variant="outline-primary" onClick={prevSequence}>Prev</Button>
        <Button variant="outline-primary" onClick={nextSequence}>Next</Button>
      </ButtonToolbar>
    </Form>
  );
}

ControlPanel.propTypes = {
  clear: PropTypes.func.isRequired,
  nextSequence: PropTypes.func.isRequired,
  prevSequence: PropTypes.func.isRequired,
  search: PropTypes.func.isRequired,
  setFilterEnd: PropTypes.func.isRequired,
  setFilterStart: PropTypes.func.isRequired,
  setFretCount: PropTypes.func.isRequired,
  setPosition: PropTypes.func.isRequired,
  setSequenceEnabled: PropTypes.func.isRequired,
  setStartingFret: PropTypes.func.isRequired,
  setTuning: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  return state;
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators(controlPanelActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);
