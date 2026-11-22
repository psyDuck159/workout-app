"use client";

import { useState } from "react";
import Link from "next/link";
import type { Exercise, Gear, Ladder, SessionTemplate } from "@/content/schema";
import { gearLabels } from "@/content/labels";
import { startingExercise } from "@/domain/ladder";
import { formatRest, formatTarget } from "@/domain/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type SessionExercise = Pick<Exercise, "id" | "nameVi" | "equipment" | "measure">;

interface PhaseSessionsProps {
  sessions: SessionTemplate[];
  ladders: Ladder[];
  exercises: SessionExercise[];
}

export default function PhaseSessions({ sessions, ladders, exercises }: PhaseSessionsProps) {
  // Tạm thời chọn dụng cụ tại chỗ; Sprint 2 sẽ lấy từ hồ sơ người dùng.
  const [gear, setGear] = useState<Gear[]>([]);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const laddersById = new Map(ladders.map((l) => [l.id, l]));

  const toggleGear = (g: Gear, on: boolean) =>
    setGear((prev) => (on ? [...prev, g] : prev.filter((x) => x !== g)));

  return (
    <div className="space-y-6">
      <fieldset className="bg-muted/50 rounded-lg p-4">
        <legend className="sr-only">Dụng cụ bạn có</legend>
        <p className="mb-3 text-sm font-medium">Dụng cụ bạn có</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {(Object.keys(gearLabels) as Gear[]).map((g) => (
            <div key={g} className="flex items-center gap-2">
              <Checkbox
                id={`gear-${g}`}
                checked={gear.includes(g)}
                onCheckedChange={(checked) => toggleGear(g, checked === true)}
                className="size-5"
              />
              <Label htmlFor={`gear-${g}`}>{gearLabels[g]}</Label>
            </div>
          ))}
        </div>
      </fieldset>

      {sessions.map((session) => (
        <section key={session.id} className="space-y-3">
          <h2 className="text-lg font-semibold">
            Buổi {session.id} — {session.titleVi}
          </h2>
          <ol className="space-y-2">
            {session.items.map((item, index) => {
              if (item.requires && !gear.includes(item.requires)) return null;
              const exercise = item.ladderId
                ? startingExercise(laddersById.get(item.ladderId)!, exercisesById, gear)
                : exercisesById.get(item.exerciseId!);
              if (!exercise) return null;
              const ladder = item.ladderId ? laddersById.get(item.ladderId) : undefined;

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

      <p className="text-muted-foreground text-sm">
        Hiển thị bậc khởi đầu của mỗi thang. Từ Sprint 4, ứng dụng sẽ tự đề xuất lên bậc khi bạn
        tiến bộ.
      </p>
    </div>
  );
}
