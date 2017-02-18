import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';
import Sequence from './Sequence/Sequence.jsx';
import Transport from './ControlPanel/Transport.jsx';
import Chord from './lib/Chord.js';
import Mode from './lib/Mode.js';
import Scale from './lib/Scale.js';
import { parseList } from './lib/tones.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      litNotes: [],
      markedNotes: [],
      startingFret: 1,
      fretCount: 12,
      searchStr: '',
      current: null,
      filterStart: 1,
      filterEnd: 12,
      sequence: [],
      sequenceIdx: null 
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
    this.setFilterStart = this.setFilterStart.bind(this);
    this.setFilterEnd = this.setFilterEnd.bind(this);
    this.setMarkedNote = this.setMarkedNote.bind(this);
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

  setFilterStart(value) {
    this.setState({filterStart: value});
  }

  setFilterEnd(value) {
    this.setState({filterEnd: value});
  }

  toggleMarkedNote(string, value) {
    this.setState({markedNote: value});
  }

  setMarkedNotes(value) {
    this.setState({markedNotes: value});
  }

  clear() {
    this.setState({markedNotes})
  }

  render() {
    return (
      <div className='main'>
        <label className='selected-label'>{this.state.current ? this.state.current.name : ''}</label>
        <Fretboard startingFret={this.state.startingFret}
          fretCount={this.state.fretCount}
          tuning={tunings.standard}
          litNotes={this.state.litNotes}
          markedNotes={this.state.markedNotes}
          current={this.state.current}
          filterStart={this.state.filterStart}
          filterEnd={this.state.filterEnd}/>
        <ControlPanel search={this.search}
          setStartingFret={this.setStartingFret}
          setFilterStart={this.setFilterStart}
          setFilterEnd={this.setFilterEnd}
          setFretCount={this.setFretCount}
          clear={this.clear}/>
        <Sequence sequence={this.state.sequence}
          sequenceIdx={this.state.sequenceIdx}
        />
        <Transport />
      </div>
    );
  }
}
export default App;
