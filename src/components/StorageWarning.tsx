"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { getDb } from "@/data/db";

/** Cảnh báo khi trình duyệt chặn IndexedDB (VD: một số chế độ ẩn danh). */
export default function StorageWarning() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    getDb()
      .open()
      .catch(() => setBlocked(true));
  }, []);

  if (!blocked) return null;
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/10 mx-auto flex max-w-2xl gap-2 border-b px-4 py-3 text-sm"
    >
      <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        Trình duyệt đang chặn lưu dữ liệu (thường do chế độ ẩn danh). Bạn vẫn xem được bài tập,
        nhưng hồ sơ và lịch sử tập sẽ không được lưu.
      </p>
    </div>
  );
}
