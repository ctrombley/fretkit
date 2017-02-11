import React, {Component} from 'react';
import tunings from './lib/tunings.js';
import Fretboard from './Fretboard/Fretboard.jsx';

class App extends Component {
  render() {

    return (
      <Fretboard width="1080" height="480" startFret={1} fretCount={24} tuning={tunings.standard} litNotes={[0, 3, 7, 10]}/>
    );
  }
}
export default App;
