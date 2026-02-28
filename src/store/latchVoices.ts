/** Voice handles for latch-mode notes (survives component unmount). */
export const latchVoices = new Map<number, { stop: () => void }>();
