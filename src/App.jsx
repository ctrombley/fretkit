import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      litNotes: []
    };

    this.showNotes = this.showNotes.bind(this);
  }

  showNotes(notes) {
    this.setState({litNotes: notes});
  }

  render() {
    return (
      <div>
        <ControlPanel showNotes={this.showNotes}/>
        <Fretboard width="1080" height="480"
          startFret={1}
          fretCount={24}
          tuning={tunings.standard}
          litNotes={this.state.litNotes}/>
      </div>
    );
  }
}
export default App;
