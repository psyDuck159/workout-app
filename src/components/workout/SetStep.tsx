"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import ExerciseMedia from "@/components/ExerciseMedia";
import { Button } from "@/components/ui/button";
import { prefillValue, type PlannedItem } from "@/domain/session";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "./types";

export const bandLevels = [
  { value: "band-light", label: "Dây nhẹ" },
  { value: "band-medium", label: "Dây vừa" },
  { value: "band-heavy", label: "Dây nặng" },
] as const;

export function targetText(item: PlannedItem): string {
  const range = (min?: number, max?: number) => (min === max ? `${min}` : `${min}–${max}`);
  if (item.measure === "time") return `${range(item.secondsMin, item.secondsMax)} giây`;
  const suffix = item.measure === "reps_each_side" ? " lần mỗi bên" : " lần";
  return `${range(item.repsMin, item.repsMax)}${suffix}`;
}

export function ExerciseHeader({
  exercise,
  item,
  last,
}: {
  exercise: WorkoutExercise;
  item: PlannedItem;
  last?: number[];
}) {
  const unit = item.measure === "time" ? " giây" : "";
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{exercise.nameVi}</h1>
      <ExerciseMedia
        frames={exercise.frames}
        alt={`Minh họa ${exercise.nameVi}`}
        className="mx-auto max-w-56"
      />
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Mục tiêu</dt>
          <dd className="font-medium">{targetText(item)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lần trước</dt>
          <dd className="font-medium">
            {last && last.length > 0 ? last.map((v) => `${v}${unit}`).join(" · ") : "Chưa có"}
          </dd>
        </div>
      </dl>
      {exercise.cues.length > 0 && (
        <ul className="text-muted-foreground list-disc space-y-0.5 pl-5 text-sm">
          {exercise.cues.map((c) => (
            <li key={c}>Tránh: {c.charAt(0).toLowerCase() + c.slice(1)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ghi hiệp đo bằng số lần: một chạm "Xong" với số điền sẵn, chỉnh bằng −/+ nếu khác. */
export default function SetStep({
  exercise,
  item,
  setIndex,
  last,
  busy,
  onLog,
}: {
  exercise: WorkoutExercise;
  item: PlannedItem;
  setIndex: number;
  last?: number[];
  busy: boolean;
  onLog: (reps: number, assistance?: string) => void;
}) {
  const [value, setValue] = useState(() => prefillValue(item, setIndex, last));
  const [band, setBand] = useState<string>("band-medium");
  const each = item.measure === "reps_each_side" ? " mỗi bên" : "";

  return (
    <div className="space-y-5">
      <ExerciseHeader exercise={exercise} item={item} last={last} />

      {exercise.assistance === "band" && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Mức dây hỗ trợ</legend>
          <div className="grid grid-cols-3 gap-2">
            {bandLevels.map((b) => (
              <label
                key={b.value}
                className="has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-ring/50 flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm has-[:focus-visible]:ring-[3px]"
              >
                <input
                  type="radio"
                  name="band"
                  value={b.value}
                  checked={band === b.value}
                  onChange={() => setBand(b.value)}
                  className="sr-only"
                />
                {b.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center justify-center gap-6" role="group" aria-label="Số lần">
        <StepButton label="Bớt 1 lần" onClick={() => setValue((v) => Math.max(0, v - 1))}>
          <Minus className="size-6" />
        </StepButton>
        <output className="w-24 text-center text-5xl font-bold tabular-nums" aria-live="polite">
          {value}
        </output>
        <StepButton label="Thêm 1 lần" onClick={() => setValue((v) => v + 1)}>
          <Plus className="size-6" />
        </StepButton>
      </div>

      <ActionBar>
        <Button
          className="h-14 w-full text-base"
          disabled={busy}
          onClick={() => onLog(value, exercise.assistance === "band" ? band : undefined)}
        >
          <Check className="size-5" aria-hidden />
          Xong — {value} lần{each}
        </Button>
      </ActionBar>
    </div>
  );
}

export function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="hover:bg-accent focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full border outline-none focus-visible:ring-[3px]"
    >
      {children}
    </button>
  );
}

/** Thanh nút chính cố định ở nửa dưới màn hình, dễ chạm bằng một tay (NFR-USE-02). */
export function ActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto max-w-md space-y-2">{children}</div>
    </div>
  );
}
