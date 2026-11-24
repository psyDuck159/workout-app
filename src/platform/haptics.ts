/** Rung nếu thiết bị hỗ trợ (Safari iOS không hỗ trợ Vibration API). */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Một số trình duyệt chặn khi chưa có thao tác người dùng — bỏ qua.
    }
  }
}
