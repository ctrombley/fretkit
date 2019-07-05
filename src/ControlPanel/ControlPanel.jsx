import React, { Component } from 'react';
import { ButtonToolbar, Button, Form, Row } from 'react-bootstrap';
import PropTypes from 'prop-types';

class ControlPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      search: '',
      startingFret: '1',
      position: '1',
      fretCount: '24',
      filterStart: '1',
      filterEnd: '24',
      sequenceEnabled: false,
      tuning: null,
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setPosition = this.setPosition.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
    this.setFilterStart = this.setFilterStart.bind(this);
    this.setFilterEnd = this.setFilterEnd.bind(this);
    this.setSequenceEnabled = this.setSequenceEnabled.bind(this);
    this.setTuning = this.setTuning.bind(this);
  }

  setStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setStartingFret(value);
    this.setState({ startingFret: value });
  }

  setPosition(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setPosition(value);
    this.setState({ position: value });
  }

  setFilterStart(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFilterStart(value);
    this.setState({ filterStart: value });
  }

  setFilterEnd(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFilterEnd(value);
    this.setState({ filterEnd: value });
  }

  setSequenceEnabled(event) {
    const value = event.target.checked;
    this.props.setSequenceEnabled(value);
    this.setState({ sequenceEnabled: value });
  }

  setFretCount(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFretCount(value);
    this.setState({ fretCount: value });
  }

  setTuning(event) {
    const value = event.target.selectedOptions[0].value;
    const [instrument, tuning] = value.split(".")
    this.props.setTuning(this.props.tunings[instrument][tuning]);
    this.setState({ tuning: value });
  }

  search(event) {
    const value = event.target.value;
    this.props.search(value);
    this.setState({ search: value });
  }

  render() {
    const {
      clear,
      prev,
      next,
      tunings,
    } = this.props;

    const {
      // filterEnd,
      // filterStart,
      fretCount,
      position,
      search,
      sequenceEnabled,
      startingFret,
    } = this.state;

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
            value={search}
            onChange={this.search}
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
            onChange={this.setStartingFret}
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
            onChange={this.setFretCount}
          />
        </Form.Group>
        <Form.Group controlId="controlPanel.FretCount">
          <Form.Label>Tuning</Form.Label>
          <Form.Control as="select"
            type="select"
            name="tuning"
            value={this.tuning}
            onChange={this.setTuning}
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
            onChange={this.setFilterStart} />
        </Form.Group>
        <Form.Group controlId="controlPanel.FilterEnd">
          <Form.Label>Filter End</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="24"
            value={filterEnd}
            onChange={this.setFilterEnd} />
        </Form.Group>
        */}
        <Form.Check inline
          name="sequenceEnabled"
          label="Sequence"
          value={sequenceEnabled}
          onChange={this.setSequenceEnabled} />
        <Form.Group controlId="controlPanel.Position">
          <Form.Label>Position</Form.Label>
          <Form.Control
            type="number"
            name="position"
            min="1"
            max="24"
            value={position}
            onChange={this.setPosition}
          />
        </Form.Group>
        <ButtonToolbar>
          <Button variant="outline-primary" onClick={clear}>Clear Fretboard</Button>
          <Button variant="outline-primary" onClick={prev}>Prev</Button>
          <Button variant="outline-primary" onClick={next}>Next</Button>
        </ButtonToolbar>
      </Form>
    );
  }
}

ControlPanel.propTypes = {
  clear: PropTypes.func.isRequired,
  next: PropTypes.func.isRequired,
  prev: PropTypes.func.isRequired,
  search: PropTypes.func.isRequired,
  setFilterEnd: PropTypes.func.isRequired,
  setFilterStart: PropTypes.func.isRequired,
  setFretCount: PropTypes.func.isRequired,
  setPosition: PropTypes.func.isRequired,
  setSequenceEnabled: PropTypes.func.isRequired,
  setStartingFret: PropTypes.func.isRequired,
  setTuning: PropTypes.func.isRequired,
};

export default ControlPanel;
