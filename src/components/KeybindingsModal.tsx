interface KeybindingsModalProps {
  onClose: () => void;
}

const bindings = [
  { key: '?', description: 'Toggle this help overlay' },
  { key: 'P', description: 'Play / pause series (Overtones & Coltrane views)' },
  { key: 'Esc', description: 'Stop all notes and close overlays' },
];

export default function KeybindingsModal({ onClose }: KeybindingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-dark mb-4">Keyboard Shortcuts</h2>
        <table className="w-full">
          <tbody>
            {bindings.map(b => (
              <tr key={b.key} className="border-b last:border-b-0 border-gray-100">
                <td className="py-2 pr-4">
                  <kbd className="inline-block px-2 py-0.5 text-sm font-mono bg-gray-100 border border-gray-300 rounded">
                    {b.key}
                  </kbd>
                </td>
                <td className="py-2 text-sm text-gray-700">{b.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-gray-400 text-center">
          Press <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 border border-gray-200 rounded">?</kbd> or <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 border border-gray-200 rounded">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
