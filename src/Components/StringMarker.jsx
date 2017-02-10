import React from 'react';

class StringMarker extends React.Component {
  constructor(props) {
    super(props)

    this.radius = 8;
    this.previewColor = '#aaaaaa';
    this.markedColor = '#000000';
    this.litColor = '#ff0000';
  }

  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;
    const fill = this.props.isLit ? this.litColor :
      this.props.isPreview ? this.previewColor: this.markedColor;

    return (
      <circle fill={fill}
        cx={xOffset}
        cy={this.props.yOffset}
        r={this.radius}
        className='marker'/>
      );
  }
}

StringMarker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  isLit: React.PropTypes.bool,
  isPreview: React.PropTypes.bool
}

export default StringMarker;
