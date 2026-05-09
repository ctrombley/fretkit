import { useStore } from '../store';
import type { IntervalPair } from '../lib/harmonicAnalysis';

// ── Helpers ───────────────────────────────────────────────────────────────────

function consonanceBar(dissonance: number) {
  const pct = Math.round((1 - dissonance) * 100);
  const fill = Math.round((1 - dissonance) * 20);
  const color =
    pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex gap-px flex-shrink-0">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className={`w-1 h-2 rounded-sm ${i < fill ? color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-[10px] tabular-nums text-gray-500 flex-shrink-0">{pct}%</span>
    </div>
  );
}

function PairRow({ pair }: { pair: IntervalPair }) {
  return (
    <div className="grid gap-x-3 items-center py-1 border-b border-gray-100 last:border-0"
      style={{ gridTemplateColumns: '1fr 100px 1fr' }}>
      <span className="text-[10px] text-gray-600 truncate text-right">{pair.labelA}</span>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">
          {pair.intervalName}
        </span>
        {pair.beatFrequency !== null && (
          <span className="text-[9px] text-indigo-400 tabular-nums">
            {pair.beatFrequency.toFixed(1)} Hz beat
          </span>
        )}
      </div>
      <span className="text-[10px] text-gray-600 truncate">{pair.labelB}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DronePanel() {
  const droneActive = useStore(s => s.droneActive);
  const droneDetuneRange = useStore(s => s.droneDetuneRange);
  const droneAnalysis = useStore(s => s.droneAnalysis);
  const droneLegatoEnabled = useStore(s => s.droneLegatoEnabled);
  const dronePortamentoMs = useStore(s => s.dronePortamentoMs);
  const activateDrone = useStore(s => s.activateDrone);
  const deactivateDrone = useStore(s => s.deactivateDrone);
  const setDroneDetuneRange = useStore(s => s.setDroneDetuneRange);
  const randomizeDroneOffsets = useStore(s => s.randomizeDroneOffsets);
  const setDroneLegatoEnabled = useStore(s => s.setDroneLegatoEnabled);
  const setDronePortamentoMs = useStore(s => s.setDronePortamentoMs);

  const scoreColor =
    droneAnalysis && droneAnalysis.score >= 0.7
      ? 'text-emerald-600'
      : droneAnalysis && droneAnalysis.score >= 0.4
      ? 'text-yellow-600'
      : 'text-red-500';

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => (droneActive ? deactivateDrone() : activateDrone())}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded font-medium transition-colors ${
            droneActive
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {droneActive ? 'Drone On' : 'Drone'}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 flex-shrink-0">
            Detune
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={droneDetuneRange}
            onChange={e => setDroneDetuneRange(Number(e.target.value))}
            className="flex-1 h-1 accent-indigo-500"
          />
          <span className="text-[10px] tabular-nums text-gray-500 w-10 text-right flex-shrink-0">
            {droneDetuneRange === 0 ? 'exact' : `±${droneDetuneRange}¢`}
          </span>
          <button
            onClick={randomizeDroneOffsets}
            className="text-[9px] text-gray-400 hover:text-indigo-500 transition-colors flex-shrink-0 underline"
            title="Randomize per-string detune offsets"
          >
            randomize
          </button>
        </div>

        {/* Legato toggle */}
        <button
          onClick={() => setDroneLegatoEnabled(!droneLegatoEnabled)}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors flex-shrink-0 ${
            droneLegatoEnabled
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Legato: glide between notes instead of retriggering"
        >
          Legato
        </button>

        {/* Portamento knob (only when legato is on) */}
        {droneLegatoEnabled && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-gray-400">Glide</span>
            <input
              type="range"
              min={20}
              max={1000}
              step={10}
              value={dronePortamentoMs}
              onChange={e => setDronePortamentoMs(Number(e.target.value))}
              className="w-16 h-1 accent-indigo-500"
            />
            <span className="text-[10px] tabular-nums text-gray-500 w-10 flex-shrink-0">
              {dronePortamentoMs}ms
            </span>
          </div>
        )}
      </div>

      {/* Analysis body */}
      {droneActive && droneAnalysis && (
        <div className="p-3 space-y-4">
          {/* Score */}
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-mono font-bold tabular-nums ${scoreColor}`}>
              {Math.round(droneAnalysis.score * 100)}%
            </span>
            <span className="text-sm text-gray-500">{droneAnalysis.scoreLabel}</span>
            <span className="text-[10px] text-gray-400 ml-auto">
              {droneAnalysis.pairs.length} pairs
            </span>
          </div>

          {/* Beating pairs */}
          {droneAnalysis.beatPairs.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-500 font-medium mb-1.5">
                Audible Beating
              </p>
              <div className="space-y-0.5">
                {droneAnalysis.beatPairs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-500 truncate">{p.labelA}</span>
                    <span className="text-gray-300">×</span>
                    <span className="text-gray-500 truncate">{p.labelB}</span>
                    <span className="text-indigo-400 tabular-nums ml-auto flex-shrink-0">
                      {p.beatFrequency!.toFixed(2)} Hz
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most consonant */}
          <div>
            <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-medium mb-1.5">
              Most Consonant
            </p>
            {droneAnalysis.mostConsonant.map((pair, i) => (
              <div key={i} className="mb-1">
                <PairRow pair={pair} />
                <div className="mt-0.5">{consonanceBar(pair.dissonance)}</div>
              </div>
            ))}
          </div>

          {/* Most dissonant */}
          {droneAnalysis.mostDissonant.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-red-500 font-medium mb-1.5">
                Most Dissonant
              </p>
              {droneAnalysis.mostDissonant.map((pair, i) => (
                <div key={i} className="mb-1">
                  <PairRow pair={pair} />
                  <div className="mt-0.5">{consonanceBar(pair.dissonance)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Full pair list (collapsible) */}
          {droneAnalysis.pairs.length > 6 && (
            <details className="group">
              <summary className="text-[9px] uppercase tracking-wider text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                All {droneAnalysis.pairs.length} pairs
              </summary>
              <div className="mt-2 space-y-0.5">
                {droneAnalysis.pairs.map((pair, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 text-[10px] py-0.5">
                      <span className="text-gray-500 truncate flex-1 text-right">{pair.labelA}</span>
                      <span className="text-gray-400 flex-shrink-0 w-20 text-center text-[9px]">
                        {pair.intervalName}
                        {pair.beatFrequency !== null && (
                          <> · {pair.beatFrequency.toFixed(1)}Hz</>
                        )}
                      </span>
                      <span className="text-gray-500 truncate flex-1">{pair.labelB}</span>
                      <span className="flex-shrink-0">{consonanceBar(pair.dissonance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

    </>
  );
}
