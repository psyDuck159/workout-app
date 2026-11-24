"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { ProgramClientData } from "@/content/client";
import { useActiveSession, useCompletedSessions, useLadderStates, useProfile } from "@/data/hooks";
import { formatTarget } from "@/domain/format";
import { adjustmentsFor, computeSchedule } from "@/domain/schedule";
import { Button, buttonVariants } from "@/components/ui/button";
import { planFor, useStartSession } from "./useStartSession";

/** "Hôm nay": buổi tiếp theo trong hàng đợi, tiến độ giai đoạn, bắt đầu bằng một chạm (FR-PRG-09). */
export default function TodayCard({ data }: { data: ProgramClientData }) {
  const { data: profile } = useProfile();
  const { data: completed } = useCompletedSessions();
  const { data: ladderStates } = useLadderStates();
  const { data: active } = useActiveSession();
  const { start, starting, error } = useStartSession(data);

  if (!profile || !completed || !ladderStates || active === undefined) return null;

  const schedule = computeSchedule(data.program, completed, profile.daysPerWeek);
  const phase = data.program.phases[schedule.phaseIndex];
  const template = phase.sessions.find((s) => s.id === schedule.nextTemplateId)!;
  const adjustments = adjustmentsFor(schedule);
  const plan = planFor(data, phase.id, template.id, ladderStates, profile.gear, adjustments);
  const names = new Map(data.exercises.map((e) => [e.id, e]));
  const today = new Date().getDay();
  const restDay =
    profile.preferredDays &&
    profile.preferredDays.length > 0 &&
    !profile.preferredDays.includes(today);

  return (
    <section aria-labelledby="today-title" className="bg-card space-y-4 rounded-lg border p-4">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">Buổi tiếp theo</p>
        <h2 id="today-title" className="text-xl font-semibold">
          Buổi {template.id} — {template.titleVi}
        </h2>
        <p className="text-muted-foreground text-sm">
          {phase.titleVi.replace(/:.*/, "")} · Tuần {schedule.week}/{schedule.weeks} ·{" "}
          {schedule.sessionsDone}/{schedule.sessionsTotal} buổi
        </p>
        <div
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Tiến độ giai đoạn"
          aria-valuenow={Math.round(schedule.phaseProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-primary h-full"
            style={{ width: `${schedule.phaseProgress * 100}%` }}
          />
        </div>
      </header>

      {(schedule.isDeloadWeek || schedule.isComeback || schedule.programComplete) && (
        <ul className="space-y-1 text-sm">
          {schedule.programComplete && (
            <li>🎉 Bạn đã hoàn thành cả chương trình — đang lặp lại giai đoạn cuối.</li>
          )}
          {schedule.isDeloadWeek && (
            <li>
              <span className="font-medium">Tuần giảm tải:</span> bớt khoảng một nửa số hiệp để cơ
              thể hồi phục.
            </li>
          )}
          {schedule.isComeback && (
            <li>
              <span className="font-medium">Buổi khởi động lại:</span> đã {schedule.daysSinceLast}{" "}
              ngày chưa tập, buổi này nhẹ hơn một chút.
            </li>
          )}
        </ul>
      )}

      {(schedule.trainedToday || restDay) && (
        <p className="bg-muted/60 rounded-md p-3 text-sm">
          {schedule.trainedToday
            ? "Bạn đã tập hôm nay. Nghỉ ngơi cũng là một phần của tập luyện — buổi này vẫn chờ bạn ở lần tới."
            : "Hôm nay không phải ngày tập theo lịch của bạn. Tập bù cũng được — lịch không tính lỡ buổi."}
        </p>
      )}

      <ol className="space-y-1 text-sm">
        {plan.map((item, index) => {
          const exercise = names.get(item.exerciseId);
          return (
            <li key={index} className="flex justify-between gap-2">
              <span>{exercise?.nameVi}</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {exercise && formatTarget(item, exercise.measure)}
              </span>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {active ? (
        <Link href="/workout" className={buttonVariants({ className: "h-12 w-full" })}>
          Tiếp tục buổi đang tập
        </Link>
      ) : (
        <Button
          className="h-12 w-full text-base"
          disabled={starting !== undefined || plan.length === 0}
          onClick={() => start(phase.id, template.id, plan)}
        >
          <Play className="size-5" aria-hidden />
          {starting ? "Đang mở…" : `Bắt đầu buổi ${template.id}`}
        </Button>
      )}
    </section>
  );
}
