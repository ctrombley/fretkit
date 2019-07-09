import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, Navbar, Nav } from 'react-bootstrap';

import * as settingsActions from '../actions/settingsActions';

const Header = ({
  toggleSidebar
}) => {

  return (
    <Navbar bg="light" expand="lg">
      <Button onClick={toggleSidebar}>Settings</Button>
      <Navbar.Brand href="#home">
        Fretkit
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#explore">Explore</Nav.Link>
          <Nav.Link href="#notate">Notate</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(settingsActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
