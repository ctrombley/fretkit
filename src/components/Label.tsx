import type { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
  xOffset: number;
  yOffset: number;
}

export default function Label({ children, xOffset, yOffset }: LabelProps) {
  return (
    <text className="label" x={xOffset} y={yOffset}>
      {children}
    </text>
  );
}
