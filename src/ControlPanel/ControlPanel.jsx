import React, { Component } from 'react';
import { parseList } from '../lib/tones.js';

class ControlPanel extends Component {
  static propTypes = {
    showNotes: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      value: ''
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const value = event.target.value;
    console.log(`ControlPanel - value: ${value}`)
    const notes = parseList(value);
    console.log(`ControlPanel - notes: ${notes}`)
    this.props.showNotes(notes);

    this.setState({value: event.target.value});
  }

  render() {
    return (
      <div className='control-panel'>
       <form>
          <label>
            Show:
            <input value={this.state.value} onChange={this.handleChange} />
          </label>
        </form>
      </div>
    );
  }
}

export default ControlPanel;
