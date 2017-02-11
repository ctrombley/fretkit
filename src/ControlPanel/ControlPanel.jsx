import React, { Component } from 'react';
import { parseList } from '../lib/tones.js';

class ControlPanel extends Component {
  static propTypes = {
    showNotes: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      notes: '',
      startingFret: ''
    };

    this.setNotes = this.setNotes.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
  }

  setStartingFret(event) {
    const value = parseInt(event.target.value, 10);
    this.props.setStartingFret(value);
    this.setState({startingFret: value});
  }

  setNotes(event) {
    const value = event.target.value;
    const notes = parseList(value);
    this.props.showNotes(notes);

    this.setState({notes: value});
  }

  render() {
    return (
      <div className='control-panel'>
       <form>
          <label>
            Show:
            <input value={this.state.notes} 
              onChange={this.setNotes} />
          </label>
          <label>
            Starting fret:
            <input type='number' min='1' max='24' 
              value={this.state.startingFret} 
              onChange={this.setStartingFret} />
          </label>
        </form>
      </div>
    );
  }
}

export default ControlPanel;
