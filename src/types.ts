export type View =
  | { name: 'sandbox' }
  | { name: 'songList' }
  | { name: 'songDetail'; songId: string }
  | { name: 'spiral' }
  | { name: 'overtones' }
  | { name: 'coltrane' }
  | { name: 'synth' }
  | { name: 'monochord' };

export interface ChordConfig {
  id: string;
  searchStr: string;
  tuning: string[];
  fretCount: number;
  startingFret: number;
  position: number;
  sequenceEnabled: boolean;
  sequenceIdx: number | null;
  inversion: number;
  label?: string;
}

export interface Song {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  chords: ChordConfig[];
  savedChords?: ChordConfig[];
}

export interface SongExport {
  version: 1;
  exportedAt: number;
  songs: Song[];
}
