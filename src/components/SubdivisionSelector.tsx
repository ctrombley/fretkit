import { useStore } from '../store';

const SUBDIVISIONS: { value: number; label: string }[] = [
  { value: 1, label: '1/4' },
  { value: 2, label: '1/8' },
  { value: 3, label: 'Trip' },
  { value: 4, label: '1/16' },
];

export default function SubdivisionSelector() {
  const subdivision = useStore(s => s.metronomeSubdivision);
  const subdivisionAccent = useStore(s => s.metronomeSubdivisionAccent);
  const setSubdivision = useStore(s => s.setMetronomeSubdivision);
  const setSubdivisionAccent = useStore(s => s.setMetronomeSubdivisionAccent);

  return (
    <div className="flex items-center gap-1">
      {SUBDIVISIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setSubdivision(value)}
          className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded transition-colors ${
            subdivision === value
              ? 'bg-gray-200 text-fret-green'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
      {subdivision > 1 && (
        <button
          onClick={() => setSubdivisionAccent(!subdivisionAccent)}
          className={`px-1 py-0.5 text-[8px] uppercase tracking-wider rounded transition-colors ${
            subdivisionAccent
              ? 'bg-gray-200 text-fret-green'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title="Subdivision accent clicks"
        >
          Acc
        </button>
      )}
    </div>
  );
}
