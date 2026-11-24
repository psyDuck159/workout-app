"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useActiveSession, useProfile, useRepositories, useSettings } from "@/data/hooks";
import type { Settings, WorkoutSession } from "@/data/types";
import { easierExercise } from "@/domain/ladder";
import {
  currentPosition,
  reducePlayer,
  type PlayerEvent,
  type PlayerState,
} from "@/domain/session";
import { remainingMs } from "@/domain/timer";
import { beep } from "@/platform/audio";
import { vibrate } from "@/platform/haptics";
import { useWakeLock } from "@/platform/wakeLock";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import RestStep from "./RestStep";
import SetStep from "./SetStep";
import TimedStep from "./TimedStep";
import WorkoutSummary from "./WorkoutSummary";
import type { WorkoutExercise, WorkoutLadder } from "./types";
import { useNow } from "./useNow";

interface WorkoutPlayerProps {
  catalog: WorkoutExercise[];
  ladders: WorkoutLadder[];
}

export default function WorkoutPlayer({ catalog, ladders }: WorkoutPlayerProps) {
  const { data: active, loading } = useActiveSession();
  const { data: settings } = useSettings();
  const [finishedId, setFinishedId] = useState<string>();
  const exercisesById = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);

  useWakeLock(Boolean(active && settings?.keepAwake));

  if (finishedId) return <WorkoutSummary sessionId={finishedId} exercisesById={exercisesById} />;
  if (loading) return null;
  if (!active) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p>Chưa có buổi tập nào đang diễn ra.</p>
        <Link href="/program" className={buttonVariants()}>
          Chọn buổi tập
        </Link>
      </div>
    );
  }

  return (
    <ActivePlayer
      key={active.id}
      session={active}
      exercisesById={exercisesById}
      ladders={ladders}
      settings={settings}
      onFinished={setFinishedId}
    />
  );
}

function ActivePlayer({
  session,
  exercisesById,
  ladders,
  settings,
  onFinished,
}: {
  session: WorkoutSession;
  exercisesById: ReadonlyMap<string, WorkoutExercise>;
  ladders: WorkoutLadder[];
  settings: Settings | undefined;
  onFinished: (sessionId: string) => void;
}) {
  const repos = useRepositories();
  const { data: profile } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmPain, setConfirmPain] = useState(false);
  const [painAdvice, setPainAdvice] = useState<{ name: string; easier?: string }>();
  const [last, setLast] = useState<{ exerciseId: string; values?: number[] }>();

  const { plan, player } = session;
  const { phase } = player;
  const position = currentPosition(player);
  const item = position ? plan[position.item] : undefined;
  const exercise = item ? exercisesById.get(item.exerciseId) : undefined;
  const now = useNow(250, phase.kind === "rest");

  // "Lần trước" của bài hiện tại.
  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    repos.getLastPerformance(item.exerciseId, session.id).then((values) => {
      if (!cancelled) setLast({ exerciseId: item.exerciseId, values });
    });
    return () => {
      cancelled = true;
    };
  }, [repos, item?.exerciseId, session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const signal = useCallback(
    (beeps: number) => {
      if (settings?.sound !== false) beep(beeps);
      if (settings?.vibration !== false) vibrate(beeps > 1 ? [200, 100, 200] : 120);
    },
    [settings?.sound, settings?.vibration],
  );

  const run = useCallback(
    async (event: PlayerEvent, write?: (next: PlayerState) => Promise<void>) => {
      setBusy(true);
      setError(undefined);
      try {
        const next = reducePlayer(session.player, session.plan, event);
        if (write) await write(next);
        if (next.phase.kind === "done") {
          await repos.completeSession(session.id, next);
          onFinished(session.id);
        } else if (!write) {
          await repos.updatePlayer(session.id, next);
        }
      } catch {
        setError("Không lưu được. Hãy thử lại.");
      } finally {
        setBusy(false);
      }
    },
    [repos, session, onFinished],
  );

  // Hết giờ nghỉ: báo và tự sang hiệp tiếp theo (chỉ một lần cho mỗi mốc).
  const handledRest = useRef<number>(0);
  useEffect(() => {
    if (phase.kind !== "rest" || handledRest.current === phase.endsAt) return;
    if (remainingMs(phase.endsAt, now) > 0) return;
    handledRest.current = phase.endsAt;
    // Không kêu nếu đã quá giờ lâu (VD: mở lại app sau một lúc).
    if (now - phase.endsAt < 5000) signal(3);
    void run({ type: "restElapsed" });
  }, [phase, now, run, signal]);

  const logValue = useCallback(
    (value: number, assistance?: string) => {
      if (!item || !position) return;
      void run({ type: "logSet", now: Date.now() }, (next) =>
        repos.logSet(
          session.id,
          {
            exerciseId: item.exerciseId,
            setIndex: position.set,
            ...(item.measure === "time" ? { seconds: value } : { reps: value }),
            ...(assistance && { assistance }),
          },
          next,
        ),
      );
    },
    [item, position, repos, run, session.id],
  );

  function reportPain() {
    if (!item || !exercise) return;
    setConfirmPain(false);
    const ladder = ladders.find((l) => l.id === item.ladderId);
    const easier = ladder
      ? easierExercise(ladder, item.exerciseId, exercisesById, profile?.gear ?? [])
      : undefined;
    const reason = `Bạn báo đau/khó chịu khi tập ${exercise.nameVi}.`;
    void run({ type: "reportPain" }, (next) =>
      repos.reportPain(session.id, next, item.exerciseId, reason),
    );
    setPainAdvice({ name: exercise.nameVi, easier: easier?.nameVi });
  }

  const totalSets = player.items.reduce((n, p) => n + p.sets, 0);
  const doneSets = player.items.reduce((n, p) => n + p.done, 0);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <p className="font-medium">{session.titleVi}</p>
          {position && (
            <p className="text-muted-foreground whitespace-nowrap" aria-live="polite">
              Bài {position.item + 1}/{plan.length} · Hiệp{" "}
              {Math.min(position.set + 1, player.items[position.item].sets)}/
              {player.items[position.item].sets}
            </p>
          )}
        </div>
        <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${(doneSets / Math.max(1, totalSets)) * 100}%` }}
          />
        </div>
      </header>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {phase.kind === "rest" && item && exercise && (
        <RestStep
          endsAt={phase.endsAt}
          restSec={item.restSec}
          now={now}
          nextLabel={`${exercise.nameVi} · Hiệp ${player.items[phase.item].done + 1}/${player.items[phase.item].sets}`}
          finished={
            phase.finishedItem !== undefined
              ? {
                  name: exercisesById.get(plan[phase.finishedItem].exerciseId)?.nameVi ?? "",
                  rating: player.items[phase.finishedItem].rating,
                }
              : undefined
          }
          busy={busy}
          onAdjust={(deltaMs) => run({ type: "adjustRest", deltaMs, now: Date.now() })}
          onSkip={() => run({ type: "skipRest" })}
          onAddSet={() => run({ type: "addSet" })}
          onRate={(rating) =>
            phase.finishedItem !== undefined &&
            run({ type: "rate", item: phase.finishedItem, rating })
          }
        />
      )}

      {phase.kind === "exercise" &&
        item &&
        exercise &&
        position &&
        last?.exerciseId === item.exerciseId &&
        (item.measure === "time" ? (
          <TimedStep
            key={`${position.item}-${position.set}`}
            exercise={exercise}
            item={item}
            last={last.values}
            busy={busy}
            onLog={logValue}
            signal={signal}
          />
        ) : (
          <SetStep
            key={`${position.item}-${position.set}`}
            exercise={exercise}
            item={item}
            setIndex={position.set}
            last={last.values}
            busy={busy}
            onLog={logValue}
          />
        ))}

      {phase.kind === "exercise" && (
        <nav aria-label="Tùy chọn bài tập" className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" disabled={busy} onClick={() => run({ type: "skipExercise" })}>
            Bỏ qua bài
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => run({ type: "addSet" })}>
            Thêm hiệp
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            className="border-destructive/40 text-destructive"
            onClick={() => setConfirmPain(true)}
          >
            Đau / khó chịu
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmFinish(true)}>
            Kết thúc buổi
          </Button>
        </nav>
      )}

      <Dialog
        open={confirmPain}
        onClose={() => setConfirmPain(false)}
        title="Bạn thấy đau hoặc khó chịu?"
      >
        <p className="text-muted-foreground mb-4 text-sm">
          Ứng dụng sẽ dừng bài này và ghi lại để lần sau gợi ý bậc dễ hơn.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmPain(false)}>
            Không
          </Button>
          <Button onClick={reportPain}>Dừng bài này</Button>
        </div>
      </Dialog>

      <Dialog
        open={painAdvice !== undefined}
        onClose={() => setPainAdvice(undefined)}
        title="Đã dừng bài"
      >
        <div className="space-y-2 text-sm">
          <p>Hãy nghỉ ngơi. Nếu đau nhói, sưng hoặc đau kéo dài, ngừng tập và hỏi ý kiến bác sĩ.</p>
          {painAdvice?.easier && (
            <p>
              Lần sau, thử bậc dễ hơn: <span className="font-medium">{painAdvice.easier}</span>.
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setPainAdvice(undefined)}>Đã hiểu</Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Kết thúc buổi tập?"
      >
        <p className="text-muted-foreground mb-4 text-sm">
          Các hiệp đã ghi được giữ lại. Bài chưa tập sẽ được tính là bỏ qua.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmFinish(false)}>
            Tập tiếp
          </Button>
          <Button
            onClick={() => {
              setConfirmFinish(false);
              void run({ type: "finish" });
            }}
          >
            Kết thúc
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
