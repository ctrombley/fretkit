import React, { Component } from 'react';
class Transport extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timer: null,
      beat: 1
    }

    this.onBeat = this.onBeat.bind(this);
  }

  componentDidMount() {
    this.setBpmInterval();
  }

  componentWillUnmount() {
    clearInterval(this.state.timer);
    this.setState({ timer: null });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.bpm !== nextProps.bpm) {
      clearInterval(this.state.timer);
      this.setBpmInterval();
    }
  }

  setBpmInterval() {
    this.setState({ timer: setInterval(this.onBeat, 60 * 1000 / this.props.bpm) });
  }

  onBeat() {
    this.setState({
      beat: (this.state.beat % this.props.timeSignature.upper) + 1
    });
  }

  render() {
    return (
      <div className='transport'>
        <p>{this.props.timeSignature.upper}/{this.props.timeSignature.lower}</p>
        <p>
          {this.props.bpm} BPM

          {Array(this.state.beat+1).join('.')}
        </p>
      </div>
    );
  }
}

Transport.propTypes = {
  bpm: React.PropTypes.number.isRequired,
  timeSignature: React.PropTypes.object.isRequired
};

export default Transport;
