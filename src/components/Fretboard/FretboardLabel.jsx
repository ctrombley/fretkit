import React from 'react';
import PropTypes from 'prop-types';

const FretboardLabel = ({
    current,
    sequenceEnabled,
    sequences,
    sequenceIdx,
}) => (
  <div className="selected-label">
    {current ? `${current.name} (${current.constructor.name})` : ''}
    {sequenceEnabled && sequences && sequences[sequenceIdx] ?
    ` (${sequenceIdx + 1} / ${sequences.length})` : ''}
  </div>
);

FretboardLabel.propTypes = {
  current: PropTypes.shape({}),
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  sequenceIdx: PropTypes.number,
};

export default FretboardLabel;
