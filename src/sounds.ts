// Petits sons générés avec Web Audio : aucun fichier ni lien externe à charger.
let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

const note = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle', volume = 0.25) => {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + start;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
};

/** Bip court (fin d'un chrono). */
export const playBeep = (count = 1) => {
  for (let i = 0; i < count; i++) note(880, i * 0.25, 0.18, 'square', 0.15);
};

/** Petite fanfare de victoire. */
export const playFanfare = () => {
  const melody: [number, number][] = [
    [523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.7], [1047, 0.85],
  ];
  melody.forEach(([freq, start]) => note(freq, start, 0.3));
  note(1319, 1.1, 0.8, 'triangle', 0.3);
};
