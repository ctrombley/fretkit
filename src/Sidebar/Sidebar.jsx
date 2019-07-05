import React from 'react'
import { Nav } from 'react-bootstrap'

const Sidebar = ({children}) => {
  return (
    <Nav className="sidebar">
      <div className="sidebar-sticky">
        {children}
      </div>
    </Nav>
  );
}

export default Sidebar;
