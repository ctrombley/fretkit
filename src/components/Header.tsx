import { Guitar } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Guitar size={24} className="text-magenta" />
        <span className="text-lg font-semibold text-dark">Fretkit</span>
      </div>
    </header>
  );
}
