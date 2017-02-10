import React, {Component} from 'react';
import Fretboard from './Components/Fretboard.jsx'

class App extends Component {
  render() {
    return (
      <Fretboard width="1080" height="480" startFret={2} fretCount={5} />
    );
  }
}
export default App;
