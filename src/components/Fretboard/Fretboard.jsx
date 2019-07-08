import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Fret from './Fret';
import String from './String';

const MARGIN = 50;

const Fretboard = ({
  current,
  filterEnd,
  filterStart,
  fretCount,
  litNotes,
  sequence,
  sequenceEnabled,
  startingFret,
  tuning,
}) => {

  function getWidth() {
    return (calcWidth(fretCount)) + (MARGIN * 2);
  }

  function getHeight() {
    return (String.height * stringCount()) + (MARGIN * 2);
  }

  function calcWidth(idx) {
    if (idx === 0) {
      return Fret.baseWidth;
    }

    return calcWidth(idx - 1) + Fret.calcWidth(idx);
  }

  function stringCount() {
    return tuning.length;
  }

  const frets = [];
  for (let i = 0; i < fretCount; i += 1) {
    const fret = (
      <Fret
        key={i}
        idx={i}
        fretNumber={startingFret + i}
        fretboardMargin={MARGIN}
        tuning={tuning}
        litNotes={litNotes}
        current={current}
        filterStart={filterStart}
        filterEnd={filterEnd}
        sequence={sequence}
        sequenceEnabled={sequenceEnabled}
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

Fretboard.propTypes = {
  current: PropTypes.shape({}),
  filterEnd: PropTypes.number.isRequired,
  filterStart: PropTypes.number.isRequired,
  fretCount: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const mapStateToProps = state => {
  return state;
}

export default connect(mapStateToProps)(Fretboard);
