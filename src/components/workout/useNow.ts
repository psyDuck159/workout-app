"use client";

import { useEffect, useState } from "react";

/**
 * Thời điểm hiện tại, cập nhật mỗi `intervalMs` khi `active`. Tính lại ngay khi tab hiện trở lại,
 * vì trình duyệt làm chậm setInterval ở tab nền — đồng hồ luôn dựa trên Date.now(), không đếm tick.
 */
export function useNow(intervalMs: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, intervalMs);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, [intervalMs, active]);

  return now;
}
