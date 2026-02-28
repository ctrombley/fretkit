import { useState, useRef, useEffect } from 'react';
import { Dice5, Save, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../store';

export default function SynthPresetSelector() {
  const presets = useStore(s => s.synthPresets);
  const activeIndex = useStore(s => s.synthActivePresetIndex);
  const loadPreset = useStore(s => s.loadPreset);
  const savePreset = useStore(s => s.savePreset);
  const deletePreset = useStore(s => s.deletePreset);
  const randomize = useStore(s => s.randomizeSynth);

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

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx)) {
      loadPreset(idx);
    }
  };

  const handleSaveClick = () => {
    const currentName = activeIndex !== null ? presets[activeIndex]?.name ?? '' : '';
    justOpenedRef.current = true;
    setSavingName(currentName);
  };

  const handleSaveConfirm = () => {
    const name = savingName?.trim();
    if (!name) {
      setSavingName(null);
      return;
    }
    const idx = activeIndex !== null && !presets[activeIndex]?.isFactory
      ? activeIndex
      : presets.length;
    savePreset(idx, name);
    setSavingName(null);
  };

  const handleSaveCancel = () => {
    setSavingName(null);
  };

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveConfirm();
    } else if (e.key === 'Escape') {
      handleSaveCancel();
    }
  };

  const handleDelete = () => {
    if (activeIndex === null) return;
    const preset = presets[activeIndex];
    if (!preset || preset.isFactory) return;
    deletePreset(activeIndex);
  };

  const activeIsUser = activeIndex !== null && presets[activeIndex] && !presets[activeIndex]!.isFactory;

  if (savingName !== null) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={saveInputRef}
          type="text"
          value={savingName}
          onChange={(e) => setSavingName(e.target.value)}
          onKeyDown={handleSaveKeyDown}
          placeholder="Preset name..."
          className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
        />
        <button
          onClick={handleSaveConfirm}
          className="p-1.5 rounded hover:bg-gray-100 text-fret-green hover:text-green-600 transition-colors"
          title="Confirm save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleSaveCancel}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <select
        value={activeIndex ?? ''}
        onChange={handleLoad}
        className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
      >
        <option value="" disabled>Select preset...</option>
        <optgroup label="Factory">
          {presets.map((p, i) => p.isFactory && (
            <option key={i} value={i}>{`[${i}] ${p.name}`}</option>
          ))}
        </optgroup>
        {presets.some(p => !p.isFactory) && (
          <optgroup label="User">
            {presets.map((p, i) => !p.isFactory && (
              <option key={i} value={i}>{`[${i}] ${p.name}`}</option>
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

      {activeIsUser && (
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete preset"
        >
          <Trash2 size={14} />
        </button>
      )}

      <button
        onClick={randomize}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Randomize"
      >
        <Dice5 size={14} />
      </button>
    </div>
  );
}
