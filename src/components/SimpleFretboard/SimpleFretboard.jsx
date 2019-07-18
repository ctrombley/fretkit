import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import SimpleFret from './SimpleFret';
import SimpleString from './SimpleString';

const MARGIN = 50;

const SimpleFretboard = ({
  fretCount,
  litNotes,
  startingFret,
  tuning,
}) => {

  function getWidth() {
    return (calcWidth(fretCount)) + (MARGIN * 2);
  }

  function getHeight() {
    return (SimpleString.height * stringCount()) + (MARGIN * 2);
  }

  function stringCount() {
    return tuning.length;
  }

  function calcWidth(idx) {
    if (!idx) { return SimpleFret.baseWidth; }

    if (idx === 0) {
      return SimpleFret.baseWidth;
    }

    return calcWidth(idx - 1) + SimpleFret.calcWidth(idx);
  }

  const frets = [];
  for (let i = 0; i < fretCount; i += 1) {
    const fret = (
      <SimpleFret
        key={i}
        idx={i}
        fretNumber={startingFret + i}
        fretboardMargin={MARGIN}
        tuning={tuning}
        litNotes={litNotes}
        startingFret={startingFret}
      />
    );

    frets.push(fret);
  }

  return (
    <svg
      className="fretboard"
      width={getWidth()}
      height={getHeight()}
    >
      {frets}
    </svg>
  )
}

SimpleFretboard.propTypes = {
  current: PropTypes.shape({}),
  fretCount: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.shape({}).isRequired
};

const mapStateToProps = state => {
  return {
    ...state,
    sequence: state.sequences && state.sequences[state.sequenceIdx]
  };
}

export default connect(mapStateToProps)(SimpleFretboard);
