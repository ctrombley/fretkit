import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Sidebar({ open, onClose, children }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-14 right-0 z-40 h-[calc(100vh-3.5rem)] w-80 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <button
            onClick={onClose}
            className="float-right p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
          {children}
        </div>
      </aside>
    </>
  );
}
