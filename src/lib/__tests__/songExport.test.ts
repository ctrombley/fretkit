import { describe, it, expect } from 'vitest';
import { validateSongExport, parseSongImport, exportSongsToJson } from '../songExport';
import type { SongExport } from '../../types';

const validExport: SongExport = {
  version: 1,
  exportedAt: Date.now(),
  songs: [
    {
      id: 'song-1',
      title: 'Test Song',
      createdAt: 1000,
      updatedAt: 2000,
      chords: [
        {
          id: 'chord-1',
          searchStr: 'C major',
          tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
          fretCount: 12,
          startingFret: 1,
          position: 1,
          sequenceEnabled: false,
          sequenceIdx: null,
          label: 'Intro',
        },
      ],
    },
  ],
};

describe('validateSongExport', () => {
  it('accepts valid export data', () => {
    expect(validateSongExport(validExport)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateSongExport(null)).toBe(false);
  });

  it('rejects wrong version', () => {
    expect(validateSongExport({ ...validExport, version: 2 })).toBe(false);
  });

  it('rejects missing songs array', () => {
    expect(validateSongExport({ version: 1, exportedAt: 1 })).toBe(false);
  });

  it('rejects song with missing title', () => {
    const bad = {
      ...validExport,
      songs: [{ id: 'x', createdAt: 1, updatedAt: 2, chords: [] }],
    };
    expect(validateSongExport(bad)).toBe(false);
  });

  it('rejects chord with missing searchStr', () => {
    const bad = {
      ...validExport,
      songs: [{
        ...validExport.songs[0],
        chords: [{ id: 'c1', tuning: [], fretCount: 12, startingFret: 1, position: 1, sequenceEnabled: false, sequenceIdx: null }],
      }],
    };
    expect(validateSongExport(bad)).toBe(false);
  });
});

describe('parseSongImport', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify(validExport);
    const result = parseSongImport(json);
    expect(result.version).toBe(1);
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0]!.title).toBe('Test Song');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseSongImport('not json')).toThrow('Invalid JSON');
  });

  it('throws on invalid format', () => {
    expect(() => parseSongImport('{"version": 99}')).toThrow('Invalid song export format');
  });
});

describe('exportSongsToJson', () => {
  it('round-trips through parse', () => {
    const json = exportSongsToJson(validExport);
    const result = parseSongImport(json);
    expect(result.songs[0]!.title).toBe('Test Song');
    expect(result.songs[0]!.chords[0]!.searchStr).toBe('C major');
  });

  it('produces formatted JSON', () => {
    const json = exportSongsToJson(validExport);
    expect(json).toContain('\n');
  });
});
