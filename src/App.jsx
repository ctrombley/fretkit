import React, {Component} from 'react';
import tunings from './lib/tunings.js';
import Fretboard from './Components/Fretboard.jsx';

class App extends Component {
  render() {

    return (
      <Fretboard width="1080" height="480" startFret={1} fretCount={24} tuning={tunings.standard} litNotes={[0]}/>
    );
  }
}
export default App;
