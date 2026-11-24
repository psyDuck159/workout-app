"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { ProgramClientData } from "@/content/client";
import type { Gear } from "@/content/schema";
import { gearLabels } from "@/content/labels";
import { useActiveSession, useCompletedSessions, useLadderStates, useProfile } from "@/data/hooks";
import { formatRest, formatTarget } from "@/domain/format";
import { adjustmentsFor, computeSchedule } from "@/domain/schedule";
import { Button } from "@/components/ui/button";
import ActiveSessionBanner from "@/components/workout/ActiveSessionBanner";
import { planFor, useStartSession } from "@/components/workout/useStartSession";

const NO_GEAR: Gear[] = [];

export default function PhaseSessions({
  data,
  phaseId,
}: {
  data: ProgramClientData;
  phaseId: string;
}) {
  const { data: profile, loading } = useProfile();
  const { data: ladderStates } = useLadderStates();
  const { data: active } = useActiveSession();
  const { data: completed } = useCompletedSessions();
  const { start, starting, error } = useStartSession(data);

  if (loading) return null;

  const phase = data.program.phases.find((p) => p.id === phaseId)!;
  const gear = profile?.gear ?? NO_GEAR;
  const exercisesById = new Map(data.exercises.map((e) => [e.id, e]));
  const ladderNames = new Map(data.ladders.map((l) => [l.id, l.nameVi]));
  const schedule =
    profile && completed
      ? computeSchedule(data.program, completed, profile.daysPerWeek)
      : undefined;
  // Tuần giảm tải / buổi khởi động lại chỉ áp dụng cho giai đoạn đang tập.
  const adjustments = schedule?.phaseId === phaseId ? adjustmentsFor(schedule) : [];

  return (
    <div className="space-y-6">
      <ActiveSessionBanner />

      <div className="bg-muted/50 space-y-1 rounded-lg p-4 text-sm">
        {profile ? (
          <p>
            <span className="font-medium">Dụng cụ: </span>
            {gear.length > 0 ? gear.map((g) => gearLabels[g]).join(", ") : "Không có"} ·{" "}
            <Link href="/settings" className="underline">
              Đổi trong Cài đặt
            </Link>
          </p>
        ) : (
          <p>
            Đang hiển thị bài không cần dụng cụ.{" "}
            <Link href="/welcome" className="underline">
              Thiết lập hồ sơ
            </Link>{" "}
            để chương trình chọn bài theo dụng cụ của bạn và bắt đầu tập.
          </p>
        )}
        {schedule?.phaseId === phaseId && (
          <p>
            Bạn đang ở tuần {schedule.week}/{schedule.weeks} của giai đoạn này
            {schedule.isDeloadWeek && " — tuần giảm tải, số hiệp đã được giảm"}.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {phase.sessions.map((session) => {
        const plan = planFor(
          data,
          phaseId,
          session.id,
          ladderStates ?? new Map(),
          gear,
          adjustments,
        );
        return (
          <section key={session.id} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Buổi {session.id} — {session.titleVi}
              </h2>
              {profile && !active && (
                <Button
                  onClick={() => start(phaseId, session.id, plan)}
                  disabled={starting !== undefined}
                >
                  <Play className="size-4" aria-hidden />
                  {starting === `${phaseId}/${session.id}`
                    ? "Đang mở…"
                    : `Bắt đầu buổi ${session.id}`}
                </Button>
              )}
            </div>
            <ol className="space-y-2">
              {plan.map((item, index) => {
                const exercise = exercisesById.get(item.exerciseId);
                if (!exercise) return null;
                return (
                  <li key={index} className="bg-card rounded-lg border p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/exercises/${exercise.id}`}
                        className="font-medium hover:underline"
                      >
                        {exercise.nameVi}
                      </Link>
                      <span className="text-sm whitespace-nowrap">
                        {formatTarget(item, exercise.measure)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.ladderId ? `${ladderNames.get(item.ladderId)} · ` : ""}Nghỉ{" "}
                      {formatRest(item.restSec)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
