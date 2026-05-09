import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useBottomPadding } from '../hooks/useBottomPadding';
import FretboardSection from './FretboardSection';
import Sidebar from './Sidebar';
import ControlPanel from './ControlPanel';
import DronePanel from './DronePanel';
import { Plus, Lock, Unlock, Zap, Link, Unlink } from 'lucide-react';
import type { ArpPattern, ArpMode } from '../lib/arpeggiator';
import { FINGER_PICKING_PATTERNS } from '../lib/fingerPickingPatterns';
import SynthKnob from './SynthKnob';
import PagePresetSelector from './PagePresetSelector';
import HelpPopover from './HelpPopover';

const ARP_SYNC_SPEEDS: { value: number; label: string }[] = [
  { value: 1, label: '1/4' },
  { value: 2, label: '1/8' },
  { value: 3, label: 'Trip' },
  { value: 4, label: '1/16' },
  { value: 8, label: '1/32' },
];

const ARP_PATTERNS: { value: ArpPattern; label: string }[] = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'upDown', label: 'Up/Down' },
  { value: 'downUp', label: 'Down/Up' },
  { value: 'random', label: 'Random' },
  { value: 'asPlayed', label: 'Played' },
  { value: 'converge', label: 'Converge' },
  { value: 'diverge', label: 'Diverge' },
];

export default function SandboxView() {
  const fretboards = useStore(s => s.fretboards);
  const settings = useStore(s => s.settings);
  const createFretboard = useStore(s => s.createFretboard);
  const sandboxLatch = useStore(s => s.sandboxLatch);
  const setSandboxLatch = useStore(s => s.setSandboxLatch);
  const arpEnabled = useStore(s => s.arpEnabled);
  const setArpEnabled = useStore(s => s.setArpEnabled);
  const arpPattern = useStore(s => s.arpPattern);
  const setArpPattern = useStore(s => s.setArpPattern);
  const arpOctaveRange = useStore(s => s.arpOctaveRange);
  const setArpOctaveRange = useStore(s => s.setArpOctaveRange);
  const arpSync = useStore(s => s.arpSync);
  const setArpSync = useStore(s => s.setArpSync);
  const arpSyncSpeed = useStore(s => s.arpSyncSpeed);
  const setArpSyncSpeed = useStore(s => s.setArpSyncSpeed);
  const arpFreeMs = useStore(s => s.arpFreeMs);
  const setArpFreeMs = useStore(s => s.setArpFreeMs);
  const arpMode = useStore(s => s.arpMode);
  const setArpMode = useStore(s => s.setArpMode);
  const arpFingerPickingPatternId = useStore(s => s.arpFingerPickingPatternId);
  const setArpFingerPickingPatternId = useStore(s => s.setArpFingerPickingPatternId);
  const bloomAllOctaves = useStore(s => s.bloomAllOctaves);
  const setBloomAllOctaves = useStore(s => s.setBloomAllOctaves);
  const bottomPadding = useBottomPadding();
  const droneActive = useStore(s => s.droneActive);

  const [droneOpen, setDroneOpen] = useState(false);
  const droneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!droneOpen) return;
    const close = (e: MouseEvent) => {
      if (droneRef.current && !droneRef.current.contains(e.target as Node)) {
        setDroneOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [droneOpen]);

  const activeFretboard = fretboards[settings.settingsId];

  return (
    <>
      <Sidebar
        open={settings.sidebarOpen}
        onClose={() => useStore.getState().updateSettings({ sidebarOpen: false })}
      >
        {activeFretboard && <ControlPanel />}
      </Sidebar>
      <main className="pt-14 px-4 max-w-7xl mx-auto" style={{ paddingBottom: bottomPadding }}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 py-2">
          <PagePresetSelector />
          <HelpPopover
            placement="below"
            text={<>
              Search for scales or chords by name (e.g. "C major", "C M"). Chords show ranked voicings with tab notation, shape type, and difficulty. Click the label to search; use arrows to navigate voicings. X/O markers show muted/open strings; the mini diagram shows the chord shape. Click notes to play; toggle Latch/Momentary for sustain behavior.
            </>}
          />
          {/* Latch toggle (hidden when arp is on) */}
          {!arpEnabled && (
            <button
              onClick={() => setSandboxLatch(!sandboxLatch)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
                sandboxLatch
                  ? 'bg-gray-200 text-fret-green'
                  : 'bg-gray-100 text-gray-500'
              }`}
              title={sandboxLatch ? 'Latch: notes sustain until clicked again' : 'Momentary: notes play while held'}
            >
              {sandboxLatch ? <Lock size={12} /> : <Unlock size={12} />}
              {sandboxLatch ? 'Latch' : 'Momentary'}
            </button>
          )}

          {/* Bloom octave toggle */}
          <button
            onClick={() => setBloomAllOctaves(!bloomAllOctaves)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
              bloomAllOctaves ? 'bg-gray-200 text-fret-green' : 'bg-gray-100 text-gray-500'
            }`}
            title={bloomAllOctaves ? 'Bloom: all octaves' : 'Bloom: played octave only'}
          >
            {bloomAllOctaves ? 'All Oct' : '1 Oct'}
          </button>

          {/* Drone button + popup */}
          <div ref={droneRef} className="relative">
            <button
              onClick={() => setDroneOpen(o => !o)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
                droneActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title="Resonates all open strings across all fretboards simultaneously."
            >
              Drone
            </button>
            {droneOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-[500px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <DronePanel />
              </div>
            )}
          </div>

          {/* Arp toggle */}
          <button
            onClick={() => setArpEnabled(!arpEnabled)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
              arpEnabled
                ? 'bg-magenta text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Zap size={12} />
            Arp
          </button>

          {/* Arp controls (visible when arp is on) */}
          {arpEnabled && (
            <>
              {/* Mode selector */}
              <select
                value={arpMode}
                onChange={e => setArpMode(e.target.value as ArpMode)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-600"
              >
                <option value="standard">Standard</option>
                <option value="strum">Strum</option>
                <option value="fingerPicking">Finger Pick</option>
                <option value="litRandom">Scale Rand</option>
              </select>

              {/* Standard mode: pattern selector */}
              {arpMode === 'standard' && (
                <select
                  value={arpPattern}
                  onChange={(e) => setArpPattern(e.target.value as ArpPattern)}
                  className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-600"
                >
                  {ARP_PATTERNS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              )}

              {/* Finger picking: pattern library selector */}
              {arpMode === 'fingerPicking' && (
                <select
                  value={arpFingerPickingPatternId}
                  onChange={(e) => setArpFingerPickingPatternId(e.target.value)}
                  className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-600"
                  title={FINGER_PICKING_PATTERNS.find(p => p.id === arpFingerPickingPatternId)?.description}
                >
                  {FINGER_PICKING_PATTERNS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-gray-400">Oct</span>
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setArpOctaveRange(n)}
                    className={`w-5 h-5 text-[10px] rounded transition-colors ${
                      arpOctaveRange === n
                        ? 'bg-gray-200 text-fret-green'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Sync toggle */}
              <button
                onClick={() => setArpSync(!arpSync)}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
                  arpSync
                    ? 'bg-gray-200 text-fret-green'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={arpSync ? 'Synced to transport' : 'Free-running'}
              >
                {arpSync ? <Link size={12} /> : <Unlink size={12} />}
                Sync
              </button>

              {/* Speed control: beat divisions when synced, ms knob when free */}
              {arpSync ? (
                <div className="flex items-center gap-1">
                  {ARP_SYNC_SPEEDS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setArpSyncSpeed(value)}
                      className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded transition-colors ${
                        arpSyncSpeed === value
                          ? 'bg-gray-200 text-fret-green'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <SynthKnob
                  label="Rate"
                  value={arpFreeMs}
                  min={50}
                  max={2000}
                  onChange={setArpFreeMs}
                  formatValue={(v) => `${Math.round(v)}ms`}
                  size={36}
                />
              )}
            </>
          )}

        </div>

        {Object.keys(fretboards).map(id => (
          <FretboardSection key={id} id={id} />
        ))}
        <div className="mt-2 mb-2">
          <button
            onClick={createFretboard}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Add fretboard"
          >
            <Plus size={20} />
          </button>
        </div>
      </main>
    </>
  );
}
