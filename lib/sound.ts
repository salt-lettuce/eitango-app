let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, startOffset: number, duration: number, ctx: AudioContext, type: OscillatorType = "sine") {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(523.25, 0, 0.12, ctx); // C5
  playTone(783.99, 0.1, 0.18, ctx); // G5
}

export function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(180, 0, 0.22, ctx, "sawtooth");
}
