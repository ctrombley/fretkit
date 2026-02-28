import { useEffect, useState } from 'react';
import { useStore } from '../store';
import Header from './Header';
import SandboxView from './SandboxView';
import SongListView from './SongListView';
import SongDetailView from './SongDetailView';
import SpiralView from './SpiralView';
import OvertoneView from './OvertoneView';
import ColtraneView from './ColtraneView';
import SynthView from './SynthView';
import MonochordView from './MonochordView';
import KeyboardPanel from './KeyboardPanel';
import TransportBar from './TransportBar';
import KeybindingsModal from './KeybindingsModal';

export default function App() {
  const view = useStore(s => s.view);
  const [showKeybindings, setShowKeybindings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '?') {
        setShowKeybindings(prev => !prev);
        return;
      }

      if (e.key === 'p') {
        const v = useStore.getState().view;
        if (v.name === 'overtones' || v.name === 'coltrane') {
          const s = useStore.getState();
          s.setSeriesPlaying(!s.seriesPlaying);
        }
      }

      if (e.key === 'Escape') {
        if (showKeybindings) {
          setShowKeybindings(false);
          return;
        }
        useStore.getState().killAllNotes();
        useStore.getState().setSeriesPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showKeybindings]);

  return (
    <div className="min-h-screen">
      <Header />
      {view.name === 'sandbox' && <SandboxView />}
      {view.name === 'songList' && <SongListView />}
      {view.name === 'songDetail' && <SongDetailView songId={view.songId} />}
      {view.name === 'spiral' && <SpiralView />}
      {view.name === 'overtones' && <OvertoneView />}
      {view.name === 'coltrane' && <ColtraneView />}
      {view.name === 'synth' && <SynthView />}
      {view.name === 'monochord' && <MonochordView />}
      <KeyboardPanel />
      <TransportBar />
      {showKeybindings && (
        <KeybindingsModal onClose={() => setShowKeybindings(false)} />
      )}
    </div>
  );
}
