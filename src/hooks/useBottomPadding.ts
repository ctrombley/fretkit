import { useState, useEffect } from 'react';
import { useStore } from '../store';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function useBottomPadding(): number {
  const transportBarOpen = useStore(s => s.transportBarOpen);
  const keyboardPanelOpen = useStore(s => s.keyboardPanelOpen);
  const isMobile = useIsMobile();

  let padding = 0;
  // Transport bar: two rows on mobile (~96px), one row on desktop (~80px), collapsed 28px
  padding += transportBarOpen ? (isMobile ? 96 : 80) : 28;
  // Keyboard panel: expanded ~180px, collapsed ~28px
  padding += keyboardPanelOpen ? 180 : 28;
  return padding;
}
