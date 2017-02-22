import React, { Component } from 'react';
import tunings from './lib/tunings.js';
import ControlPanel from './ControlPanel/ControlPanel.jsx';
import Fretboard from './Fretboard/Fretboard.jsx';
import Sequence from './Sequence/Sequence.jsx';
import Transport from './ControlPanel/Transport.jsx';
import Chord from './lib/Chord.js';
import Mode from './lib/Mode.js';
import Scale from './lib/Scale.js';
import Note from './lib/Note.js';
import { parseList } from './lib/tones.js';
import generate from './lib/sequenceGenerator.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tuning: tunings.standard,
      litNotes: [],
      markedNotes: [],
      startingFret: 1,
      position: 1,
      fretCount: 12,
      searchStr: '',
      current: null,
      filterStart: 1,
      filterEnd: 12,
      sequences: [],
      sequenceIdx: null,
      sequenceEnabled: false,
      degreesEnabled: false
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setPosition = this.setPosition.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
    this.setFilterStart = this.setFilterStart.bind(this);
    this.setFilterEnd = this.setFilterEnd.bind(this);
    this.setSequenceEnabled = this.setSequenceEnabled.bind(this);
    this.setDegreesEnabled = this.setDegreesEnabled.bind(this);
    this.getCurrentSequence = this.getCurrentSequence.bind(this);
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
  }

  get strings() {
    const openNotes = this.state.tuning.map((noteStr) => {
      return new Note(noteStr);
    });

    const strings = openNotes.map((note) => {
      const notes = [];
      for (let i=1; i<this.state.fretCount; i++) {
        notes.push(new Note(note.semitones + i));
      }

      return notes;
    });

    return strings;
  }

  setNotes(notes) {
    this.setState({litNotes: notes});
  }

  nextSequence() {
    if (sequenceIdx < sequences.length - 1) {
      this.setState({sequenceIdx: sequenceIdx + 1});
    }
  }

  prevSequence() {
    if (sequenceIdx > 0) {
      this.setState({sequenceIdx: sequenceIdx - 1});
    }
  }

  search(searchStr) {
    let chord, mode, scale, sequences, current, notes;
    sequences = [];

    try {
      current = chord = new Chord(searchStr);
      notes = chord.notes;
      sequences = generate(notes, this.strings, this.state.position)
    } catch(ex) {
      //console.log(ex.message)
    }

    try {
      current = mode = new Mode(searchStr);
      notes = mode.notes;
      sequences = generate(notes, this.strings, this.state.position)
    } catch(ex) {
      //console.log(ex.message)
    }

    try {
      current = scale = new Scale(searchStr);
      notes = scale.notes;
      sequences = generate(notes, this.strings, this.state.position)
    } catch(ex) {
      //console.log(ex.message)
    }

    if (!notes) {
      notes = parseList(searchStr);
    }

    const sequenceIdx = sequences.length > 0 ? 0 : null;

    this.setState({
      searchStr: searchStr,
      litNotes: notes,
      sequences: sequences,
      sequenceIdx: sequenceIdx,
      current: current
    });
  }

  setStartingFret(fret) {
    this.setState({startingFret: fret});
  }

  setPosition(fret) {
    this.setState({position: fret});

    if (this.state.current) {
      const sequences = generate(this.state.current.notes, this.strings, fret)
      const sequenceIdx = sequences.length > 0 ? 0 : null;
      this.setState({
        sequences: sequences,
        sequenceIdx: sequenceIdx
      });
    }
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

  setSequenceEnabled(value) {
    this.setState({sequenceEnabled: value});
  }

  setDegreesEnabled(value) {
    this.setState({degreesEnabled: value});
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

  next(e) {
    e.preventDefault();
    if (!this.state.sequences.length) return;

    const nextSequenceIdx = this.state.sequenceIdx + 1;
    if (nextSequenceIdx < this.state.sequences.length) {
      this.setState({sequenceIdx: nextSequenceIdx})
    }
  }

  prev(e) {
    e.preventDefault();
    if (!this.state.sequences.length) return;

    const nextSequenceIdx = this.state.sequenceIdx - 1;
    if (nextSequenceIdx >= 0) {
      this.setState({sequenceIdx: nextSequenceIdx})
    }
  }

  getCurrentSequence() {
    return this.state.sequences[this.state.sequenceIdx];
  }

  render() {
    return (
      <div className='main'>
        <label className='selected-label'>
          {this.state.current ? this.state.current.name : ''}
          {this.state.sequenceEnabled && this.getCurrentSequence() ? 
            ` (${this.state.sequenceIdx + 1} / ${this.state.sequences.length})` : ''}
        </label>
        <Fretboard startingFret={this.state.startingFret}
          fretCount={this.state.fretCount}
          tuning={this.state.tuning}
          litNotes={this.state.litNotes}
          markedNotes={this.state.markedNotes}
          current={this.state.current}
          filterStart={this.state.filterStart}
          filterEnd={this.state.filterEnd}
          sequence={this.getCurrentSequence()}
          sequenceEnabled={this.state.sequenceEnabled}
          degreesEnabled={this.state.degreesEnabled}/>
        <ControlPanel search={this.search}
          setStartingFret={this.setStartingFret}
          setPosition={this.setPosition}
          setFilterStart={this.setFilterStart}
          setFilterEnd={this.setFilterEnd}
          setFretCount={this.setFretCount}
          setSequenceEnabled={this.setSequenceEnabled}
          setDegreesEnabled={this.setDegreesEnabled}
          clear={this.clear}
          next={this.next}
          prev={this.prev}/>
        <Transport />
      </div>
    );
  }
}
export default App;
