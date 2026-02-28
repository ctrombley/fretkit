import { useEffect } from 'react';
import { useStore } from '../store';
import { getMetronome } from '../lib/metronome';
import { getArpeggiator } from '../lib/arpeggiator';
import { getSynth } from '../lib/synth';

/** Encapsulates the 4 useEffect hooks that wire the metronome/arp engines to the store. */
export function useTransportEngine() {
  const playing = useStore(s => s.transportPlaying);
  const bpm = useStore(s => s.transportBpm);
  const beatsPerMeasure = useStore(s => s.transportBeatsPerMeasure);
  const beatUnit = useStore(s => s.transportBeatUnit);
  const volume = useStore(s => s.metronomeVolume);
  const muted = useStore(s => s.metronomeMuted);
  const timbre = useStore(s => s.metronomeTimbre);
  const subdivision = useStore(s => s.metronomeSubdivision);
  const subdivisionAccent = useStore(s => s.metronomeSubdivisionAccent);
  const arpEnabled = useStore(s => s.arpEnabled);
  const arpSync = useStore(s => s.arpSync);
  const arpSyncSpeed = useStore(s => s.arpSyncSpeed);
  const arpFreeMs = useStore(s => s.arpFreeMs);
  const setBpm = useStore(s => s.setTransportBpm);
  const setBeat = useStore(s => s.setTransportBeat);

  // Sync metronome engine with store
  useEffect(() => {
    const m = getMetronome();
    m.bpm = bpm;
    m.beatsPerMeasure = beatsPerMeasure;
    m.beatUnit = beatUnit;
    m.volume = volume;
    m.muted = muted;
    m.timbre = timbre;
    m.subdivision = subdivision;
    m.subdivisionAccent = subdivisionAccent;
  }, [bpm, beatsPerMeasure, beatUnit, volume, muted, timbre, subdivision, subdivisionAccent]);

  // Hook up arpeggiator: synced (metronome arp ticks) or free (own timer)
  useEffect(() => {
    const m = getMetronome();
    const arp = getArpeggiator();

    if (!arpEnabled) {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.onNotePlayed = null;
      arp.stopFreeRunning();
      return;
    }

    arp.enable();

    arp.onNotePlayed = (semitones) => {
      useStore.setState(s => ({ arpStrikeNote: semitones, arpStrikeCount: s.arpStrikeCount + 1 }));
    };

    if (arpSync) {
      arp.stopFreeRunning();
      m.onSubTick = null;
      m.arpTicksPerBeat = arpSyncSpeed;
      m.onArpTick = (time) => arp.tick(time);
    } else {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.startFreeRunning(arpFreeMs);
    }

    return () => {
      m.onArpTick = null;
      m.onSubTick = null;
      arp.onNotePlayed = null;
      arp.stopFreeRunning();
    };
  }, [arpEnabled, arpSync, arpSyncSpeed, arpFreeMs]);

  // Set up onBeat callback
  useEffect(() => {
    const m = getMetronome();
    m.onBeat = (beat, measure) => {
      setBeat(beat, measure);
    };
    return () => {
      m.onBeat = null;
    };
  }, [setBeat]);

  // Handle play/stop
  useEffect(() => {
    const m = getMetronome();
    if (playing) {
      m.start();
    } else {
      m.stop();
      setBeat(0, 0);
    }
    return () => {
      m.stop();
    };
  }, [playing, setBeat]);

  // Wire up LFO → BPM modulation callback
  useEffect(() => {
    getSynth().onBpmModulation = (modBpm) => setBpm(modBpm);
    return () => { getSynth().onBpmModulation = null; };
  }, [setBpm]);
}
