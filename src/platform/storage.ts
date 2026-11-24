/**
 * Lưu trữ bền vững: xin trình duyệt không tự xóa IndexedDB khi thiếu dung lượng (FR-DAT-07).
 * Bọc API trình duyệt để sau này thay bằng plugin Capacitor.
 */
export type PersistState = "granted" | "denied" | "unsupported";

function storageManager(): StorageManager | undefined {
  if (typeof navigator === "undefined" || !("storage" in navigator)) return undefined;
  return typeof navigator.storage.persist === "function" ? navigator.storage : undefined;
}

export async function getPersistState(): Promise<PersistState> {
  const storage = storageManager();
  if (!storage?.persisted) return "unsupported";
  try {
    return (await storage.persisted()) ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

/** Nên gọi sau một thao tác của người dùng (VD: hoàn thành onboarding) để tăng khả năng được cấp. */
export async function requestPersistentStorage(): Promise<PersistState> {
  const storage = storageManager();
  if (!storage) return "unsupported";
  try {
    if (await storage.persisted?.()) return "granted";
    return (await storage.persist()) ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}
