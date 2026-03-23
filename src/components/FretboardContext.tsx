import { createContext, useContext, useRef } from 'react';
import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';

interface SlideState {
  stringIdx: number;      // which string row (idx) is sliding
  currentSemitones: number;
}

interface FretboardContextValue {
  fretboardId: string;
  current: { name: string; type: string; root?: Note } | null;
  litNotes: Note[];
  sequence?: Sequence;
  sequenceEnabled: boolean;
  onStrum?: () => void;
  // Drone mode
  droneActive: boolean;
  droneFrets: (number | null)[];  // indexed by stringNumber (tuning index)
  onDroneFretSelect?: (stringNumber: number, semitones: number) => void;
  // Slide state ref (hammer-on/pull-off)
  slideRef: React.MutableRefObject<SlideState | null>;
}

const FretboardContext = createContext<FretboardContextValue | null>(null);

export function FretboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Omit<FretboardContextValue, 'slideRef'>;
}) {
  const slideRef = useRef<SlideState | null>(null);

  return (
    <FretboardContext.Provider value={{ ...value, slideRef }}>
      {children}
    </FretboardContext.Provider>
  );
}

export function useFretboardContext(): FretboardContextValue {
  const ctx = useContext(FretboardContext);
  if (!ctx) throw new Error('useFretboardContext must be used within FretboardProvider');
  return ctx;
}
