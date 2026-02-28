import { ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import SynthKeyboard from './SynthKeyboard';

export default function KeyboardPanel() {
  const open = useStore(s => s.keyboardPanelOpen);
  const setOpen = useStore(s => s.setKeyboardPanelOpen);
  const transportBarOpen = useStore(s => s.transportBarOpen);
  const keyboardMode = useStore(s => s.synthKeyboardMode);
  const setKeyboardMode = useStore(s => s.setSynthKeyboardMode);

  const bottomOffset = transportBarOpen ? 56 : 28;

  if (!open) {
    return (
      <div
        className="fixed left-0 right-0 z-30 h-7 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4"
        style={{ bottom: bottomOffset }}
      >
        <span className="text-[9px] uppercase tracking-wider text-gray-400">Keyboard</span>
        <button
          onClick={() => setOpen(true)}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Expand keyboard"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed left-0 right-0 z-30 bg-gray-50 border-t border-gray-200 shadow-sm"
      style={{ bottom: bottomOffset }}
    >
      <div className="flex items-center justify-between px-4 h-7 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-gray-400">Keyboard</span>
          <div className="flex gap-0.5">
            {(['classic', 'isomorphic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setKeyboardMode(mode)}
                className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded transition-colors ${
                  keyboardMode === mode
                    ? 'bg-gray-200 text-fret-green'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Collapse keyboard"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="px-4 py-2 max-w-lg mx-auto">
        <SynthKeyboard mode={keyboardMode} />
      </div>
    </div>
  );
}
