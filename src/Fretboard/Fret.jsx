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

  static get baseWidth() {
    return 80;
  }

  static calcWidth(idx) {
    if (idx === 0) {
      return this.baseWidth;
    } else {
      return Math.round(Fret.calcWidth(idx-1) * 0.944);
    }
  }

  calcXOffset(idx) {
    if (idx === 0) {
      return 0;
    } else {
      return this.calcXOffset(idx-1) + Fret.calcWidth(idx-1);
    }
  }

  get width() {
    return Fret.calcWidth(this.props.idx);
  }

  get stringCount() {
    return this.props.tuning.length;
  }

  getHeight() {
    return String.height * (this.stringCount - 1);
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
    const xOffset = this.props.fretboardMargin + this.calcXOffset(this.props.fretNumber-1);

    const reversedTuning = this.props.tuning.slice().reverse();
    const strings = reversedTuning.map((t, i) => {
      const openNote = new Note(t);
      const yOffset = this.props.fretboardMargin + String.height * i;
      return (
        <String
          key={i}
          idx={i}
          note={openNote.add(this.props.fretNumber)}
          yOffset={yOffset}
          xOffset={xOffset}
          fretWidth={this.width}
          fretIdx={this.props.idx}
          stringCount={this.stringCount}
          litNotes={this.props.litNotes}
          current={this.props.current}
          filterStart={this.props.filterStart}
          filterEnd={this.props.filterEnd}
          sequence={this.props.sequence}
          sequenceEnabled={this.props.sequenceEnabled}
        />
      );
    })

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = (
      <Label
        xOffset={xOffset + fretNumberLabelPadding}
        yOffset={this.props.fretboardMargin - fretNumberLabelPadding}
      > {this.props.fretNumber}
      </Label>
    );

    const fretMarkerType = this.fretMarkerType();
    const fretMarker = fretMarkerType && (
      <FretMarker
        xOffset={xOffset}
        yOffset={this.props.fretboardMargin}
        fretWidth={this.width}
        fretHeight={this.getHeight()}
        type={fretMarkerType}
      />
    );

    return (
      <g className='fret'>
        {this.isFirst() ? fretNumberLabel : null}
        {fretMarker}
        <line
          className='fret__wire'
          x1={xOffset} x2={xOffset}
          y1={this.props.fretboardMargin}
          y2={this.props.fretboardMargin + this.getHeight()}/>
        {strings}
      </g>
    );
  }
}

Fret.propTypes = {
  current: React.PropTypes.object,
  filterEnd: React.PropTypes.number,
  filterStart: React.PropTypes.number,
  fretNumber: React.PropTypes.number.isRequired,
  fretboardMargin: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired,
  litNotes: React.PropTypes.array,
  sequence: React.PropTypes.object,
  sequenceEnabled: React.PropTypes.bool,
  tuning: React.PropTypes.array.isRequired
}

export default Fret;
