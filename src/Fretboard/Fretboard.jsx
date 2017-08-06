import React from 'react';
import PropTypes from 'prop-types';

import Fret from './Fret';
import String from './String';

class Fretboard extends React.Component {
  constructor(props) {
    super(props);

    this.margin = 50;
  }

  getWidth() {
    return (this.calcWidth(this.props.fretCount)) + (this.margin * 2);
  }

  getHeight() {
    return (String.height * this.stringCount) + (this.margin * 2);
  }

  calcWidth(idx) {
    if (idx === 0) {
      return Fret.baseWidth;
    }

    return this.calcWidth(idx - 1) + Fret.calcWidth(idx);
  }

  get stringCount() {
    return this.props.tuning.length;
  }

  render() {
    const {
      current,
      filterEnd,
      filterStart,
      fretCount,
      litNotes,
      sequence,
      sequenceEnabled,
      startingFret,
      tuning,
    } = this.props;
    const frets = [];
    for (let i = 0; i < fretCount; i += 1) {
      const fret = (
        <Fret
          key={i}
          idx={i}
          fretNumber={startingFret + i}
          fretboardMargin={this.margin}
          tuning={tuning}
          litNotes={litNotes}
          current={current}
          filterStart={filterStart}
          filterEnd={filterEnd}
          sequence={sequence}
          sequenceEnabled={sequenceEnabled}
          startingFret={this.props.startingFret}
        />
      );

      frets.push(fret);
    }

    return (
      <svg
        className="fretboard"
        width={this.getWidth()}
        height={this.getHeight()}
      > {frets}
      </svg>
    );
  }
}

Fretboard.propTypes = {
  current: PropTypes.shape({}).isRequired,
  filterEnd: PropTypes.number.isRequired,
  filterStart: PropTypes.number.isRequired,
  fretCount: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  sequence: PropTypes.shape({}).isRequired,
  sequenceEnabled: PropTypes.bool.isRequired,
  startingFret: PropTypes.number.isRequired,
  tuning: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default Fretboard;
