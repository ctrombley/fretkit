import React, { Component } from 'react';

class FretMarker extends Component {
  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;

    const singleMarker = (
      <g className='fret__marker fret__marker-single'>
        <circle cx={xOffset}
          cy={this.props.yOffset + this.props.fretHeight / 2} />
      </g>
      );

    const doubleMarker = (
      <g className='fret__marker fret__marker-double'>
        <circle cx={xOffset}
          cy={this.props.yOffset + this.props.fretHeight / 5} />
        <circle cx={xOffset}
          cy={this.props.yOffset + 4 * this.props.fretHeight / 5} />
      </g>
      );

    if (this.props.type === 'single') {
      return singleMarker;
    } else if (this.props.type === 'double') {
      return doubleMarker;
    } else {
      return null;
    }
  }
}

FretMarker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  fretHeight: React.PropTypes.number.isRequired,
  type: React.PropTypes.string.isRequired
}

export default FretMarker;
