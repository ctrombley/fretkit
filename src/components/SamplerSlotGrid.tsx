import { useRef, useState } from 'react';
import { useStore } from '../store';
import { SLOT_COLORS } from '../lib/samplerPresets';
import { DEFAULT_SAMPLER_PARAMS } from '../lib/sampler';

interface Props {
  onSelectSlot: (idx: number) => void;
  selectedSlot: number | null;
  playingSlots: Set<number>;
}

export default function SamplerSlotGrid({ onSelectSlot, selectedSlot, playingSlots }: Props) {
  const slots = useStore(s => s.samplerSlots);
  const setSamplerSlotUrl = useStore(s => s.setSamplerSlotUrl);
  const setSamplerSlotFile = useStore(s => s.setSamplerSlotFile);
  const setSamplerSlot = useStore(s => s.setSamplerSlot);

  const [urlInputIdx, setUrlInputIdx] = useState<number | null>(null);
  const [urlInputVal, setUrlInputVal] = useState('');
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputIdxRef = useRef<number | null>(null);

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSamplerSlotFile(idx, file);
      // Assign default color
      const slots2 = [...slots];
      if (!slots2[idx]) {
        const newSlot = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: '',
          color: SLOT_COLORS[idx % SLOT_COLORS.length]!,
          rootNote: null,
          params: { ...DEFAULT_SAMPLER_PARAMS },
        };
        setSamplerSlot(idx, newSlot);
      }
      onSelectSlot(idx);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInputIdx == null || !urlInputVal.trim()) {
      setUrlInputIdx(null);
      return;
    }
    const url = urlInputVal.trim();
    const name = url.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? 'Sample';
    setSamplerSlot(urlInputIdx, {
      name,
      url,
      color: SLOT_COLORS[urlInputIdx % SLOT_COLORS.length]!,
      rootNote: null,
      params: { ...DEFAULT_SAMPLER_PARAMS },
    });
    setSamplerSlotUrl(urlInputIdx, url);
    onSelectSlot(urlInputIdx);
    setUrlInputIdx(null);
    setUrlInputVal('');
  };

  const handleFileSelect = (idx: number) => {
    fileInputIdxRef.current = idx;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = fileInputIdxRef.current;
    if (!file || idx == null) return;
    setSamplerSlot(idx, {
      name: file.name.replace(/\.[^/.]+$/, ''),
      url: '',
      color: SLOT_COLORS[idx % SLOT_COLORS.length]!,
      rootNote: null,
      params: { ...DEFAULT_SAMPLER_PARAMS },
    });
    setSamplerSlotFile(idx, file);
    onSelectSlot(idx);
    e.target.value = '';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {urlInputIdx != null && (
        <div className="mb-3 flex gap-2">
          <input
            autoFocus
            type="url"
            placeholder="Paste audio URL…"
            value={urlInputVal}
            onChange={e => setUrlInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); if (e.key === 'Escape') setUrlInputIdx(null); }}
            className="flex-1 text-xs bg-gray-100 rounded px-2 py-1 outline-none border border-gray-300 focus:border-fret-green"
          />
          <button
            onClick={handleUrlSubmit}
            className="text-[10px] uppercase tracking-wider px-2 py-1 bg-fret-green text-white rounded"
          >
            Load
          </button>
          <button
            onClick={() => setUrlInputIdx(null)}
            className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-8 gap-1">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot === idx;
          const isPlaying = playingSlots.has(idx);
          const color = slot?.color ?? SLOT_COLORS[idx % SLOT_COLORS.length]!;
          const isDragTarget = dragOver === idx;

          return (
            <div
              key={idx}
              className={`
                relative rounded cursor-pointer select-none
                transition-all duration-75
                ${isSelected ? 'ring-2 ring-offset-1 ring-white' : ''}
                ${isDragTarget ? 'scale-105 ring-2 ring-white/60' : ''}
                ${isPlaying ? 'brightness-150' : ''}
              `}
              style={{ backgroundColor: slot ? color : '#2a2a2a', minHeight: 56 }}
              onClick={() => onSelectSlot(idx)}
              onContextMenu={e => { e.preventDefault(); setSamplerSlot(idx, null); }}
              onDragOver={e => { e.preventDefault(); setDragOver(idx); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(idx, e)}
            >
              <div className="p-1 h-full flex flex-col justify-between">
                <div className="text-[8px] text-white/60 font-mono">{idx + 1}</div>
                {slot ? (
                  <div className="text-[8px] font-semibold text-white leading-tight truncate">
                    {slot.name}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5 opacity-40">
                    <button
                      className="text-white text-[8px] hover:opacity-80"
                      onClick={e => { e.stopPropagation(); setUrlInputIdx(idx); setUrlInputVal(''); }}
                      title="Load from URL"
                    >
                      URL
                    </button>
                    <button
                      className="text-white text-[8px] hover:opacity-80"
                      onClick={e => { e.stopPropagation(); handleFileSelect(idx); }}
                      title="Load file"
                    >
                      FILE
                    </button>
                  </div>
                )}
              </div>
              {slot && (
                <button
                  className="absolute top-0.5 right-0.5 text-white/40 hover:text-white text-[8px] leading-none"
                  onClick={e => { e.stopPropagation(); setSamplerSlot(idx, null); }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
              {!slot && (
                <div className="absolute inset-0 border border-dashed border-white/10 rounded pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
