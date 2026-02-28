import { useStore } from '../store';
import Header from './Header';
import SandboxView from './SandboxView';
import SongListView from './SongListView';
import SongDetailView from './SongDetailView';

export default function App() {
  const view = useStore(s => s.view);

  return (
    <div className="min-h-screen">
      <Header />
      {view.name === 'sandbox' && <SandboxView />}
      {view.name === 'songList' && <SongListView />}
      {view.name === 'songDetail' && <SongDetailView songId={view.songId} />}
    </div>
  );
}
