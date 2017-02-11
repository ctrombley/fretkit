import React from 'react';

class Label extends React.Component {
  render() {
    return (
      <text className='label' x={this.props.xOffset} y={this.props.yOffset}>
        {this.props.children}
      </text>
      );
  }
}

Label.propTypes = {
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  children: React.PropTypes.node.isRequired
}

export default Label;
