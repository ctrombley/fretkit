import React, { Component } from 'react';
import { parseList } from '../lib/tones.js';

class ControlPanel extends Component {
  static propTypes = {
    setFretCount: React.PropTypes.func.isRequired,
    setNotes: React.PropTypes.func.isRequired,
    setStartingFret: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      notes: '',
      startingFret: '1',
      fretCount: '12'
    };

    this.setNotes = this.setNotes.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
  }

  setStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setStartingFret(value);
    this.setState({startingFret: value});
  }

  setNotes(event) {
    const value = event.target.value;
    const notes = parseList(value);
    this.props.setNotes(notes);

    this.setState({notes: value});
  }

  setFretCount(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setFretCount(value);
    this.setState({fretCount: value});
  }

  render() {
    return (
      <div className='control-panel'>
       <form className='control-panel__form'>
          <label className='control-panel__label'>
            Show:
            <input className='control-panel__input'
              value={this.state.notes}
              onChange={this.setNotes} />
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
        </form>
      </div>
    );
  }
}

export default ControlPanel;
