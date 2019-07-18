import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Container, Row, Col, Button, ButtonToolbar } from 'react-bootstrap';
import Sidebar from 'react-sidebar';

import ControlPanel from './ControlPanel';
import FretboardSection from './FretboardSection';
import Header from './Header';

import * as settingsActions from '../actions/settingsActions';
import * as fretboardActions from '../actions/fretboardActions';

import '../styles/application.scss'

const App = ({
  createFretboard,
  fretboards,
  sidebarOpen,
  setSidebarOpen,
  settingsId,
}) => {
  function onSetSidebarOpen(event) {
    setSidebarOpen(event.value.checked);
  }

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
      sidebar={<ControlPanel {...fretboards[settingsId]}/>}
    >
      <Header />
      <Container>
        <Row>
          <Col>
            {
              Object.keys(fretboards).map(id => (
                <FretboardSection key={id} id={id} />
              ))
            }
            <ButtonToolbar>
              <Button className="btn-sm btn-light">
                <span className="oi oi-plus" onClick={createFretboard}></span>
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
      </Container>
    </Sidebar>
  );
}

function mapStateToProps(state) {
  return {
    fretboards: state.fretboards,
    ...state.settings,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators(settingsActions, dispatch),
    ...bindActionCreators(fretboardActions, dispatch),
  }}

export default connect(mapStateToProps, mapDispatchToProps)(App);
