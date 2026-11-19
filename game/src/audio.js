export function createAudio() {
  let context = null;
  let master = 0.16;
  function beep(frequency = 220, duration = 0.11, shape = 'triangle') {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(master * 0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }
  return {
    unlock() {
      if (!context) context = new AudioContext();
      if (context.state === 'suspended') context.resume();
    },
    setVolume(value) { master = Math.max(0, Math.min(0.6, value)); },
    engine(speed) { if (Math.abs(speed) > 3 && Math.random() > 0.96) beep(66 + Math.abs(speed) * 7, 0.16, 'sawtooth'); },
    shot() { beep(82, 0.12, 'square'); },
    collect() { beep(660, 0.2); setTimeout(() => beep(880, 0.2), 95); },
    siren() { beep(580 + Math.random() * 160, 0.18); },
  };
}
