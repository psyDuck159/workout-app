import type { Metadata } from "next";
import HistoryList from "@/components/history/HistoryList";
import { exercises } from "@/content";

export const metadata: Metadata = { title: "Lịch sử" };

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Lịch sử tập</h1>
        <p className="text-muted-foreground text-sm">
          Chạm vào một buổi để xem hoặc sửa từng hiệp. Buổi đã xóa nằm trong thùng rác 30 ngày.
        </p>
      </header>
      <HistoryList exerciseNames={Object.fromEntries(exercises.map((e) => [e.id, e.nameVi]))} />
    </main>
  );
}
