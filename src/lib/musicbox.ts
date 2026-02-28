let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function play(frequency: number): { stop: () => void } {
  const ctx = getAudioContext();
  const gainNode = ctx.createGain();
  const oscillator = ctx.createOscillator();

  gainNode.gain.value = 0.1;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.start();

  return {
    stop: () => {
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
    },
  };
}
