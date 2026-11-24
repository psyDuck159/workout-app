"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import type { Exercise, Gear, Ladder, SessionTemplate } from "@/content/schema";
import { gearLabels } from "@/content/labels";
import { useActiveSession, useLadderStates, useProfile, useRepositories } from "@/data/hooks";
import { buildSessionPlan } from "@/domain/plan";
import { formatRest, formatTarget } from "@/domain/format";
import { initialPlayer } from "@/domain/session";
import { unlockAudio } from "@/platform/audio";
import { Button } from "@/components/ui/button";
import ActiveSessionBanner from "@/components/workout/ActiveSessionBanner";

export type SessionExercise = Pick<Exercise, "id" | "nameVi" | "equipment" | "measure">;

interface PhaseSessionsProps {
  programId: string;
  phaseId: string;
  sessions: SessionTemplate[];
  ladders: Ladder[];
  exercises: SessionExercise[];
}

const NO_GEAR: Gear[] = [];

export default function PhaseSessions({
  programId,
  phaseId,
  sessions,
  ladders,
  exercises,
}: PhaseSessionsProps) {
  const router = useRouter();
  const repos = useRepositories();
  const { data: profile, loading } = useProfile();
  const { data: ladderStates } = useLadderStates();
  const { data: active } = useActiveSession();
  const [starting, setStarting] = useState<string>();
  const [error, setError] = useState<string>();
  const gear = profile?.gear ?? NO_GEAR;
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const laddersById = new Map(ladders.map((l) => [l.id, l]));
  const ladderById = new Map(ladders.map((l) => [l.id, l.nameVi]));

  if (loading) return null;

  async function start(session: SessionTemplate) {
    unlockAudio(); // iOS chỉ cho phát âm thanh sau một thao tác chạm.
    setStarting(session.id);
    setError(undefined);
    try {
      const plan = buildSessionPlan(
        session,
        laddersById,
        exercisesById,
        ladderStates ?? new Map(),
        gear,
      );
      await repos.startSession({
        programId,
        phaseId,
        sessionTemplateId: session.id,
        titleVi: `Buổi ${session.id} — ${session.titleVi}`,
        plan,
        player: initialPlayer(plan),
      });
      router.push("/workout");
    } catch {
      setError("Không bắt đầu được buổi tập.");
      setStarting(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <ActiveSessionBanner />

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
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
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {sessions.map((session) => {
        const plan = buildSessionPlan(
          session,
          laddersById,
          exercisesById,
          ladderStates ?? new Map(),
          gear,
        );
        return (
          <section key={session.id} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Buổi {session.id} — {session.titleVi}
              </h2>
              {profile && !active && (
                <Button onClick={() => start(session)} disabled={starting !== undefined}>
                  <Play className="size-4" aria-hidden />
                  {starting === session.id ? "Đang mở…" : `Bắt đầu buổi ${session.id}`}
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
                      {item.ladderId ? `${ladderById.get(item.ladderId)} · ` : ""}Nghỉ{" "}
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
