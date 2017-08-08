import React, { Component } from 'react';
import tunings from './lib/tunings';
import ControlPanel from './ControlPanel/ControlPanel';
import Fretboard from './Fretboard/Fretboard';
import Transport from './ControlPanel/Transport';
import Chord from './lib/Chord';
import Mode from './lib/Mode';
import Scale from './lib/Scale';
import Note from './lib/Note';
import { parseList } from './lib/tones';
import generate from './lib/sequenceGenerator';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      current: null,
      filterEnd: 24,
      filterStart: 1,
      fretCount: 24,
      litNotes: [],
      markedNotes: [],
      position: 1,
      searchStr: '',
      sequenceEnabled: false,
      sequenceIdx: null,
      sequences: [],
      startingFret: 1,
      tuning: tunings.standard,
    };

    this.search = this.search.bind(this);
    this.setStartingFret = this.setStartingFret.bind(this);
    this.setPosition = this.setPosition.bind(this);
    this.setFretCount = this.setFretCount.bind(this);
    this.setFilterStart = this.setFilterStart.bind(this);
    this.setFilterEnd = this.setFilterEnd.bind(this);
    this.clear = this.clear.bind(this);
    this.setSequenceEnabled = this.setSequenceEnabled.bind(this);
    this.getCurrentSequence = this.getCurrentSequence.bind(this);
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
  }

  setNotes(notes) {
    this.setState({ litNotes: notes });
  }

  setStartingFret(fret) {
    this.setState({ startingFret: fret });
  }

  setPosition(fret) {
    this.setState({ position: fret });

    if (this.state.current) {
      const sequences = generate(this.state.current.notes, this.strings, fret);
      const sequenceIdx = sequences.length > 0 ? 0 : null;
      this.setState({
        sequences,
        sequenceIdx,
      });
    }
  }

  setFretCount(count) {
    this.setState({ fretCount: count });
  }

  setFilterStart(value) {
    this.setState({ filterStart: value });
  }

  setFilterEnd(value) {
    this.setState({ filterEnd: value });
  }

  setSequenceEnabled(value) {
    this.setState({ sequenceEnabled: value });
  }

  setMarkedNotes(value) {
    this.setState({ markedNotes: value });
  }

  getCurrentSequence() {
    return this.state.sequences[this.state.sequenceIdx];
  }

  next(e) {
    e.preventDefault();
    if (!this.state.sequences.length) return;

    const nextSequenceIdx = this.state.sequenceIdx + 1;
    if (nextSequenceIdx < this.state.sequences.length) {
      this.setState({ sequenceIdx: nextSequenceIdx });
    }
  }

  prev(e) {
    e.preventDefault();
    if (!this.state.sequences.length) return;

    const nextSequenceIdx = this.state.sequenceIdx - 1;
    if (nextSequenceIdx >= 0) {
      this.setState({ sequenceIdx: nextSequenceIdx });
    }
  }

  clear() {
    this.setState({ markedNotes: null });
  }

  toggleMarkedNote(string, value) {
    this.setState({ markedNote: value });
  }

  search(searchStr) {
    let chord;
    let mode;
    let scale;
    let current;
    let notes;
    let sequences = [];

    try {
      chord = new Chord(searchStr);
      current = chord;
      notes = chord.notes;
      sequences = generate(notes, this.strings, this.state.position);
    } catch (ex) {
      // console.log(ex.message)
    }

    try {
      mode = new Mode(searchStr);
      current = mode;
      notes = mode.notes;
      sequences = generate(notes, this.strings, this.state.position);
    } catch (ex) {
      // console.log(ex.message)
    }

    try {
      scale = new Scale(searchStr);
      current = scale;
      notes = scale.notes;
      sequences = generate(notes, this.strings, this.state.position);
    } catch (ex) {
      // console.log(ex.message)
    }

    if (!notes) {
      notes = parseList(searchStr);
    }

    const sequenceIdx = sequences.length > 0 ? 0 : null;

    this.setState({
      searchStr,
      litNotes: notes,
      sequences,
      sequenceIdx,
      current,
    });
  }

  nextSequence() {
    const { sequenceIdx, sequences } = this.state;
    if (sequenceIdx < sequences.length - 1) {
      this.setState({ sequenceIdx: sequenceIdx + 1 });
    }
  }

  prevSequence() {
    const { sequenceIdx } = this.state;
    if (sequenceIdx > 0) {
      this.setState({ sequenceIdx: sequenceIdx - 1 });
    }
  }

  get strings() {
    const { fretCount, tuning } = this.state;
    const openNotes = tuning.map(noteStr => new Note(noteStr));

    const strings = openNotes.map((note) => {
      const notes = [];
      for (let i = 1; i < fretCount; i += 1) {
        notes.push(new Note(note.semitones + i));
      }

      return notes;
    });

    return strings;
  }

  render() {
    const {
      current,
      filterStart,
      filterEnd,
      fretCount,
      litNotes,
      markedNotes,
      sequenceEnabled,
      sequenceIdx,
      sequences,
      startingFret,
      tuning,
    } = this.state;

    return (
      <div className="main">
        <div className="selected-label">
          {current ? current.name : ''}
          {sequenceEnabled && this.getCurrentSequence() ?
            ` (${sequenceIdx + 1} / ${sequences.length})` : ''}
        </div>
        <Fretboard
          startingFret={startingFret}
          fretCount={fretCount}
          tuning={tuning}
          litNotes={litNotes}
          markedNotes={markedNotes}
          current={current}
          filterStart={filterStart}
          filterEnd={filterEnd}
          sequence={this.getCurrentSequence()}
          sequenceEnabled={sequenceEnabled}
        />
        <ControlPanel
          search={this.search}
          setStartingFret={this.setStartingFret}
          setPosition={this.setPosition}
          setFilterStart={this.setFilterStart}
          setFilterEnd={this.setFilterEnd}
          setFretCount={this.setFretCount}
          setSequenceEnabled={this.setSequenceEnabled}
          clear={this.clear}
          next={this.next}
          prev={this.prev}
        />
        <Transport />
      </div>
    );
  }
}
export default App;
