import { useState, useRef, useEffect } from 'react';
import { Save, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../store';
import { FACTORY_SAMPLER_PRESETS } from '../lib/samplerPresets';
import { getSampler } from '../lib/sampler';

export default function SamplerPresetSelector() {
  const samplerPresets = useStore(s => s.samplerPresets);
  const activeUserIndex = useStore(s => s.samplerActivePresetIndex);
  const loadSamplerPreset = useStore(s => s.loadSamplerPreset);
  const saveSamplerPreset = useStore(s => s.saveSamplerPreset);
  const deleteSamplerPreset = useStore(s => s.deleteSamplerPreset);
  const setSamplerSlot = useStore(s => s.setSamplerSlot);
  const setSamplerKeyMap = useStore(s => s.setSamplerKeyMap);

  // Track which factory preset is selected locally (not persisted — they're templates).
  const [activeFactory, setActiveFactory] = useState<number | null>(null);
  const [savingName, setSavingName] = useState<string | null>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const justOpenedRef = useRef(false);

  useEffect(() => {
    if (justOpenedRef.current) {
      justOpenedRef.current = false;
      saveInputRef.current?.focus();
      saveInputRef.current?.select();
    }
  }, [savingName]);

  const selectValue =
    activeFactory !== null ? `f${activeFactory}` :
    activeUserIndex !== null ? `u${activeUserIndex}` :
    '';

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    if (val.startsWith('f')) {
      const i = parseInt(val.slice(1), 10);
      const preset = FACTORY_SAMPLER_PRESETS[i];
      if (!preset) return;
      preset.slots.forEach((slot, idx) => {
        setSamplerSlot(idx, slot);
        if (slot?.url) getSampler().loadSample(idx, slot.url).catch(console.error);
      });
      setSamplerKeyMap([...preset.keyMap]);
      setActiveFactory(i);
    } else if (val.startsWith('u')) {
      loadSamplerPreset(parseInt(val.slice(1), 10));
      setActiveFactory(null);
    }
  };

  const handleSaveClick = () => {
    const currentName = activeUserIndex !== null ? samplerPresets[activeUserIndex]?.name ?? '' : '';
    justOpenedRef.current = true;
    setSavingName(currentName);
  };

  const handleSaveConfirm = () => {
    const name = savingName?.trim();
    if (!name) { setSavingName(null); return; }
    saveSamplerPreset(name);
    setActiveFactory(null);
    setSavingName(null);
  };

  const handleDelete = () => {
    if (activeUserIndex === null) return;
    deleteSamplerPreset(activeUserIndex);
  };

  if (savingName !== null) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={saveInputRef}
          type="text"
          value={savingName}
          onChange={e => setSavingName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSaveConfirm();
            else if (e.key === 'Escape') setSavingName(null);
          }}
          placeholder="Preset name..."
          className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
        />
        <button onClick={handleSaveConfirm} className="p-1.5 rounded hover:bg-gray-100 text-fret-green hover:text-green-600 transition-colors" title="Confirm save">
          <Check size={14} />
        </button>
        <button onClick={() => setSavingName(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Cancel">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <select
        value={selectValue}
        onChange={handleLoad}
        className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
      >
        <option value="" disabled>Select preset...</option>
        <optgroup label="Factory">
          {FACTORY_SAMPLER_PRESETS.map((p, i) => (
            <option key={i} value={`f${i}`}>{p.name}</option>
          ))}
        </optgroup>
        {samplerPresets.length > 0 && (
          <optgroup label="User">
            {samplerPresets.map((p, i) => (
              <option key={i} value={`u${i}`}>{p.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      <button
        onClick={handleSaveClick}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Save preset"
      >
        <Save size={14} />
      </button>

      {activeUserIndex !== null && (
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete preset"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
