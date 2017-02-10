import React from 'react';

class Marker extends React.Component {
  constructor(props) {
    super(props)

    this.radius = 10;
  }

  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;
    const fill = this.props.isLit ? '#ff0000' :
      this.props.isPreview ? '#aaaaaa': '#000000';

    return (
      <circle fill={fill}
        cx={xOffset}
        cy={this.props.yOffset}
        r={this.radius}
        className='marker'/>
      );
  }
}

Marker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  isLit: React.PropTypes.bool,
  isPreview: React.PropTypes.bool
}

export default Marker;
