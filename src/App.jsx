import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      litNotes: [],
      startingFret: 1
    };

    this.showNotes = this.showNotes.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
  }

  showNotes(notes) {
    this.setState({litNotes: notes});
  }

  setStartingFret(fret) {
    this.setState({startingFret: fret});
  }

  render() {
    return (
      <div>
        <ControlPanel showNotes={this.showNotes}
          setStartingFret={this.setStartingFret}/>
        <Fretboard width="1080" height="480"
          startingFret={this.state.startingFret}
          fretCount={24}
          tuning={tunings.standard}
          litNotes={this.state.litNotes}/>
      </div>
    );
  }
}
export default App;
