import React from 'react';
import Note from '../lib/Note.js'
import StringMarker from './StringMarker.jsx'

class String extends React.Component {
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
    const litNoteSemitones = this.props.litNotes.map(n => n.baseSemitones);
    return litNoteSemitones.includes(this.props.note.baseSemitones);
  }

  isRoot() {
    
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
      <StringMarker xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth} /> :
      null;

    const litMarker = this.isLit() ?
      <StringMarker xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth}
        className='string__marker-lit'/> :
      null;

    const previewMarker = this.state.isPreview ?
      <StringMarker xOffset={this.props.xOffset}
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
        { litMarker }
        { marker }
        { previewMarker }
        <rect height={String.height}
          ref={this.registerOverlay}
          width={this.props.fretWidth}
          x={this.props.xOffset}
          y={this.props.yOffset - String.height / 2} 
          className="string__overlay"/>
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
  root: React.PropTypes.instanceOf(Note),
  litNotes: React.PropTypes.array,

}

export default String;
