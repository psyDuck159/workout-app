"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/domain/timer";
import type { PlannedItem } from "@/domain/session";
import { ActionBar, ExerciseHeader } from "./SetStep";
import type { WorkoutExercise } from "./types";
import { useNow } from "./useNow";

const COUNTDOWN_MS = 3000;

type Mode =
  { kind: "idle" } | { kind: "countdown"; startsAt: number } | { kind: "hold"; startedAt: number };

/**
 * Bài giữ theo thời gian (FR-WKP-03): đếm ngược 3-2-1 → đồng hồ chạy lên.
 * Báo khi đạt mức tối thiểu, tự ghi khi đạt mức tối đa, hoặc bấm "Xong" để ghi số giây đã giữ.
 */
export default function TimedStep({
  exercise,
  item,
  last,
  busy,
  onLog,
  signal,
}: {
  exercise: WorkoutExercise;
  item: PlannedItem;
  last?: number[];
  busy: boolean;
  onLog: (seconds: number) => void;
  signal: (beeps: number) => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const now = useNow(100, mode.kind !== "idle");
  const min = item.secondsMin ?? 0;
  const max = item.secondsMax ?? min;
  const lastBeep = useRef<string>("");
  const logged = useRef(false);

  const countdownLeft = mode.kind === "countdown" ? mode.startsAt - now : 0;
  const elapsedMs = mode.kind === "hold" ? Math.max(0, now - mode.startedAt) : 0;
  const elapsed = Math.floor(elapsedMs / 1000);

  useEffect(() => {
    // Mỗi mốc chỉ báo một lần.
    const once = (key: string, beeps: number) => {
      if (lastBeep.current === key) return;
      lastBeep.current = key;
      signal(beeps);
    };
    if (mode.kind === "countdown") {
      if (countdownLeft <= 0) {
        once("go", 2);
        setMode({ kind: "hold", startedAt: mode.startsAt });
      } else once(`cd-${Math.ceil(countdownLeft / 1000)}`, 1);
    }
    if (mode.kind === "hold") {
      if (elapsed >= max && max > 0 && !logged.current) {
        logged.current = true;
        once("max", 3);
        onLog(max);
      } else if (elapsed >= min && min > 0 && min < max) once("min", 1);
    }
  }, [mode, countdownLeft, elapsed, min, max, onLog, signal]);

  return (
    <div className="space-y-5">
      <ExerciseHeader exercise={exercise} item={item} last={last} />

      <div className="text-center" aria-live="polite">
        {mode.kind === "countdown" ? (
          <p className="text-7xl font-bold tabular-nums">{Math.ceil(countdownLeft / 1000)}</p>
        ) : (
          <p className="text-6xl font-bold tabular-nums">{formatClock(elapsedMs)}</p>
        )}
        {mode.kind === "hold" && elapsed >= min && (
          <p className="text-muted-foreground mt-1 text-sm">Đã đạt mức tối thiểu</p>
        )}
      </div>

      <ActionBar>
        {mode.kind === "idle" && (
          <Button
            className="h-14 w-full text-base"
            disabled={busy}
            onClick={() => {
              logged.current = false;
              setMode({ kind: "countdown", startsAt: Date.now() + COUNTDOWN_MS });
            }}
          >
            <Play className="size-5" aria-hidden />
            Bắt đầu giữ
          </Button>
        )}
        {mode.kind === "countdown" && (
          <Button
            variant="outline"
            className="h-14 w-full text-base"
            onClick={() => setMode({ kind: "idle" })}
          >
            Hủy
          </Button>
        )}
        {mode.kind === "hold" && (
          <Button
            className="h-14 w-full text-base"
            disabled={busy}
            onClick={() => {
              if (logged.current) return;
              logged.current = true;
              onLog(Math.max(1, Math.min(elapsed, max || elapsed)));
            }}
          >
            Xong — {elapsed} giây
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
