import React from 'react';

class Label extends React.Component {
  render() {
    return (
      <text fill="#000000"
        x={this.props.xOffset}
        y={this.props.yOffset}
        stroke="#000000"
        strokeWidth="0"
        strokeDasharray="null"
        strokeLinejoin="null"
        strokeLinecap="null"
        fontSize="24"
        fontFamily="serif"
        textAnchor="middle">
        {this.props.children}
      </text>
      );
  }
}

Label.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired
}

export default Label;
