import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from 'react-sidebar';

import ControlPanel from './ControlPanel';
import FretboardContainer from './Fretboard/Fretboard';

import Header from './Header';
import Transport from './Transport';
import * as settingsActions from '../actions/settingsActions';

import '../styles/application.scss'

const App = ({
  current,
  sequenceEnabled,
  sequenceIdx,
  sequences,
  sidebarOpen,
  setSidebarOpen,
}) => {

  function onSetSidebarOpen(event) {
    setSidebarOpen(event.value.checked);
  }

  //  next(e) {
  //    e.preventDefault();
  //    if (!this.state.sequences.length) return;
  //
  //    const nextSequenceIdx = this.state.sequenceIdx + 1;
  //    if (nextSequenceIdx < this.state.sequences.length) {
  //      this.setState({ sequenceIdx: nextSequenceIdx });
  //    }
  //  }
  //
  //  prev(e) {
  //    e.preventDefault();
  //    if (!this.state.sequences.length) return;
  //
  //    const nextSequenceIdx = this.state.sequenceIdx - 1;
  //    if (nextSequenceIdx >= 0) {
  //      this.setState({ sequenceIdx: nextSequenceIdx });
  //    }
  //  }
  //
  //  clear() {
  //    this.setState({ markedNotes: null });
  //  }
  //
  // toggleMarkedNote(string, value) {
  //   this.setState({ markedNote: value });
  // }


  // nextSequence() {
  //   const { sequenceIdx, sequences } = this.state;
  //   if (sequenceIdx < sequences.length - 1) {
  //     this.setState({ sequenceIdx: sequenceIdx + 1 });
  //   }
  // }

  // prevSequence() {
  //   const { sequenceIdx } = this.state;
  //   if (sequenceIdx > 0) {
  //     this.setState({ sequenceIdx: sequenceIdx - 1 });
  //   }
  // }

  // get strings() {
  //   const { fretCount, tuning } = this.state;
  //   const openNotes = tuning.map(noteStr => new Note(noteStr));

  //   const strings = openNotes.map((note) => {
  //     const notes = [];
  //     for (let i = 1; i < fretCount; i += 1) {
  //       notes.push(new Note(note.semitones + i));
  //     }

  //     return notes;
  //   });

  //   return strings;
  // }


  const sidebarStyles = {
    overlay: {
      transition: "none",
      backgroundColor: "inherit",
      zIndex: 0
    },
    sidebar: {
      top: "56px",
      padding: "10px",
      backgroundColor: "#fff",
    }
  };

  return (
    <Sidebar
      open={sidebarOpen}
      onSetOpen={onSetSidebarOpen}
      styles={sidebarStyles}
      sidebar={<ControlPanel />}
    >
      <Header />
      <Container>
        <Row>
          <Col>
              <div className="selected-label">
                {current ? current.name : ''}
                {sequenceEnabled && this.getCurrentSequence() ?
                  ` (${sequenceIdx + 1} / ${sequences.length})` : ''}
              </div>
              <FretboardContainer />
              <Transport />
          </Col>
        </Row>
      </Container>
    </Sidebar>
  );
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(settingsActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
