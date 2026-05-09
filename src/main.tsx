import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.css';

// ?reset=1 clears all persisted state and reloads to factory defaults
if (new URLSearchParams(window.location.search).get('reset') === '1') {
  localStorage.removeItem('fretkit-storage');
  window.location.replace(window.location.pathname);
}

createRoot(document.getElementById('root')!).render(<App />);
