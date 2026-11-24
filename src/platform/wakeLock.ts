"use client";

import { useEffect } from "react";

/**
 * Giữ màn hình sáng trong lúc tập (FR-WKP-06). Trình duyệt tự nhả khóa khi tab bị ẩn,
 * nên xin lại khi tab hiện trở lại. Không hỗ trợ thì bỏ qua.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | undefined;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible" || sentinel) return;
      try {
        sentinel = await navigator.wakeLock.request("screen");
        sentinel.addEventListener("release", () => (sentinel = undefined));
        if (cancelled) void sentinel.release();
      } catch {
        // Bị từ chối (VD: chế độ tiết kiệm pin) — bỏ qua.
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
