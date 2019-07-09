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

  //  clear() {
  //    this.setState({ markedNotes: null });
  //  }
  //
  // toggleMarkedNote(string, value) {
  //   this.setState({ markedNote: value });
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
                {current ? `${current.name} (${current.constructor.name})` : ''}
                {sequenceEnabled && sequences && sequences[sequenceIdx] ?
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
