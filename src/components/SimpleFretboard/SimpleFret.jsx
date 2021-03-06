import React, { Component } from 'react';
import PropTypes from 'prop-types';

import SimpleString from './SimpleString';
import SimpleLabel from './SimpleLabel';
import SimpleFretMarker from './SimpleFretMarker';
import Note from '../../lib/Note';

class SimpleFret extends Component {
  static calcWidth(idx) {
    if (idx === 0) {
      return this.baseWidth;
    }

    return Math.round(SimpleFret.calcWidth(idx - 1) * 0.944);
  }

  static get baseWidth() {
    return 80;
  }

  constructor(props) {
    super(props);

    this.singleMarkerFrets = [3, 5, 7, 9, 15, 17, 19, 21]; // 1-based
    this.doubleMarkerFrets = [12, 24]; // 1-based
  }

  getHeight() {
    return SimpleString.height * (this.stringCount - 1);
  }

  get stringCount() {
    return this.props.tuning.length;
  }

  get width() {
    return SimpleFret.calcWidth(this.props.fretNumber - 1);
  }

  calcXOffset(idx) {
    if (idx === this.props.startingFret - 1) {
      return 0;
    }

    return this.calcXOffset(idx - 1) + SimpleFret.calcWidth(idx - 1);
  }

  isFirst() {
    return this.props.idx === 0;
  }

  fretMarkerType() {
    const { fretNumber } = this.props;

    if (this.singleMarkerFrets.includes(fretNumber)) {
      return 'single';
    } else if (this.doubleMarkerFrets.includes(fretNumber)) {
      return 'double';
    }

    return null;
  }

  render() {
    const {
      current,
      fretboardMargin,
      fretNumber,
      idx,
      litNotes,
      tuning,
    } = this.props;
    const xOffset = fretboardMargin + this.calcXOffset(fretNumber - 1);

    const reversedTuning = tuning.slice().reverse();
    const strings = reversedTuning.map((t, i) => {
      const openNote = new Note(t);
      const yOffset = fretboardMargin + (SimpleString.height * i);
      return (
        <SimpleString
          current={current}
          fretIdx={idx}
          fretWidth={this.width}
          idx={i}
          key={t} // TODO: this can break if two strings have the same note
          litNotes={litNotes}
          note={openNote.add(fretNumber)}
          stringCount={this.stringCount}
          xOffset={xOffset}
          yOffset={yOffset}
        />
      );
    });

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = (
      <SimpleLabel
        xOffset={xOffset + fretNumberLabelPadding}
        yOffset={fretboardMargin - fretNumberLabelPadding}
      > {fretNumber}
      </SimpleLabel>
    );

    const fretMarkerType = this.fretMarkerType();
    const fretMarker = fretMarkerType && (
      <SimpleFretMarker
        xOffset={xOffset}
        yOffset={fretboardMargin}
        fretWidth={this.width}
        fretHeight={this.getHeight()}
        type={fretMarkerType}
      />
    );

    return (
      <g className="fret">
        {this.isFirst() ? fretNumberLabel : null}
        {fretMarker}
        <line
          className="fret__wire"
          x1={xOffset}
          x2={xOffset}
          y1={fretboardMargin}
          y2={fretboardMargin + this.getHeight()}
        /> {strings}
      </g>
    );
  }
}

SimpleFret.propTypes = {
  fretNumber: PropTypes.number.isRequired,
  fretboardMargin: PropTypes.number.isRequired,
  idx: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SimpleFret;
