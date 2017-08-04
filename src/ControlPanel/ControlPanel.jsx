import React, { Component } from 'react';
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
      sequenceEnabled: false
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setPosition = this.setPosition.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
    this.setFilterStart = this.setFilterStart.bind(this);
    this.setFilterEnd = this.setFilterEnd.bind(this);
    this.setSequenceEnabled = this.setSequenceEnabled.bind(this);
  }

  setStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setStartingFret(value);
    this.setState({startingFret: value});
  }

  setPosition(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setPosition(value);
    this.setState({position: value});
  }

  setFilterStart(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFilterStart(value);
    this.setState({filterStart: value});
  }

  setFilterEnd(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFilterEnd(value);
    this.setState({filterEnd: value});
  }

  setSequenceEnabled(event) {
    const value = event.target.checked;
    this.props.setSequenceEnabled(value);
    this.setState({sequenceEnabled: value});
  }

  search(event) {
    const value = event.target.value;
    this.props.search(value);
    this.setState({search: value});
  }

  setFretCount(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFretCount(value);
    this.setState({fretCount: value});
  }

  render() {
    return (
      <div className='control-panel'>
        <form className='control-panel__form' action="#">
          <label className='control-panel__label'>
            Show:
            <input className='control-panel__input'
              type='search'
              value={this.state.search}
              onChange={this.search} />
          </label>
          <label className='control-panel__label'>
            Starting fret:
            <input className='control-panel__input'
              type='number' min='1' max='24'
              value={this.state.startingFret}
              onChange={this.setStartingFret} />
          </label>
          <label className='control-panel__label'>
          Position:
            <input className='control-panel__input'
              type='number' min='1' max='24'
              value={this.state.position}
              onChange={this.setPosition} />
          </label>
          <label className='control-panel__label'>
            Fretboard size:
            <input className='control-panel__input'
              type='number' min='1' max='24'
              value={this.state.fretCount}
              onChange={this.setFretCount} />
          </label>
          {/*
          <label className='control-panel__label'>
            Start filter:
            <input className='control-panel__input'
              type='number' min='1' max='24'
              value={this.state.filterStart}
              onChange={this.setFilterStart} />
          </label>
          <label className='control-panel__label'>
            End filter:
            <input className='control-panel__input'
              type='number' min='1' max='24'
              value={this.state.filterEnd}
              onChange={this.setFilterEnd} />
          </label>
          */}
          <label className='control-panel__label'>
           Sequence:
            <input className='control-panel__input'
              type='checkbox'
              value={this.state.sequenceEnabled}
              onChange={this.setSequenceEnabled} />
          </label>
          <button onClick={this.props.clear}>Clear fretboard</button>
          <button onClick={this.props.prev}>Prev</button>
          <button onClick={this.props.next}>Next</button>
        </form>
      </div>
    );
  }
}

ControlPanel.propTypes = {
  setFretCount: React.PropTypes.func.isRequired,
  setPosition: React.PropTypes.func.isRequired,
  search: React.PropTypes.func.isRequired,
  setStartingFret: React.PropTypes.func.isRequired,
  setFilterStart: React.PropTypes.func.isRequired,
  setFilterEnd: React.PropTypes.func.isRequired,
  setSequenceEnabled: React.PropTypes.func.isRequired,
  clear: React.PropTypes.func.isRequired,
  next: React.PropTypes.func.isRequired,
  prev: React.PropTypes.func.isRequired
};

export default ControlPanel;
