import { createContext, useContext } from 'react';
import type Note from '../lib/Note';
import type Sequence from '../lib/Sequence';

interface FretboardContextValue {
  current: { name: string; type: string; root?: Note } | null;
  litNotes: Note[];
  sequence?: Sequence;
  sequenceEnabled: boolean;
}

const FretboardContext = createContext<FretboardContextValue | null>(null);

export function FretboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FretboardContextValue;
}) {
  return (
    <FretboardContext.Provider value={value}>
      {children}
    </FretboardContext.Provider>
  );
}

export function useFretboardContext(): FretboardContextValue {
  const ctx = useContext(FretboardContext);
  if (!ctx) throw new Error('useFretboardContext must be used within FretboardProvider');
  return ctx;
}
