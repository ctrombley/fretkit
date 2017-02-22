import React, { Component } from 'react';
import Label from './Label.jsx';

class StringMarker extends Component {
  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;
    const label = this.props.label ?
        <Label xOffset={xOffset} yOffset={this.props.yOffset}> {this.props.label} </Label> : '';

    return (
      <g>
        <circle
          cx={xOffset}
          cy={this.props.yOffset}
          className={`string__marker ${this.props.className || ''}`}/>
        { label }
      </g>
    );
  }
}

StringMarker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  className: React.PropTypes.string,
  label: React.PropTypes.string
}

export default StringMarker;
