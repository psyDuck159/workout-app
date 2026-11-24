"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Rating } from "@/domain/session";
import { formatClock, remainingMs } from "@/domain/timer";
import { cn } from "@/lib/utils";
import { ActionBar } from "./SetStep";

export const ratingOptions: { value: Rating; label: string }[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Vừa" },
  { value: "hard", label: "Khó" },
];

export function RatingChips({
  value,
  onChange,
  label,
}: {
  value?: Rating;
  onChange: (rating: Rating) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2">
      {ratingOptions.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={value === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            "focus-visible:ring-ring/50 h-11 rounded-md border text-sm font-medium outline-none focus-visible:ring-[3px]",
            value === r.value
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-accent",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

/** Màn hình nghỉ: đồng hồ theo mốc tuyệt đối, chỉnh ±15 giây, xem trước bài tiếp theo. */
export default function RestStep({
  endsAt,
  restSec,
  now,
  nextLabel,
  finished,
  busy,
  onAdjust,
  onSkip,
  onAddSet,
  onRate,
}: {
  endsAt: number;
  restSec: number;
  now: number;
  nextLabel: string;
  finished?: { name: string; rating?: Rating };
  busy: boolean;
  onAdjust: (deltaMs: number) => void;
  onSkip: () => void;
  onAddSet: () => void;
  onRate: (rating: Rating) => void;
}) {
  const left = remainingMs(endsAt, now);
  const progress = Math.min(1, left / Math.max(1, restSec * 1000));
  const r = 88;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nghỉ</h1>

      <div className="relative mx-auto size-56">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r={r} className="stroke-muted fill-none" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={r}
            className="stroke-primary fill-none transition-[stroke-dashoffset] duration-300"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <p
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold tabular-nums"
          role="timer"
          aria-label="Thời gian nghỉ còn lại"
        >
          {formatClock(left)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onAdjust(-15_000)} disabled={busy}>
          −15 giây
        </Button>
        <Button variant="outline" onClick={() => onAdjust(15_000)} disabled={busy}>
          +15 giây
        </Button>
      </div>

      {finished && (
        <section className="space-y-2">
          <p className="text-sm font-medium">{finished.name} thế nào?</p>
          <RatingChips
            value={finished.rating}
            onChange={onRate}
            label={`Đánh giá ${finished.name}`}
          />
          <Button variant="ghost" className="w-full" onClick={onAddSet} disabled={busy}>
            <Plus className="size-4" aria-hidden />
            Thêm một hiệp bài này
          </Button>
        </section>
      )}

      <p className="text-muted-foreground text-center text-sm">Tiếp theo: {nextLabel}</p>

      <ActionBar>
        <Button className="h-14 w-full text-base" onClick={onSkip} disabled={busy}>
          Bỏ qua nghỉ
        </Button>
      </ActionBar>
    </div>
  );
}
