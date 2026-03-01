import { useState, useRef, useEffect } from 'react';
import { Save, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../store';
import { FACTORY_SCALE_PRESETS } from '../lib/monochordScales';

export default function MonochordScaleSelector() {
  const scaleId            = useStore(s => s.monochordScaleId);
  const customEntries      = useStore(s => s.monochordCustomEntries);
  const userPresets        = useStore(s => s.monochordUserPresets);
  const setScaleId         = useStore(s => s.setMonochordScaleId);
  const clearCustom        = useStore(s => s.clearMonochordCustomEntries);
  const saveUserPreset     = useStore(s => s.saveMonochordUserPreset);
  const deleteUserPreset   = useStore(s => s.deleteMonochordUserPreset);

  const [savingName, setSavingName] = useState<string | null>(null);
  const saveInputRef                = useRef<HTMLInputElement>(null);
  const justOpenedRef               = useRef(false);

  useEffect(() => {
    if (justOpenedRef.current) {
      justOpenedRef.current = false;
      saveInputRef.current?.focus();
      saveInputRef.current?.select();
    }
  }, [savingName]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScaleId(e.target.value);
  };

  const handleSaveClick = () => {
    const activeUser = userPresets.find(p => p.id === scaleId);
    justOpenedRef.current = true;
    setSavingName(activeUser?.name ?? '');
  };

  const handleSaveConfirm = () => {
    const name = savingName?.trim();
    if (!name) { setSavingName(null); return; }

    // Determine entries: custom or active preset
    const entries =
      scaleId === 'custom'
        ? customEntries
        : (userPresets.find(p => p.id === scaleId)?.entries ??
           FACTORY_SCALE_PRESETS.find(p => p.id === scaleId)?.entries ?? []);

    saveUserPreset(name, entries);
    setSavingName(null);
  };

  const handleSaveCancel = () => setSavingName(null);

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveConfirm();
    else if (e.key === 'Escape') handleSaveCancel();
  };

  const handleDelete = () => {
    const preset = userPresets.find(p => p.id === scaleId);
    if (!preset) return;
    deleteUserPreset(scaleId);
  };

  const activeIsUser = userPresets.some(p => p.id === scaleId);

  if (savingName !== null) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={saveInputRef}
          type="text"
          value={savingName}
          onChange={e => setSavingName(e.target.value)}
          onKeyDown={handleSaveKeyDown}
          placeholder="Scale name…"
          className="text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green w-36"
        />
        <button
          onClick={handleSaveConfirm}
          className="p-1.5 rounded hover:bg-gray-100 text-fret-green transition-colors"
          title="Confirm"
        >
          <Check size={13} />
        </button>
        <button
          onClick={handleSaveCancel}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
          title="Cancel"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={scaleId}
        onChange={handleChange}
        className="text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-green"
      >
        <optgroup label="Factory">
          {FACTORY_SCALE_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </optgroup>

        {/* Custom (built up by ⊕ Pin) */}
        <optgroup label="Custom">
          <option value="custom">
            Custom ({customEntries.length} pin{customEntries.length !== 1 ? 's' : ''})
          </option>
        </optgroup>

        {userPresets.length > 0 && (
          <optgroup label="Saved">
            {userPresets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Save: only meaningful when custom or user preset is active */}
      {(scaleId === 'custom' || activeIsUser) && (
        <button
          onClick={handleSaveClick}
          title="Save as named scale"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Save size={13} />
        </button>
      )}

      {/* Clear custom entries */}
      {scaleId === 'custom' && customEntries.length > 0 && (
        <button
          onClick={clearCustom}
          title="Clear all custom pins"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-400 transition-colors"
        >
          <X size={13} />
        </button>
      )}

      {/* Delete user preset */}
      {activeIsUser && (
        <button
          onClick={handleDelete}
          title="Delete this saved scale"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
