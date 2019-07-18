import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

const Header = props => (
  <Navbar bg="light" expand="lg">
    <Navbar.Brand href="#home">Fretkit</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="mr-auto">
        <Nav.Link href="#home">Home</Nav.Link>
        <Nav.Link href="#explore">Explore</Nav.Link>
        <Nav.Link href="#notate">Notate</Nav.Link>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default Header;
