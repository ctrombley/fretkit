import { useStore } from '../store';

export function useBottomPadding(): number {
  const transportBarOpen = useStore(s => s.transportBarOpen);
  const keyboardPanelOpen = useStore(s => s.keyboardPanelOpen);

  let padding = 0;
  // Transport bar: expanded ~80px, collapsed ~28px
  padding += transportBarOpen ? 80 : 28;
  // Keyboard panel: expanded ~180px, collapsed ~28px
  padding += keyboardPanelOpen ? 180 : 28;
  return padding;
}
