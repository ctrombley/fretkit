import React from 'react';
import PropTypes from 'prop-types';

const SimpleStringMarker = (props) => {
  const { className, fretWidth, xOffset, yOffset } = props;
  const newXOffset = xOffset + (fretWidth / 2);

  return (
    <circle
      cx={newXOffset}
      cy={yOffset}
      className={`string__marker ${className}`}
    />
  );
};

SimpleStringMarker.propTypes = {
  className: PropTypes.string,
  fretWidth: PropTypes.number.isRequired,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

SimpleStringMarker.defaultProps = {
  className: '',
};

export default SimpleStringMarker;
