import React from 'react';

class FretMarker extends React.Component {
  constructor(props) {
    super(props)

    this.radius = 10;
  }

  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;

    const singleMarker = (
      <circle fill='#dddddd'
        cx={xOffset}
        cy={this.props.yOffset + this.props.fretHeight / 2}
        r={this.radius}
        className='marker'/>
      );

    const doubleMarker = (
      <g>
        <circle fill='#dddddd'
          cx={xOffset}
          cy={this.props.yOffset + this.props.fretHeight / 5}
          r={this.radius}
          className='marker'/>
        <circle fill='#dddddd'
          cx={xOffset}
          cy={this.props.yOffset + 4 * this.props.fretHeight / 5}
          r={this.radius}
          className='marker'/>
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
