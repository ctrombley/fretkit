import React from 'react';
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
    this.getStringMarkerType = this.getStringMarkerType.bind(this);
    this.isLit = this.isLit.bind(this);
  }

  static get height() {
    return 20;
  }

  showMarker() {
    return !!this.getStringMarkerType();
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
    const litNoteValues = this.props.litNotes.map(n => n.value);
    return litNoteValues.includes(this.props.note % 12);
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

  getStringMarkerType() {
    if (this.isLit()) {
      return 'lit';
    } else if (this.state.isPreview) {
      return 'preview';
    } else if (this.state.isMarked) {
      return 'marked';
    } else {
      return null;
    }
  }

  render() {
    const marker = this.showMarker() ?
      <StringMarker className='string__marker'
        xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth}
        type={this.getStringMarkerType()} /> :
      null;

    return (
      <g className={`string string-${this.props.idx}`}>
        <line className='string__line'
          x1={this.props.xOffset}
          x2={this.props.xOffset + this.props.fretWidth}
          y2={this.props.yOffset}
          y1={this.props.yOffset}
          />
        { marker }
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
  note: React.PropTypes.number.isRequired,
  litNotes: React.PropTypes.array
}

export default String;
