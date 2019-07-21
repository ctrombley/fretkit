import React from 'react';
import PropTypes from 'prop-types';

const StringMarker = ({
    className,
    fretWidth,
    isNut,
    xOffset,
    yOffset
}) => {

  let newXOffset = xOffset + (fretWidth / 2);

  if (isNut) {
    newXOffset -= 15;
  }

  return (
    <circle
      cx={newXOffset}
      cy={yOffset}
      className={`string__marker ${className} ${isNut ? 'string__marker-nut' : ''}`}
    />
  );
};

StringMarker.propTypes = {
  className: PropTypes.string,
  fretWidth: PropTypes.number.isRequired,
  isNut: PropTypes.bool,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

StringMarker.defaultProps = {
  className: '',
};

export default StringMarker;
