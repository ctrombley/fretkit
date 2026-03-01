import type { MidiEvent, MidiBusConfig } from './midi';

type MidiHandler = (event: MidiEvent) => void;

interface Registration {
  config: MidiBusConfig;
  handler: MidiHandler;
}

class MidiRouter {
  private registrations: Map<string, Registration> = new Map();

  register(toyId: string, config: MidiBusConfig, handler: MidiHandler): void {
    this.registrations.set(toyId, { config, handler });
  }

  unregister(toyId: string): void {
    this.registrations.delete(toyId);
  }

  dispatch(event: MidiEvent): void {
    for (const [, reg] of this.registrations) {
      if (!reg.config.enabled) continue;
      const ch = reg.config.receiveChannel;
      if (ch === 'all' || ch === event.channel) {
        reg.handler(event);
      }
    }
  }

  updateConfig(toyId: string, partial: Partial<MidiBusConfig>): void {
    const reg = this.registrations.get(toyId);
    if (reg) {
      reg.config = { ...reg.config, ...partial };
    }
  }
}

let instance: MidiRouter | null = null;

export function getMidiRouter(): MidiRouter {
  if (!instance) {
    instance = new MidiRouter();
  }
  return instance;
}
