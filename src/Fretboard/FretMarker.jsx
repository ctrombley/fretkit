import React, { Component } from 'react';

class FretMarker extends Component {
  render() {
    const {
      fretHeight,
      fretWidth,
      xOffset,
      yOffset,
    } = this.props;

    const newXOffset = xOffset + (fretWidth / 2);

    const singleMarker = (
      <g className="fret__marker fret__marker-single">
        <circle
          cx={newXOffset}
          cy={yOffset + (fretHeight / 2)}
        />
      </g>
    );

    const doubleMarker = (
      <g className="fret__marker fret__marker-double">
        <circle
          cx={newXOffset}
          cy={yOffset + (fretHeight / 5)}
        />
        <circle
          cx={newXOffset}
          cy={yOffset + (4 * (fretHeight / 5))}
        />
      </g>
    );

    if (this.props.type === 'single') {
      return singleMarker;
    } else if (this.props.type === 'double') {
      return doubleMarker;
    }

    return null;
  }
}

FretMarker.propTypes = {
  fretHeight: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  type: React.PropTypes.string.isRequired,
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
};

export default FretMarker;
