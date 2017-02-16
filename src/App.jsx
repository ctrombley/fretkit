import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';
import Chord from './lib/Chord.js';
import Mode from './lib/Mode.js';
import Scale from './lib/Scale.js';
import { parseList } from './lib/tones.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      litNotes: [],
      startingFret: 1,
      fretCount: 12,
      searchStr: '',
      current: null
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
  }

  setNotes(notes) {
    this.setState({litNotes: notes});
  }

  search(searchStr) {
    let chord, mode, scale, current, notes;

    try {
      current = chord = new Chord(searchStr);
      notes = chord.notes;
    } catch(ex) { 
      //console.log(ex.message)
    }

    try {
      current = mode = new Mode(searchStr);
      notes = mode.notes;
    } catch(ex) {
      //console.log(ex.message)
    }

    try {
      current = scale = new Scale(searchStr);
      notes = scale.notes;
    } catch(ex) {
      //console.log(ex.message)
    }

    if (!notes) {
      notes = parseList(searchStr);
    }

    this.setState({
      searchStr: searchStr,
      litNotes: notes,
      current: current
    });
  }

  setStartingFret(fret) {
    this.setState({startingFret: fret});
  }

  setFretCount(count) {
    this.setState({fretCount: count});
  }

  clear() {
  }

  render() {
    return (
      <div className='main'>
        <ControlPanel search={this.search}
          setStartingFret={this.setStartingFret}
          setFretCount={this.setFretCount} 
          clear={this.clear}/>
        <Fretboard startingFret={this.state.startingFret}
          fretCount={this.state.fretCount}
          tuning={tunings.standard}
          litNotes={this.state.litNotes}
          current={this.state.current}/>
        <label>{this.state.current ? this.state.current.name : ''}</label>
      </div>
    );
  }
}
export default App;
