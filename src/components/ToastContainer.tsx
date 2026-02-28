import { X } from 'lucide-react';
import { useToastStore } from '../lib/toast';

const TYPE_STYLES = {
  success: 'border-l-fret-green text-gray-700',
  info: 'border-l-fret-blue text-gray-700',
  error: 'border-l-red-400 text-gray-700',
};

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const dismissToast = useToastStore(s => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 bg-white border border-gray-200 border-l-4 rounded-lg shadow-md px-3 py-2.5 text-sm min-w-[180px] max-w-[280px] animate-toast-in ${TYPE_STYLES[toast.type]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
