import { Dice5, Save, Trash2 } from 'lucide-react';
import { useStore } from '../store';

export default function SynthPresetSelector() {
  const presets = useStore(s => s.synthPresets);
  const activeIndex = useStore(s => s.synthActivePresetIndex);
  const loadPreset = useStore(s => s.loadPreset);
  const savePreset = useStore(s => s.savePreset);
  const deletePreset = useStore(s => s.deletePreset);
  const randomize = useStore(s => s.randomizeSynth);

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx)) {
      loadPreset(idx);
    }
  };

  const handleSave = () => {
    const name = window.prompt('Preset name:');
    if (!name) return;
    // Find first free slot after factory presets, or append
    const firstUserSlot = presets.length;
    const idx = activeIndex !== null && !presets[activeIndex]?.isFactory
      ? activeIndex
      : firstUserSlot;
    savePreset(idx, name);
  };

  const handleDelete = () => {
    if (activeIndex === null) return;
    const preset = presets[activeIndex];
    if (!preset || preset.isFactory) return;
    deletePreset(activeIndex);
  };

  const activeIsUser = activeIndex !== null && presets[activeIndex] && !presets[activeIndex]!.isFactory;

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
        onClick={handleSave}
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
