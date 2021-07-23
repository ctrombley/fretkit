import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup } from 'react-transition-group';

import Note from '../../lib/Note';
import SimpleStringMarker from './SimpleStringMarker';

class SimpleString extends Component {
  static get height() {
    return 20;
  }

  constructor(props) {
    super(props);

    this.state = {
      isMarked: false,
      isPreview: false,
    };

    this.toggleMarked = this.toggleMarked.bind(this);
    this.enablePreview = this.enablePreview.bind(this);
    this.disablePreview = this.disablePreview.bind(this);
    this.registerOverlay = this.registerOverlay.bind(this);
    this.isLit = this.isLit.bind(this);
  }

  componentDidMount() {
    this.overlay.addEventListener('click', this.toggleMarked);
    this.overlay.addEventListener('mouseover', this.enablePreview);
    this.overlay.addEventListener('mouseout', this.disablePreview);
  }

  componentWillUnmount() {
    this.overlay.removeEventListener('click', this.toggleMarked);
    this.overlay.removeEventListener('mouseover', this.enablePreview);
    this.overlay.removeEventListener('mouseout', this.disablePreview);
  }

  get stringNumber() {
    const { idx, stringCount } = this.props;
    return (stringCount - 1) - idx;
  }

  toggleMarked() {
    this.setState({ isMarked: !this.state.isMarked });
  }

  enablePreview() {
    if (!this.state.isPreview) {
      this.setState({ isPreview: true });
    }
  }

  disablePreview() {
    if (this.state.isPreview) {
      this.setState({ isPreview: false });
    }
  }

  isLit() {
    const {
      litNotes,
      note,
    } = this.props;

    const litNoteSemitones = litNotes.map(n => n.baseSemitones);
    return litNoteSemitones.includes(note.baseSemitones);
  }

  registerOverlay(ref) {
    this.overlay = ref;
  }

  render() {
    const { fretWidth, xOffset, yOffset } = this.props;
    const marker = this.state.isMarked ? (
      <SimpleStringMarker
        fretWidth={fretWidth}
        key="marker"
        xOffset={xOffset}
        yOffset={yOffset}
      />
    ) : null;

    const litMarker = (this.isLit()) ? (
      <SimpleStringMarker
        className="string__marker-lit"
        fretWidth={fretWidth}
        key="litMarker"
        xOffset={xOffset}
        yOffset={yOffset}
      />
    ) : null;

    const previewMarker = this.state.isPreview ? (
      <SimpleStringMarker
        className="string__marker-preview"
        fretWidth={fretWidth}
        key="previewMarker"
        xOffset={xOffset}
        yOffset={yOffset}
      />
    ) : null;

    return (
      <g className={`string string-${this.props.idx}`}>
        <line
          className="string__line"
          x1={xOffset}
          x2={xOffset + fretWidth}
          y1={yOffset}
          y2={yOffset}
        />
        <TransitionGroup
          component="g"
          transitionEnterTimeout={100}
          transitionLeaveTimeout={100}
          transitionName="string__marker"
        >
          { litMarker }
          { marker }
        </TransitionGroup>
        { previewMarker }
        <rect
          className="string__overlay"
          height={SimpleString.height}
          ref={this.registerOverlay}
          width={fretWidth}
          x={xOffset}
          y={yOffset - (SimpleString.height / 2)}
        />
      </g>
    );
  }
}

SimpleString.propTypes = {
  fretIdx: PropTypes.number.isRequired,
  fretWidth: PropTypes.number.isRequired,
  idx: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  note: PropTypes.instanceOf(Note).isRequired,
  stringCount: PropTypes.number.isRequired,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

export default SimpleString;
