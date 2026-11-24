"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Info, Trash2, Upload } from "lucide-react";
import { useRepositories } from "@/data/hooks";
import type { BackupFile, ImportPlan } from "@/domain/backup";
import { datedName, downloadText, readFileAsText } from "@/platform/files";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const WIPE_WORD = "XÓA";

/** Xuất / nhập / xóa dữ liệu (FR-DAT-01, 02, 04). Dữ liệu là của người dùng — luôn mang đi được. */
export default function DataSection({ exerciseNames }: { exerciseNames: Record<string, string> }) {
  const router = useRouter();
  const repos = useRepositories();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<{ backup: BackupFile; plan: ImportPlan }>();
  const [wipeStep, setWipeStep] = useState<0 | 1 | 2>(0);
  const [wipeText, setWipeText] = useState("");

  async function exportJson() {
    const backup = await repos.exportBackup();
    downloadText(
      `${datedName("workout-app")}.json`,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
    setStatus(`Đã xuất ${backup.data.sessions.length} buổi tập.`);
  }

  async function exportCsv() {
    const [backup, { toCsv }] = await Promise.all([
      repos.exportBackup(),
      import("@/domain/backup"),
    ]);
    const live = backup.data.sessions.filter((s) => !s.deletedAt);
    downloadText(
      `${datedName("workout-app")}.csv`,
      toCsv(live, backup.data.sets, exerciseNames),
      "text/csv;charset=utf-8",
    );
    setStatus(`Đã xuất ${backup.data.sets.length} hiệp ra CSV.`);
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    // Zod chỉ cần khi nhập — tải riêng để không làm nặng trang Cài đặt.
    const { parseBackup } = await import("@/domain/backup");
    const result = parseBackup(await readFileAsText(file), repos.schemaVersion());
    if (fileInput.current) fileInput.current.value = "";
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setPending({ backup: result.backup, plan: await repos.previewImport(result.backup) });
  }

  async function confirmImport() {
    if (!pending) return;
    try {
      const plan = await repos.importBackup(pending.backup);
      setStatus(`Đã nhập ${plan.sessions.length} buổi tập, ${plan.sets.length} hiệp.`);
    } catch {
      setStatus("Không nhập được dữ liệu.");
    }
    setPending(undefined);
  }

  async function wipe() {
    await repos.wipeAll();
    setWipeStep(0);
    router.push("/");
  }

  const exportedAt = pending ? new Date(pending.backup.exportedAt).toLocaleString("vi-VN") : "";

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Dữ liệu</h2>
      <p className="text-muted-foreground text-sm">
        Dữ liệu chỉ lưu trên thiết bị này. Hãy xuất file sao lưu định kỳ để không mất lịch sử khi
        đổi máy hoặc xóa trình duyệt.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={exportJson}>
          <Download className="size-4" aria-hidden />
          Xuất file sao lưu (JSON)
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <FileSpreadsheet className="size-4" aria-hidden />
          Xuất bảng tính (CSV)
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <Upload className="size-4" aria-hidden />
          Nhập từ file sao lưu
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Chọn file sao lưu"
          tabIndex={-1}
          onChange={(e) => chooseFile(e.target.files?.[0])}
        />
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive"
          onClick={() => setWipeStep(1)}
        >
          <Trash2 className="size-4" aria-hidden />
          Xóa toàn bộ dữ liệu
        </Button>
      </div>

      <p className="text-muted-foreground min-h-5 text-sm" aria-live="polite">
        {status}
      </p>

      <Link href="/about" className="inline-flex items-center gap-2 text-sm underline">
        <Info className="size-4" aria-hidden />
        Giới thiệu, lưu ý sức khỏe và nguồn tham khảo
      </Link>

      <Dialog
        open={pending !== undefined}
        onClose={() => setPending(undefined)}
        title="Nhập dữ liệu?"
      >
        {pending && (
          <div className="space-y-3 text-sm">
            <p>File sao lưu lúc {exportedAt}. Dữ liệu đang có trên máy được giữ nguyên.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {pending.plan.sessions.length} buổi tập mới
                {pending.plan.duplicates.sessions > 0 &&
                  ` (bỏ qua ${pending.plan.duplicates.sessions} buổi đã có)`}
              </li>
              <li>{pending.plan.sets.length} hiệp mới</li>
              <li>
                Hồ sơ: {pending.plan.profile ? "dùng hồ sơ trong file" : "giữ hồ sơ hiện tại"}
              </li>
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPending(undefined)}>
                Hủy
              </Button>
              <Button onClick={confirmImport}>Nhập</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={wipeStep === 1} onClose={() => setWipeStep(0)} title="Xóa toàn bộ dữ liệu?">
        <p className="text-muted-foreground mb-4 text-sm">
          Hồ sơ, lịch sử tập và bậc tập trên thiết bị này sẽ bị xóa vĩnh viễn. Nên xuất file sao lưu
          trước.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setWipeStep(0)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              setWipeText("");
              setWipeStep(2);
            }}
          >
            Tiếp tục
          </Button>
        </div>
      </Dialog>

      <Dialog open={wipeStep === 2} onClose={() => setWipeStep(0)} title="Xác nhận lần cuối">
        <label className="block space-y-2 text-sm">
          <span>
            Gõ <strong>{WIPE_WORD}</strong> để xóa vĩnh viễn.
          </span>
          <input
            value={wipeText}
            onChange={(e) => setWipeText(e.target.value)}
            className="border-input bg-background focus-visible:ring-ring/50 h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-[3px]"
            autoComplete="off"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setWipeStep(0)}>
            Hủy
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 text-white"
            disabled={wipeText.trim().toUpperCase() !== WIPE_WORD}
            onClick={wipe}
          >
            Xóa vĩnh viễn
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
