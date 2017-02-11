import React from 'react';

class StringMarker extends React.Component {
  constructor(props) {
    super(props)

    this.radius = 8;

    this.getClassName = this.getClassName.bind(this);
  }

  getClassName() {
    return `string__marker-${this.props.type}`;
  }

  render() {
    const xOffset = this.props.xOffset + this.props.fretWidth / 2;

    return (
      <circle
        cx={xOffset}
        cy={this.props.yOffset}
        r={this.radius}
        className={`string__marker ${this.getClassName()}`}/>
      );
  }
}

StringMarker.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  type: React.PropTypes.string.isRequired
}

export default StringMarker;
