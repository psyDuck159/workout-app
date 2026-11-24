/** Thời gian còn lại tính từ mốc tuyệt đối, đúng kể cả khi tab bị tạm dừng (FR-WKP-05). */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

/** 65_000 → "1:05"; làm tròn lên để không hiện "0:00" khi còn vài trăm ms. */
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 1_830_000 → "30 phút", 95_000 → "1 phút 35 giây". */
export function formatDuration(ms: number): string {
  const total = Math.round(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds} giây`;
  if (minutes >= 10 || seconds === 0) return `${minutes} phút`;
  return `${minutes} phút ${seconds} giây`;
}
