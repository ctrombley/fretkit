import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      litNotes: [],
      startingFret: 1,
      fretCount: 12
    };

    this.setNotes = this.setNotes.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
  }

  setNotes(notes) {
    this.setState({litNotes: notes});
  }

  setStartingFret(fret) {
    this.setState({startingFret: fret});
  }

  setFretCount(count) {
    this.setState({fretCount: count});
  }

  render() {
    return (
      <div className='main'>
        <ControlPanel setNotes={this.setNotes}
          setStartingFret={this.setStartingFret}
          setFretCount={this.setFretCount} />
        <Fretboard startingFret={this.state.startingFret}
          fretCount={this.state.fretCount}
          tuning={tunings.standard}
          litNotes={this.state.litNotes}/>
      </div>
    );
  }
}
export default App;
