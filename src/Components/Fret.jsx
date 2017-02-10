import React from 'react';
import String from './String.jsx'
import Label from './Label.jsx'
import FretMarker from './FretMarker.jsx'

class Fret extends React.Component {
  constructor(props) {
    super(props);

    this.stringCount = 6;
    this.width = 80;
    this.height = String.height * (this.stringCount - 1);
    this.singleMarkerFrets = [3,5,7,9,15,17,19,21] // 1-based
    this.doubleMarkerFrets = [12,24] // 1-based
  }

  isFirst() {
    return this.props.idx === 0;
  }

  fretMarkerType() {
    if (this.singleMarkerFrets.includes(this.props.fretNumber)) {
      return 'single';
    } else if (this.doubleMarkerFrets.includes(this.props.fretNumber)) {
      return 'double';
    } else {
      return null;
    }
  }

  render() {
    const xOffset = this.props.fretboardLeftMargin + this.width * this.props.idx;
    const strings = [];

    for (var i = 0; i < this.stringCount; i++) {
      const yOffset = this.props.fretboardTopMargin + String.height * i;
      const string = <String key={i}
        idx={i}
        yOffset={yOffset}
        xOffset={xOffset}
        fretWidth={this.width} 
        fretIdx={this.props.idx}/>

      strings.push(string);
    }

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = <Label xOffset={xOffset + fretNumberLabelPadding}
      yOffset={this.props.fretboardTopMargin - fretNumberLabelPadding}>
      {this.props.fretNumber}
    </Label>;

    const fretMarkerType = this.fretMarkerType();
    const fretMarker = !!fretMarkerType ?
      <FretMarker xOffset={xOffset}
        yOffset={this.props.fretboardTopMargin}
        fretWidth={this.width}
        fretHeight={this.height} 
        type={fretMarkerType}/> :
        null;

    return (
      <g>
        {this.isFirst() ? fretNumberLabel : null}
        {fretMarker}
        <line fill="none"
          stroke="#000000"
          x1={xOffset}
          x2={xOffset}
          y1={this.props.fretboardTopMargin}
          y2={this.props.fretboardTopMargin + this.height}/>
        {strings}
      </g>
      );
  }
}

Fret.propTypes = {
  fretboardLeftMargin: React.PropTypes.number.isRequired,
  fretboardTopMargin: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired,
  fretNumber: React.PropTypes.number.isRequired
}

export default Fret;
