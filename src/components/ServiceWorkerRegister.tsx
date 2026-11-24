"use client";

import { useEffect } from "react";

/** Đăng ký service worker để dùng offline (chỉ bản production; dev không cache để tránh nhầm lẫn). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Không đăng ký được (VD: http không bảo mật) — app vẫn chạy online.
    });
  }, []);
  return null;
}
