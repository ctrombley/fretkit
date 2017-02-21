import React, { Component } from 'react';
import String from './String.jsx';
import Label from './Label.jsx';
import FretMarker from './FretMarker.jsx';
import Note from '../lib/Note.js';

class Fret extends Component {
  constructor(props) {
    super(props);

    this.singleMarkerFrets = [3,5,7,9,15,17,19,21] // 1-based
    this.doubleMarkerFrets = [12,24] // 1-based
  }

  static get width() {
    return 80;
  }

  getHeight() {
    const stringCount = this.props.tuning.length;
    return String.height * (stringCount - 1);
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
    const xOffset = this.props.fretboardMargin + Fret.width * this.props.idx;

    const reversedTuning = this.props.tuning.slice().reverse();
    const strings = reversedTuning.map((t, i) => {
      const openNote = new Note(t);
      const yOffset = this.props.fretboardMargin + String.height * i;
      return <String key={i} idx={i}
        note={openNote.add(this.props.fretNumber)}
        yOffset={yOffset}
        xOffset={xOffset}
        fretWidth={Fret.width}
        fretIdx={this.props.idx}
        litNotes={this.props.litNotes}
        current={this.props.current}
        filterStart={this.props.filterStart}
        filterEnd={this.props.filterEnd}
        sequences={this.props.sequences}/>;
    })

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = <Label xOffset={xOffset + fretNumberLabelPadding}
      yOffset={this.props.fretboardMargin - fretNumberLabelPadding}>
      {this.props.fretNumber}
    </Label>;

    const fretMarkerType = this.fretMarkerType();
    const fretMarker = fretMarkerType ?
      <FretMarker xOffset={xOffset}
        yOffset={this.props.fretboardMargin}
        fretWidth={Fret.width}
        fretHeight={this.getHeight()}
        type={fretMarkerType}/> :
        null;

    return (
      <g className='fret'>
        {this.isFirst() ? fretNumberLabel : null}
        {fretMarker}
        <line className='fret__wire'
          x1={xOffset} x2={xOffset}
          y1={this.props.fretboardMargin}
          y2={this.props.fretboardMargin + this.getHeight()}/>
        {strings}
      </g>
      );
  }
}

Fret.propTypes = {
  fretboardMargin: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired,
  fretNumber: React.PropTypes.number.isRequired,
  tuning: React.PropTypes.array.isRequired,
  litNotes: React.PropTypes.array,
  current: React.PropTypes.object,
  filterStart: React.PropTypes.number,
  filterEnd: React.PropTypes.number,
  sequences: React.PropTypes.array
}

export default Fret;
