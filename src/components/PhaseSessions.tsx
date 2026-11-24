"use client";

import Link from "next/link";
import type { Exercise, Gear, Ladder, SessionTemplate } from "@/content/schema";
import { gearLabels } from "@/content/labels";
import { useLadderStates, useProfile } from "@/data/hooks";
import { currentExerciseOf } from "@/domain/profile";
import { formatRest, formatTarget } from "@/domain/format";

export type SessionExercise = Pick<Exercise, "id" | "nameVi" | "equipment" | "measure">;

interface PhaseSessionsProps {
  sessions: SessionTemplate[];
  ladders: Ladder[];
  exercises: SessionExercise[];
}

const NO_GEAR: Gear[] = [];

export default function PhaseSessions({ sessions, ladders, exercises }: PhaseSessionsProps) {
  const { data: profile, loading } = useProfile();
  const { data: ladderStates } = useLadderStates();
  const gear = profile?.gear ?? NO_GEAR;
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const laddersById = new Map(ladders.map((l) => [l.id, l]));
  const states = ladderStates ?? new Map();

  if (loading) return null;

  return (
    <div className="space-y-6">
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
            để chương trình chọn bài theo dụng cụ của bạn.
          </p>
        )}
      </div>

      {sessions.map((session) => (
        <section key={session.id} className="space-y-3">
          <h2 className="text-lg font-semibold">
            Buổi {session.id} — {session.titleVi}
          </h2>
          <ol className="space-y-2">
            {session.items.map((item, index) => {
              if (item.requires && !gear.includes(item.requires)) return null;
              const ladder = item.ladderId ? laddersById.get(item.ladderId) : undefined;
              const exercise = ladder
                ? currentExerciseOf(ladder, states, exercisesById, gear)
                : exercisesById.get(item.exerciseId!);
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
                    {ladder ? `${ladder.nameVi} · ` : ""}Nghỉ {formatRest(item.restSec)}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
