import React from 'react';

class FretMarker extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;

    const singleMarker = (
      <circle className='fret__marker fret__marker-single'
        cx={xOffset}
        cy={this.props.yOffset + this.props.fretHeight / 2}
        r={this.radius} />
      );

    const doubleMarker = (
      <g className='fret__marker fret__marker-double'>
        <circle cx={xOffset}
          cy={this.props.yOffset + this.props.fretHeight / 5} />
        <circle cx={xOffset}
          cy={this.props.yOffset + 4 * this.props.fretHeight / 5} />
      </g>
      );

    return (
      <g>
      {this.props.type === 'single' ? singleMarker : null}
      {this.props.type === 'double' ? doubleMarker : null}
      </g>
    );
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
