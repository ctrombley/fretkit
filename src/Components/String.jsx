import React from 'react';
import StringMarker from './StringMarker.jsx'

class String extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isLit: false,
      isMarked: false,
      isPreview: false
    }

    this.toggleMarked = this.toggleMarked.bind(this);
    this.setPreview = this.setPreview.bind(this);
    this.registerOverlay = this.registerOverlay.bind(this);
    this.showMarker = this.showMarker.bind(this);
  }

  static get height() {
    return 20;
  }

  showMarker() {
    return this.state.isMarked || this.state.isPreview || this.state.isLit;
  }

  toggleMarked() {
    //console.log(`clicked fret ${this.props.fretIdx}, string ${this.props.idx}`)
    this.setState({ isMarked: !this.state.isMarked });
  }

  setPreview(isSet) {
    //console.log(`hovered over fret ${this.props.fretIdx}, string ${this.props.idx}`)
    if (this.state.isPreview !== isSet) {
      this.setState({ isPreview: isSet });
    }
  }

  componentDidMount() {
    this.overlay.addEventListener('click', this.toggleMarked);
    this.overlay.addEventListener('mouseover', () => this.setPreview(true));
    this.overlay.addEventListener('mouseout', () => this.setPreview(false));
  }

  componentWillUnmount(){
    this.overlay.removeEventListener('click');
    this.overlay.removeEventListener('mouseover');
    this.overlay.removeEventListener('mouseout');
  }

  registerOverlay(ref) {
    this.overlay = ref;
  }

  render() {
    const marker = this.showMarker() ?
      <StringMarker xOffset={this.props.xOffset}
        yOffset={this.props.yOffset}
        fretWidth={this.props.fretWidth}
        isPreview={this.state.isPreview}
        isLit = {this.state.isLit} /> :
      null;

    return (
      <g>
        <line fill="none"
          stroke="#000000"
          x1={this.props.xOffset}
          x2={this.props.xOffset + this.props.fretWidth}
          y2={this.props.yOffset}
          y1={this.props.yOffset}
          className={`string-${this.props.idx}`} />
        { marker }
        <rect height={String.height}
          ref={this.registerOverlay}
          fillOpacity="0"
          width={this.props.fretWidth}
          x={this.props.xOffset}
          y={this.props.yOffset - String.height / 2} />
      </g>
      );
  }
}

String.propTypes = {
  fretIdx: React.PropTypes.number.isRequired,
  fretWidth: React.PropTypes.number.isRequired,
  xOffset: React.PropTypes.number.isRequired,
  yOffset: React.PropTypes.number.isRequired,
  idx: React.PropTypes.number.isRequired
}

export default String;
