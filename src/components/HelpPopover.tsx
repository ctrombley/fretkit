import { useState, useRef, useEffect } from 'react';

interface HelpPopoverProps {
  text: React.ReactNode;
  placement?: 'above' | 'below' | 'left' | 'right';
  className?: string;
}

const HOVER_DELAY_MS = 400;

export default function HelpPopover({ text, placement = 'above', className = '' }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Clean up timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const startHover = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  };

  const endHover = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const popoverPos: Record<string, string> = {
    above: 'bottom-6 left-1/2 -translate-x-1/2',
    below: 'top-6 left-1/2 -translate-x-1/2',
    left:  'right-6 top-1/2 -translate-y-1/2',
    right: 'left-6 top-1/2 -translate-y-1/2',
  };

  return (
    <div ref={wrapperRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={startHover}
        onMouseLeave={endHover}
        className="w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-[9px] font-bold flex items-center justify-center transition-colors shrink-0"
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600 leading-relaxed ${popoverPos[placement]}`}
          onMouseEnter={endHover}
        >
          {text}
        </div>
      )}
    </div>
  );
}
