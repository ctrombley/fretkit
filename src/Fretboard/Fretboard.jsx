import React from 'react';
import Fret from './Fret.jsx'
import String from './String.jsx'

class Fretboard extends React.Component {
  constructor(props) {
    super(props);

    this.margin = 50;
  }

  getWidth() {
    return (this.props.fretCount * Fret.width) + (this.margin * 2);
  }

  getHeight() {
    const stringCount = this.props.tuning.length;
    return (String.height * stringCount) + (this.margin * 2);
  }

  render() {
    const frets = [];
    for (var i = 0; i < this.props.fretCount; i++) {

      const fret = <Fret key={i} idx={i}
        fretNumber={this.props.startingFret + i}
        fretboardMargin={this.margin}
        tuning={this.props.tuning}
        litNotes={this.props.litNotes}
        current={this.props.current}/>;

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
  current: React.PropTypes.object
};

export default Fretboard;
