import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Fret from './Fret';
import String from './String';

const MARGIN = 50;

const Fretboard = ({
  current,
  fretCount,
  litNotes,
  sequences,
  sequenceEnabled,
  sequenceIdx,
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
    if (!idx) { return Fret.baseWidth; }

    if (idx === 1) {
      return Fret.baseWidth;
    }

    return calcWidth(idx - 1) + Fret.calcWidth(idx);
  }

  function stringCount() {
    return tuning.length;
  }

  const frets = [];
  const nut = <Fret
        key={0}
        idx={0}
        fretNumber={0}
        fretboardMargin={MARGIN}
        tuning={tuning}
        litNotes={litNotes}
        current={current}
        sequence={sequences[sequenceIdx]}
        sequenceEnabled={sequenceEnabled}
        startingFret={startingFret}
      />;

  for (let i = 0; i < fretCount; i += 1) {
    const fret = (
      <Fret
        key={i+1}
        idx={i+1}
        fretNumber={startingFret + i}
        fretboardMargin={MARGIN}
        tuning={tuning}
        litNotes={litNotes}
        current={current}
        sequence={sequences[sequenceIdx]}
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
      {nut}
      {frets}
    </svg>
  )
}

Fretboard.propTypes = {
  current: PropTypes.shape({}),
  fretCount: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const mapStateToProps = state => (state);

export default connect(mapStateToProps)(Fretboard);
