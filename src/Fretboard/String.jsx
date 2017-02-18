import React, { Component } from 'react';
import Note from '../lib/Note.js'
import musicbox from '../lib/musicbox.js'
import StringMarker from './StringMarker.jsx'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

class String extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isMarked: false,
      isPreview: false
    }

    this.toggleMarked = this.toggleMarked.bind(this);
    this.enablePreview = this.enablePreview.bind(this);
    this.disablePreview = this.disablePreview.bind(this);
    this.registerOverlay = this.registerOverlay.bind(this);
    this.showMarker = this.showMarker.bind(this);
    this.isLit = this.isLit.bind(this);
  }

  static get height() {
    return 20;
  }

  showMarker() {
    return this.isLit() || this.isMarked();
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
    const litNoteSemitones = this.props.litNotes.map(n => n.baseSemitones);
    return litNoteSemitones.includes(this.props.note.baseSemitones);
  }

  isVisible() {
    return this.props.filterStart-1 <= this.props.fretIdx && 
      this.props.filterEnd-1 >= this.props.fretIdx;
  }

  isRoot() {
    return this.props.current && this.props.current.root && 
      this.props.current.root.semitones === this.props.note.baseSemitones;

  }

  componentDidMount() {
    this.overlay.addEventListener('click', this.toggleMarked);
    this.overlay.addEventListener('mouseover', this.enablePreview);
    this.overlay.addEventListener('mouseout', this.disablePreview);
  }

  componentWillUnmount(){
    this.overlay.removeEventListener('click', this.toggleMarked);
    this.overlay.removeEventListener('mouseover', this.enablePreview);
    this.overlay.removeEventListener('mouseout', this.disablePreview);
  }

  registerOverlay(ref) {
    this.overlay = ref;
  }

  render() {
    const marker = this.state.isMarked ?
      <StringMarker key='marker'
        xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth} /> :
      null;

    const litMarker = (this.isLit() && this.isVisible()) ?
      <StringMarker key='litMarker'
        xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth}
        className={`string__marker-lit ${this.isRoot() ? 'string__marker-root' : ''}`}/> :
      null;

    const previewMarker = this.state.isPreview ?
      <StringMarker key='previewMarker'
        xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth}
        className='string__marker-preview'/> :
      null;

    return (
      <g className={`string string-${this.props.idx}`}>
        <line className='string__line'
          x1={this.props.xOffset}
          x2={this.props.xOffset + this.props.fretWidth}
          y2={this.props.yOffset}
          y1={this.props.yOffset}
          />
        <ReactCSSTransitionGroup
            transitionName='string__marker'
            transitionEnterTimeout={100}
            transitionLeaveTimeout={100}
            component='g'>
          { litMarker }
          { marker }
        </ReactCSSTransitionGroup>
        { previewMarker }
        <rect height={String.height}
          ref={this.registerOverlay}
          width={this.props.fretWidth}
          x={this.props.xOffset}
          y={this.props.yOffset - String.height / 2} 
          className='string__overlay'/>
      </g>
      );
  }
}

String.propTypes = {
  fretIdx: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired,
  note: React.PropTypes.instanceOf(Note).isRequired,
  current: React.PropTypes.object,
  litNotes: React.PropTypes.array,
  filterStart: React.PropTypes.number,
  filterEnd: React.PropTypes.number

}

export default String;
