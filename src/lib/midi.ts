export type MidiChannel =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
  | 'all';

export type MidiEventType =
  | 'noteOn'
  | 'noteOff'
  | 'controlChange'
  | 'pitchBend'
  | 'programChange';

export interface MidiEvent {
  type: MidiEventType;
  channel: number;   // 1–16
  note?: number;     // 0–127
  velocity?: number; // 0–127
  control?: number;  // 0–127
  value?: number;    // 0–127 or -8192..8191
}

export interface MidiBusConfig {
  enabled: boolean;
  receiveChannel: MidiChannel;
  transmitChannel: number; // 1–16
}
