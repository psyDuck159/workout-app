/** Tải xuống / đọc tệp. Bọc lại để bản Capacitor thay bằng Filesystem + Share. */

export function downloadText(filename: string, text: string, mime: string): void {
  // BOM để Excel nhận đúng UTF-8 (tiếng Việt có dấu) khi mở CSV.
  const content = mime.startsWith("text/csv") ? `﻿${text}` : text;
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

/** VD: "workout-app-2026-11-24". */
export function datedName(prefix: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${prefix}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
