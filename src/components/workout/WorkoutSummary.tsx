"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useRepositories, useSession, useSessionSets } from "@/data/hooks";
import { summarize } from "@/domain/session";
import { formatDuration } from "@/domain/timer";
import { buttonVariants } from "@/components/ui/button";
import { RatingChips } from "./RestStep";
import SuggestionList from "./SuggestionList";
import type { WorkoutExercise } from "./types";

/** Tóm tắt sau buổi tập (FR-WKP-12): thời lượng, kết quả từng bài, kỷ lục mới, đánh giá, ghi chú. */
export default function WorkoutSummary({
  sessionId,
  exercisesById,
}: {
  sessionId: string;
  exercisesById: ReadonlyMap<string, WorkoutExercise>;
}) {
  const repos = useRepositories();
  const { data: session } = useSession(sessionId);
  const { data: sets } = useSessionSets(sessionId);
  const [bests, setBests] = useState<Map<string, number>>();
  const [notes, setNotes] = useState<string>();

  const exerciseIds = session?.plan.map((p) => p.exerciseId).join(",");
  useEffect(() => {
    if (!exerciseIds) return;
    repos.getBests(exerciseIds.split(","), sessionId).then(setBests);
  }, [repos, exerciseIds, sessionId]);

  if (!session || !sets || !bests) return null;

  const summary = summarize(
    session.plan,
    session.player,
    sets,
    bests,
    Date.parse(session.startedAt),
    Date.parse(session.endedAt ?? session.startedAt),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Hoàn thành buổi tập!</h1>
        <p className="text-muted-foreground">
          {session.titleVi} · {formatDuration(summary.durationMs)} · {summary.totalSets} hiệp
        </p>
      </header>

      <ul className="space-y-3">
        {summary.exercises.map((e) => {
          const name = exercisesById.get(e.exerciseId)?.nameVi ?? e.exerciseId;
          const unit = e.measure === "time" ? " giây" : "";
          return (
            <li key={e.item} className="bg-card space-y-2 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{name}</p>
                <div className="flex shrink-0 gap-1 text-xs">
                  {e.isRecord && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700">
                      <Trophy className="size-3" aria-hidden />
                      Kỷ lục mới
                    </span>
                  )}
                  {e.pain && (
                    <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-medium">
                      Báo đau
                    </span>
                  )}
                  {e.skipped && (
                    <span className="bg-muted rounded-full px-2 py-0.5 font-medium">Bỏ qua</span>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {e.values.length > 0
                  ? e.values.map((v) => `${v}${unit}`).join(" · ")
                  : "Chưa tập hiệp nào"}
              </p>
              {e.values.length > 0 && (
                <RatingChips
                  label={`Đánh giá ${name}`}
                  value={e.rating}
                  onChange={(rating) => repos.rateExercise(sessionId, e.item, rating)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <SuggestionList
        sessionId={sessionId}
        exerciseNames={Object.fromEntries([...exercisesById.values()].map((e) => [e.id, e.nameVi]))}
      />

      <label className="block space-y-2">
        <span className="font-medium">Ghi chú</span>
        <textarea
          className="border-input bg-background focus-visible:ring-ring/50 min-h-24 w-full rounded-md border p-3 text-base outline-none focus-visible:ring-[3px]"
          placeholder="VD: hơi mỏi vai, lần sau ngủ sớm hơn…"
          value={notes ?? session.notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== undefined && repos.saveNotes(sessionId, notes)}
        />
      </label>

      <Link
        href="/"
        className={buttonVariants({ className: "h-14 w-full text-base" })}
        onClick={() => notes !== undefined && repos.saveNotes(sessionId, notes)}
      >
        Về trang chủ
      </Link>
    </div>
  );
}
