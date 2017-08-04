const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function play(frequency) {
  const gainNode = audioCtx.createGain();
  const oscillator = audioCtx.createOscillator();

  gainNode.gain.value = 0.1;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  oscillator.start();

  return {
    stop: () => {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.015);
    }
  };
}

export default {
  play: play
}
