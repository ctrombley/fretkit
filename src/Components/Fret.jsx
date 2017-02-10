import React from 'react';
import String from './String.jsx'
import Label from './Label.jsx'

class Fret extends React.Component {
  constructor(props) {
    super(props);

    this.width = 100;
    this.stringHeight = 20;
    this.stringCount = 6;
    this.fretHeight = this.stringHeight * (this.stringCount - 1);
  }

  isFirst() {
    return this.props.idx === 0;
  }

  render() {
    const xOffset = this.props.fretboardLeftMargin + this.width * this.props.idx;
    const strings = [];

    for (var i = 0; i < this.stringCount; i++) {
      const yOffset = this.props.fretboardTopMargin + this.stringHeight * i;
      const string = <String key={i}
        idx={i}
        yOffset={yOffset}
        xOffset={xOffset}
        fretWidth={this.width} />

      strings.push(string);
    }

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = <Label xOffset={xOffset + fretNumberLabelPadding}
      yOffset={this.props.fretboardTopMargin - fretNumberLabelPadding}>
      {this.props.fretNumber}
    </Label>;

    return (
      <g>
        {this.isFirst() ? fretNumberLabel : null}
        <line fill="none" stroke="#000000" x1={xOffset} x2={xOffset} y1={this.props.fretboardTopMargin} y2={this.props.fretboardTopMargin + this.fretHeight}/>
        {strings}
      </g>
      );
  }
}

Fret.propTypes = {
  fretboardLeftMargin: React.PropTypes.number.isRequired,
  fretboardTopMargin: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired,
  fretNumber: React.PropTypes.number.isRequired,
}

export default Fret;
