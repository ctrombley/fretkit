import React from 'react';
import Fret from './Fret.jsx'

class Fretboard extends React.Component {
  constructor(props) {
    super(props);

    this.leftMargin = 100;
    this.topMargin = 100;
  }

  render() {
    const frets = [];

    for (var i = 0; i < this.props.fretCount; i++) {
      const fret = <Fret key={i}
        idx={i}
        fretNumber={this.props.startFret + i}
        fretboardLeftMargin={this.leftMargin}
        fretboardTopMargin={this.topMargin} />;

        frets.push(fret);
    }

    return (
      <svg width={this.props.width} height={this.props.height} >
        {frets}
      </svg>
      );
  }
}

Fretboard.propTypes = {
  width: React.PropTypes.string.isRequired,
  height: React.PropTypes.string.isRequired,
  startFret: React.PropTypes.number.isRequired,
  fretCount: React.PropTypes.number.isRequired
};

export default Fretboard;
