import React from 'react';
import Fret from './Fret.jsx'
import String from './String.jsx'

class Fretboard extends React.Component {
  constructor(props) {
    super(props);

    this.margin = 50;
  }

  get stringCount() {
    return this.props.tuning.length;
  }

  getWidth() {
    return (this.props.fretCount * Fret.width) + (this.margin * 2);
  }

  getHeight() {
    return (String.height * this.stringCount) + (this.margin * 2);
  }

  render() {
    const frets = [];
    for (var i = 0; i < this.props.fretCount; i++) {

      const fret = <Fret key={i} idx={i}
        fretNumber={this.props.startingFret + i}
        fretboardMargin={this.margin}
        tuning={this.props.tuning}
        litNotes={this.props.litNotes}
        current={this.props.current}
        filterStart={this.props.filterStart}
        filterEnd={this.props.filterEnd}
        sequences={this.props.sequences}/>;

      frets.push(fret);
    }

    return (
      <svg className='fretboard'
        width={this.getWidth()}
        height={this.getHeight()} >
        {frets}
      </svg>
      );
  }
}

Fretboard.propTypes = {
  startingFret: React.PropTypes.number.isRequired,
  fretCount: React.PropTypes.number.isRequired,
  tuning: React.PropTypes.array.isRequired,
  litNotes: React.PropTypes.array,
  current: React.PropTypes.object,
  filterStart: React.PropTypes.number,
  filterEnd: React.PropTypes.number,
  sequences: React.PropTypes.array
};

export default Fretboard;
