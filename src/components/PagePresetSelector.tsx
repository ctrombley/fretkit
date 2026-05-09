import { useState, useRef, useEffect } from 'react';
import { Save, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../store';

export default function PagePresetSelector() {
  const presets = useStore(s => s.pagePresets);
  const activeId = useStore(s => s.activePagePresetId);
  const savePagePreset = useStore(s => s.savePagePreset);
  const loadPagePreset = useStore(s => s.loadPagePreset);
  const deletePagePreset = useStore(s => s.deletePagePreset);

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

  const activePreset = presets.find(p => p.id === activeId) ?? null;
  const activeIsUser = activePreset && !activePreset.isFactory;

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) loadPagePreset(id);
  };

  const handleSaveClick = () => {
    justOpenedRef.current = true;
    setSavingName(activePreset?.isFactory ? '' : activePreset?.name ?? '');
  };

  const handleSaveConfirm = () => {
    const name = savingName?.trim();
    if (!name) { setSavingName(null); return; }
    savePagePreset(name);
    setSavingName(null);
  };

  if (savingName !== null) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={saveInputRef}
          type="text"
          value={savingName}
          onChange={e => setSavingName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSaveConfirm(); if (e.key === 'Escape') setSavingName(null); }}
          placeholder="Layout name..."
          className="text-[11px] bg-white border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-fret-blue w-36"
        />
        <button onClick={handleSaveConfirm} className="p-1 rounded hover:bg-gray-100 text-fret-green" title="Save">
          <Check size={13} />
        </button>
        <button onClick={() => setSavingName(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400" title="Cancel">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeId ?? ''}
        onChange={handleLoad}
        className="text-[11px] bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-fret-blue max-w-[140px]"
      >
        <option value="" disabled>Layout...</option>
        <optgroup label="Factory">
          {presets.filter(p => p.isFactory).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </optgroup>
        {presets.some(p => !p.isFactory) && (
          <optgroup label="Saved">
            {presets.filter(p => !p.isFactory).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        )}
      </select>
      <button
        onClick={handleSaveClick}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Save current layout as preset"
      >
        <Save size={13} />
      </button>
      {activeIsUser && (
        <button
          onClick={() => deletePagePreset(activeId!)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete preset"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
