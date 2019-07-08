import React from 'react';
import PropTypes from 'prop-types';

const Label = props => (
  <text
    className="label"
    x={props.xOffset}
    y={props.yOffset}
  > {props.children}
  </text>
);

Label.propTypes = {
  children: PropTypes.node.isRequired,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

export default Label;
