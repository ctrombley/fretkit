import { useEffect, useState } from 'react';
import { useStore } from '../store';
import Header from './Header';
import SandboxView from './SandboxView';
import SongListView from './SongListView';
import SongDetailView from './SongDetailView';
import CircleView from './SpiralView';
import OvertoneView from './OvertoneView';
import ColtraneView from './ColtraneView';
import SynthView from './SynthView';
import MonochordView from './MonochordView';
import KeyboardPanel from './KeyboardPanel';
import TransportBar from './TransportBar';
import KeybindingsModal from './KeybindingsModal';
import ToastContainer from './ToastContainer';

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
        const s = useStore.getState();
        if (s.view.name === 'coltrane') s.setColtraneSeriesPlaying(!s.coltraneSeriesPlaying);
        if (s.view.name === 'overtones') s.setOvertoneSeriesPlaying(!s.overtoneSeriesPlaying);
      }

      if (e.key === 'Escape') {
        if (showKeybindings) {
          setShowKeybindings(false);
          return;
        }
        const s = useStore.getState();
        s.killAllNotes();
        s.setColtraneSeriesPlaying(false);
        s.setOvertoneSeriesPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showKeybindings]);

  const isSongDetail = view.name === 'songDetail';

  return (
    <div className="min-h-screen">
      <Header />
      {/* Views are always mounted so audio keeps playing across tab switches */}
      <div className={view.name === 'sandbox' ? '' : 'hidden'}><SandboxView /></div>
      <div className={view.name === 'songList' ? '' : 'hidden'}><SongListView /></div>
      <div className={isSongDetail ? '' : 'hidden'}>
        {isSongDetail && <SongDetailView songId={(view as { name: 'songDetail'; songId: string }).songId} />}
      </div>
      <div className={view.name === 'spiral' ? '' : 'hidden'}><CircleView /></div>
      <div className={view.name === 'overtones' ? '' : 'hidden'}><OvertoneView /></div>
      <div className={view.name === 'coltrane' ? '' : 'hidden'}><ColtraneView /></div>
      <div className={view.name === 'synth' ? '' : 'hidden'}><SynthView /></div>
      <div className={view.name === 'monochord' ? '' : 'hidden'}><MonochordView /></div>
      <KeyboardPanel />
      <TransportBar />
      {showKeybindings && (
        <KeybindingsModal onClose={() => setShowKeybindings(false)} />
      )}
      <ToastContainer />
    </div>
  );
}
