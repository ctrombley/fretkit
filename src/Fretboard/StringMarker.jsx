import React, { Component } from 'react';

class StringMarker extends Component {
  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;

    return (
      <circle
        cx={xOffset}
        cy={this.props.yOffset}
        className={`string__marker ${this.props.className || ''}`}/>
      );
  }
}

StringMarker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  className: React.PropTypes.string
}

export default StringMarker;
