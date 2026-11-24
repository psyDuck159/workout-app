/**
 * Âm báo bằng Web Audio (không cần file âm thanh). iOS chỉ cho phát sau một thao tác chạm,
 * nên gọi `unlockAudio()` trong handler của nút "Bắt đầu".
 */
let context: AudioContext | undefined;

function getContext(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  context ??= new Ctor();
  return context;
}

export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => undefined);
}

/** Phát `count` tiếng bíp ngắn; tiếng cuối dài hơn để báo "bắt đầu". */
export function beep(count = 1): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  const start = ctx.currentTime + 0.01;
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    const t = start + i * 0.25;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = last ? 1046 : 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (last ? 0.35 : 0.15));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + (last ? 0.4 : 0.2));
  }
}
