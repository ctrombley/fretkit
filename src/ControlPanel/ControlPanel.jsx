import React, { Component } from 'react';
import Chord from '../lib/Chord.js';
import { parseList } from '../lib/tones.js';

class ControlPanel extends Component {
  static propTypes = {
    setFretCount: React.PropTypes.func.isRequired,
    search: React.PropTypes.func.isRequired,
    setStartingFret: React.PropTypes.func.isRequired,
    clear: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      search: '',
      startingFret: '1',
      fretCount: '12'
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
  }

  setStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setStartingFret(value);
    this.setState({startingFret: value});
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
            Fret count:
            <input className='control-panel__input'
              type='number' min='1' max='12'
              value={this.state.fretCount}
              onChange={this.setFretCount} />
          </label>
          <button onClick={this.props.clear}>Clear fretboard</button>
          <button>Rotate</button>
        </form>
      </div>
    );
  }
}

export default ControlPanel;
