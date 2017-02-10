import React from 'react';
import Marker from './Marker.jsx'

class String extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isLit: false,
      isMarked: false
    }
  }

  render() {
    const marker = this.state.isMarked ?
      <Marker xOffset={this.props.xOffset} 
        yOffset={this.props.yOffset} 
        fretWidth={this.props.fretWidth} 
        isLit = {this.state.isLit} /> : 
      null;

    return (
      <g>
        <line fill="none"
          stroke="#000000"
          x1={this.props.xOffset}
          x2={this.props.xOffset + this.props.fretWidth}
          y2={this.props.yOffset}
          y1={this.props.yOffset}
          className={`string-${this.props.idx}`} />
        { marker }
      </g>
      );
  }
}

String.propTypes = {
  fretWidth: React.PropTypes.number.isRequired,
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired
}

export default String;
