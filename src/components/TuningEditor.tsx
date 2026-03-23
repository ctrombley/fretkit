import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import Note from '../lib/Note';

interface TuningEditorProps {
  tuning: string[];
  onChange: (tuning: string[]) => void;
}

export default function TuningEditor({ tuning, onChange }: TuningEditorProps) {
  const [inputs, setInputs] = useState<string[]>(tuning);
  const [errors, setErrors] = useState<(boolean | null)[]>(new Array(tuning.length).fill(null));

  useEffect(() => {
    setInputs(tuning);
    setErrors(new Array(tuning.length).fill(null));
  }, [tuning]);

  const validateNote = (noteStr: string): boolean => {
    try {
      new Note(noteStr.trim());
      return true;
    } catch {
      return false;
    }
  };

  const allValid = inputs.every((input, idx) => {
    // If error is null, we haven't validated yet; treat as potentially valid
    if (errors[idx] === null) return validateNote(input);
    return !errors[idx];
  });

  const handleInputChange = (idx: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[idx] = value;
    setInputs(newInputs);

    // Update error state as user types
    const newErrors = [...errors];
    newErrors[idx] = value.trim() === '' ? null : !validateNote(value);
    setErrors(newErrors);
  };

  const handleInputBlur = (idx: number) => {
    const val = inputs[idx] ?? '';
    const newErrors = [...errors];
    newErrors[idx] = val.trim() === '' ? null : !validateNote(val);
    setErrors(newErrors);

    // If all valid, commit the change
    if (allValid && val.trim() !== '') {
      onChange(inputs);
    }
  };

  const handleAddString = () => {
    if (inputs.length < 8) {
      const newInputs = [...inputs, inputs[inputs.length - 1] ?? ''];
      setInputs(newInputs);
      setErrors([...errors, null]);
    }
  };

  const handleRemoveString = () => {
    if (inputs.length > 1) {
      const newInputs = inputs.slice(0, -1);
      const newErrors = errors.slice(0, -1);
      setInputs(newInputs);
      setErrors(newErrors);
      onChange(newInputs);
    }
  };

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <label className="block text-sm font-medium text-gray-700">Custom Tuning</label>
      <div className="space-y-2">
        {inputs.map((value, idx) => (
          <input
            key={idx}
            type="text"
            value={value}
            onChange={e => handleInputChange(idx, e.target.value)}
            onBlur={() => handleInputBlur(idx)}
            placeholder={`String ${inputs.length - idx}`}
            className={`w-full px-3 py-2 text-sm rounded-md font-mono transition-colors ${
              errors[idx] === true
                ? 'border-2 border-red-500 text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300'
                : 'border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fret-blue focus:border-transparent'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddString}
          disabled={inputs.length >= 8}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Add String
        </button>
        <button
          onClick={handleRemoveString}
          disabled={inputs.length <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus size={14} /> Remove String
        </button>
      </div>
    </div>
  );
}
