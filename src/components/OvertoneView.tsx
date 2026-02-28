import { useRef } from 'react';
import { useStore } from '../store';
import { noteName, usesSharps } from '../lib/harmony';
import { fundamentalFrequency } from '../lib/overtones';
import { play } from '../lib/musicbox';
import OvertoneSpiral from './OvertoneSpiral';

const PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const OCTAVES = [1, 2, 3, 4, 5];

export default function OvertoneView() {
  const overtoneRoot = useStore(s => s.overtoneRoot);
  const overtoneOctave = useStore(s => s.overtoneOctave);
  const overtoneCount = useStore(s => s.overtoneCount);
  const overtoneShowET = useStore(s => s.overtoneShowET);
  const overtoneUseET = useStore(s => s.overtoneUseET);
  const setOvertoneRoot = useStore(s => s.setOvertoneRoot);
  const setOvertoneOctave = useStore(s => s.setOvertoneOctave);
  const setOvertoneCount = useStore(s => s.setOvertoneCount);
  const setOvertoneShowET = useStore(s => s.setOvertoneShowET);
  const setOvertoneUseET = useStore(s => s.setOvertoneUseET);

  const playingRef = useRef(false);

  const fundHz = fundamentalFrequency(overtoneRoot, overtoneOctave);
  const preferSharps = usesSharps(overtoneRoot);
  const rootName = noteName(overtoneRoot, preferSharps);

  function playSeries() {
    if (playingRef.current) return;
    playingRef.current = true;

    const handles: { stop: () => void }[] = [];
    for (let n = 1; n <= overtoneCount; n++) {
      const freq = overtoneUseET
        ? fundHz * Math.pow(2, Math.round(1200 * Math.log2(n) / 100) / 12)
        : n * fundHz;
      setTimeout(() => {
        const handle = play(freq);
        handles.push(handle);
      }, (n - 1) * 200);
    }

    setTimeout(() => {
      handles.forEach(h => h.stop());
      playingRef.current = false;
    }, overtoneCount * 200 + 600);
  }

  return (
    <div className="pt-14 px-4 pb-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="mt-6 mb-4">
        <h2 className="text-2xl font-bold text-dark">
          Overtone Series: {rootName}{overtoneOctave}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Fundamental: {fundHz.toFixed(1)} Hz
        </p>
      </div>

      {/* Root note buttons */}
      <div className="flex gap-1 flex-wrap mb-4">
        {PITCH_CLASSES.map(pc => {
          const sharp = usesSharps(pc);
          const name = noteName(pc, sharp);
          const active = pc === overtoneRoot;
          return (
            <button
              key={pc}
              onClick={() => setOvertoneRoot(pc)}
              className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-fret-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Octave selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Octave</span>
          {OCTAVES.map(oct => (
            <button
              key={oct}
              onClick={() => setOvertoneOctave(oct)}
              className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                oct === overtoneOctave
                  ? 'bg-fret-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {oct}
            </button>
          ))}
        </div>

        {/* Harmonic count slider */}
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Harmonics: {overtoneCount}
          <input
            type="range"
            min={1}
            max={32}
            value={overtoneCount}
            onChange={e => setOvertoneCount(Number(e.target.value))}
            className="w-24 accent-fret-green"
          />
        </label>

        {/* Show ET toggle */}
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={overtoneShowET}
            onChange={e => setOvertoneShowET(e.target.checked)}
            className="accent-fret-green"
          />
          Show ET
        </label>

        {/* JI / ET mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setOvertoneUseET(false)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              !overtoneUseET
                ? 'bg-white text-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            JI
          </button>
          <button
            onClick={() => setOvertoneUseET(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              overtoneUseET
                ? 'bg-white text-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ET
          </button>
        </div>

        {/* Play Series */}
        <button
          onClick={playSeries}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-magenta text-white hover:bg-magenta/90 transition-colors"
        >
          Play Series
        </button>
      </div>

      {/* Spiral */}
      <OvertoneSpiral
        fundamentalHz={fundHz}
        pitchClass={overtoneRoot}
        count={overtoneCount}
        showET={overtoneShowET}
        useET={overtoneUseET}
      />
    </div>
  );
}
