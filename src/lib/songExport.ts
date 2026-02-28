import type { SongExport } from '../types';

export function validateSongExport(data: unknown): data is SongExport {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) return false;
  if (typeof obj.exportedAt !== 'number') return false;
  if (!Array.isArray(obj.songs)) return false;

  for (const song of obj.songs) {
    if (typeof song !== 'object' || song === null) return false;
    if (typeof song.id !== 'string') return false;
    if (typeof song.title !== 'string') return false;
    if (typeof song.createdAt !== 'number') return false;
    if (typeof song.updatedAt !== 'number') return false;
    if (!Array.isArray(song.chords)) return false;

    for (const chord of song.chords) {
      if (typeof chord !== 'object' || chord === null) return false;
      if (typeof chord.id !== 'string') return false;
      if (typeof chord.searchStr !== 'string') return false;
      if (!Array.isArray(chord.tuning)) return false;
      if (typeof chord.fretCount !== 'number') return false;
      if (typeof chord.startingFret !== 'number') return false;
      if (typeof chord.position !== 'number') return false;
      if (typeof chord.sequenceEnabled !== 'boolean') return false;
    }
  }

  return true;
}

export function parseSongImport(jsonString: string): SongExport {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON');
  }

  if (!validateSongExport(data)) {
    throw new Error('Invalid song export format');
  }

  return data;
}

export function exportSongsToJson(data: SongExport): string {
  return JSON.stringify(data, null, 2);
}

export function downloadSongExport(data: SongExport, title: string): void {
  const json = exportSongsToJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fretkit.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
