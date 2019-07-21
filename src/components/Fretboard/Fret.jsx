import React, { Component } from 'react';
import PropTypes from 'prop-types';

import String from './String';
import Label from './Label';
import FretMarker from './FretMarker';
import Note from '../../lib/Note';

class Fret extends Component {
  static calcWidth(idx) {
    if (idx === 0) {
      return 0;
    }

    if (idx === 1) {
      return this.baseWidth;
    }

    return Math.round(Fret.calcWidth(idx - 1) * 0.944);
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
    return String.height * (this.stringCount - 1);
  }

  get stringCount() {
    return this.props.tuning.length;
  }

  get width() {
    const fretNumber = this.props.fretNumber;

    if (fretNumber === 0) {
      return 0;
    }

    if (fretNumber === 1) {
      return Fret.baseWidth;
    }

    return Fret.calcWidth(fretNumber - 1);
  }

  xOffset() {
    const {
      fretboardMargin,
      fretNumber
    } = this.props;

    return fretboardMargin + this.calcXOffset(fretNumber);
  }

  calcXOffset(fretNumber) {
    if (fretNumber === 0 || fretNumber === this.props.startingFret) {
      return 0;
    }

    const value = Fret.calcWidth(fretNumber - 1) + this.calcXOffset(fretNumber - 1);
    return value;
  }

  isFirst() {
    return this.props.idx === 1;
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
      sequence,
      sequenceEnabled,
      tuning,
    } = this.props;

    const reversedTuning = tuning.slice().reverse();
    const strings = reversedTuning.map((t, i) => {
      const openNote = new Note(t);
      const yOffset = fretboardMargin + (String.height * i);
      return (
        <String
          current={current}
          fretIdx={idx}
          fretWidth={this.width}
          idx={i}
          key={t} // TODO: this can break if two strings have the same note
          litNotes={litNotes}
          note={openNote.add(fretNumber)}
          sequence={sequence}
          sequenceEnabled={sequenceEnabled}
          stringCount={this.stringCount}
          xOffset={this.xOffset()}
          yOffset={yOffset}
        />
      );
    });

    const fretNumberLabelPadding = 20;
    const fretNumberLabel = (
      <Label
        xOffset={this.xOffset() + fretNumberLabelPadding}
        yOffset={fretboardMargin - fretNumberLabelPadding}
      > {fretNumber}
      </Label>
    );

    const fretMarkerType = this.fretMarkerType();
    const fretMarker = fretMarkerType && (
      <FretMarker
        xOffset={this.xOffset()}
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
          x1={this.xOffset()}
          x2={this.xOffset()}
          y1={fretboardMargin}
          y2={fretboardMargin + this.getHeight()}
        /> {strings}
      </g>
    );
  }
}

Fret.propTypes = {
  current: PropTypes.shape({}),
  fretNumber: PropTypes.number.isRequired,
  fretboardMargin: PropTypes.number.isRequired,
  idx: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.arrayOf(PropTypes.string).isRequired,
};

Fret.defaultProps = {
  current: null,
  sequence: null,
};

export default Fret;
