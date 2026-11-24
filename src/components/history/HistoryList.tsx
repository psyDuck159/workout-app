"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Trash2 } from "lucide-react";
import { useHistory, useRepositories, useSessionSets } from "@/data/hooks";
import type { WorkoutSession } from "@/data/types";
import { formatDuration } from "@/domain/timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const UNDO_MS = 10_000;

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });

/** Lịch sử buổi tập: xem, sửa từng hiệp, xóa có hoàn tác (FR-STA-01, FR-DAT-06). */
export default function HistoryList({ exerciseNames }: { exerciseNames: Record<string, string> }) {
  const repos = useRepositories();
  const { data: sessions, loading } = useHistory();
  const [open, setOpen] = useState<string>();
  const [deleted, setDeleted] = useState<WorkoutSession>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Dọn thùng rác quá hạn mỗi khi mở trang.
  useEffect(() => {
    void repos.purgeTrash().catch(() => undefined);
  }, [repos]);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function remove(session: WorkoutSession) {
    await repos.deleteSession(session.id);
    setDeleted(session);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDeleted(undefined), UNDO_MS);
  }

  async function undo() {
    if (!deleted) return;
    clearTimeout(timer.current);
    await repos.restoreSession(deleted.id);
    setDeleted(undefined);
  }

  if (loading) return null;

  return (
    <>
      {sessions && sessions.length === 0 && (
        <div className="space-y-4 py-8 text-center">
          <p className="text-muted-foreground">Chưa có buổi tập nào.</p>
          <Link href="/" className={buttonVariants()}>
            Bắt đầu buổi đầu tiên
          </Link>
        </div>
      )}

      <ul className="space-y-2">
        {sessions?.map((s) => {
          const start = new Date(s.startedAt);
          const duration = s.endedAt ? Date.parse(s.endedAt) - start.getTime() : 0;
          const sets = s.player.items.reduce((n, p) => n + p.done, 0);
          const expanded = open === s.id;
          return (
            <li key={s.id} className="bg-card rounded-lg border">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? undefined : s.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs first-letter:uppercase">
                    {dateFormat.format(start)} · {timeFormat.format(start)}
                  </p>
                  <p className="truncate font-medium">{s.titleVi}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDuration(duration)} · {sets} hiệp
                    {s.status === "abandoned" && " · Bỏ dở"}
                  </p>
                </div>
                <ChevronDown
                  className={cn("size-5 shrink-0 transition-transform", expanded && "rotate-180")}
                  aria-hidden
                />
              </button>
              {expanded && (
                <SessionDetail
                  session={s}
                  exerciseNames={exerciseNames}
                  onDelete={() => remove(s)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {deleted && (
        <div
          role="status"
          className="bg-foreground text-background fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg"
        >
          <span className="text-sm">Đã xóa {deleted.titleVi}</span>
          <button type="button" onClick={undo} className="text-sm font-semibold underline">
            Hoàn tác
          </button>
        </div>
      )}
    </>
  );
}

function SessionDetail({
  session,
  exerciseNames,
  onDelete,
}: {
  session: WorkoutSession;
  exerciseNames: Record<string, string>;
  onDelete: () => void;
}) {
  const repos = useRepositories();
  const { data: sets } = useSessionSets(session.id);
  const [saved, setSaved] = useState("");
  if (!sets) return null;

  async function save(setId: string, value: number) {
    try {
      await repos.updateSet(setId, value);
      setSaved("Đã lưu thay đổi.");
    } catch {
      setSaved("Không lưu được thay đổi.");
    }
  }

  return (
    <div className="space-y-4 border-t p-4">
      {session.plan.map((item, index) => {
        const mine = sets
          .filter((s) => s.exerciseId === item.exerciseId)
          .sort((a, b) => a.setIndex - b.setIndex);
        const unit = item.measure === "time" ? "giây" : "lần";
        const name = exerciseNames[item.exerciseId] ?? item.exerciseId;
        return (
          <div key={index} className="space-y-2">
            <p className="text-sm font-medium">{name}</p>
            {mine.length === 0 ? (
              <p className="text-muted-foreground text-sm">Không tập</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mine.map((set) => (
                  <label key={set.id} className="flex items-center gap-1 text-sm">
                    <span className="sr-only">
                      {name} hiệp {set.setIndex + 1} ({unit})
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      defaultValue={set.reps ?? set.seconds ?? 0}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value) && value !== (set.reps ?? set.seconds)) {
                          void save(set.id, value);
                        }
                      }}
                      className="border-input bg-background focus-visible:ring-ring/50 h-11 w-16 rounded-md border text-center outline-none focus-visible:ring-[3px]"
                    />
                    <span className="text-muted-foreground">{unit}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-muted-foreground min-h-5 text-sm" aria-live="polite">
        {saved}
      </p>
      {session.notes && (
        <p className="text-muted-foreground text-sm">
          <span className="font-medium">Ghi chú:</span> {session.notes}
        </p>
      )}
      <Button variant="ghost" className="text-destructive" onClick={onDelete}>
        <Trash2 className="size-4" aria-hidden />
        Xóa buổi này
      </Button>
    </div>
  );
}
