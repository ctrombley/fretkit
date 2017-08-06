import React from 'react';

const Label = props => (
  <text
    className="label"
    x={props.xOffset}
    y={props.yOffset}
  > {props.children}
  </text>
);

Label.propTypes = {
  children: React.PropTypes.node.isRequired,
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
};

export default Label;
