import React from 'react';
import PropTypes from 'prop-types';

const StringMarker = (props) => {
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

StringMarker.propTypes = {
  className: PropTypes.string,
  fretWidth: PropTypes.number.isRequired,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

StringMarker.defaultProps = {
  className: '',
};

export default StringMarker;
