import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from 'react-transition-group';

import Note from '../../lib/Note';
import musicbox from '../../lib/musicbox';
import StringMarker from './StringMarker';

class String extends Component {
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
    if (this.state.isMarked) {
      this.play();
    } else {
      this.stopPlaying();
    }
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

  play() {
    this.playing = musicbox.play(this.props.note.frequency);
  }

  stopPlaying() {
    if (this.playing) {
      this.playing.stop();
    }
  }

  isLit() {
    const {
      litNotes,
      note,
      sequence,
      sequenceEnabled,
    } = this.props;
    if (sequenceEnabled && sequence) {
      return !!sequence.stringNotes.filter(stringNote => (
        stringNote.semitones === note.semitones &&
        stringNote.string === this.stringNumber
      )).length;
    }

    const litNoteSemitones = litNotes.map(n => n.baseSemitones);
    return litNoteSemitones.includes(note.baseSemitones);
  }

  isRoot() {
    const { current, note } = this.props;
    return current && current.root &&
      current.root.semitones === note.baseSemitones;
  }

  registerOverlay(ref) {
    this.overlay = ref;
  }

  render() {
    const { fretIdx, fretWidth, xOffset, yOffset } = this.props;
    const marker = this.state.isMarked ? (
      <StringMarker
        fretWidth={fretWidth}
        key="marker"
        xOffset={xOffset}
        yOffset={yOffset}
      />
    ) : null;

    const litMarker = (this.isLit()) ? (
      <StringMarker
        className={`string__marker-lit ${this.isRoot() ? 'string__marker-root' : ''}`}
        fretWidth={fretWidth}
        isNut={fretIdx === 0}
        key="litMarker"
        xOffset={xOffset}
        yOffset={yOffset}
      />
    ) : null;

    const previewMarker = this.state.isPreview ? (
      <StringMarker
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
        <CSSTransitionGroup
          component="g"
          transitionEnterTimeout={100}
          transitionLeaveTimeout={100}
          transitionName="string__marker"
        >
          { litMarker }
          { marker }
        </CSSTransitionGroup>
        { previewMarker }
        <rect
          className="string__overlay"
          height={String.height}
          ref={this.registerOverlay}
          width={fretWidth}
          x={xOffset}
          y={yOffset - (String.height / 2)}
        />
      </g>
    );
  }
}

String.propTypes = {
  current: PropTypes.shape({}),
  fretIdx: PropTypes.number.isRequired,
  fretWidth: PropTypes.number.isRequired,
  idx: PropTypes.number.isRequired,
  litNotes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  note: PropTypes.instanceOf(Note).isRequired,
  sequence: PropTypes.shape({}),
  sequenceEnabled: PropTypes.bool.isRequired,
  stringCount: PropTypes.number.isRequired,
  xOffset: PropTypes.number.isRequired,
  yOffset: PropTypes.number.isRequired,
};

String.defaultProps = {
  current: null,
  sequence: null,
};

export default String;
