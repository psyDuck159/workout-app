import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkoutDB } from "./db";
import { createRepositories, type NewSession, type Repositories } from "./repositories";
import { initialPlayer, reducePlayer, type PlannedItem } from "@/domain/session";

const plan: PlannedItem[] = [
  { exerciseId: "push-up", measure: "reps", sets: 2, repsMin: 8, repsMax: 12, restSec: 90 },
  { exerciseId: "plank", measure: "time", sets: 1, secondsMin: 20, secondsMax: 40, restSec: 60 },
];
const newSession = (): NewSession => ({
  programId: "p",
  phaseId: "foundation",
  sessionTemplateId: "A",
  titleVi: "Buổi A",
  plan,
  player: initialPlayer(plan),
});

let db: WorkoutDB;
let repos: Repositories;
let clock: number;
let counter = 0;

beforeEach(() => {
  db = new WorkoutDB(`sessions-${++counter}`);
  clock = Date.parse("2026-11-24T08:00:00.000Z");
  repos = createRepositories(
    () => db,
    () => new Date((clock += 1000)),
  );
});

afterEach(async () => {
  await db.delete();
});

describe("buổi tập", () => {
  it("chỉ cho một buổi đang tập; bỏ buổi thì bắt đầu được buổi mới", async () => {
    const first = await repos.startSession(newSession());
    expect((await repos.getActiveSession())?.id).toBe(first.id);
    await expect(repos.startSession(newSession())).rejects.toThrow("buổi tập dở");

    await repos.abandonSession(first.id);
    expect(await repos.getActiveSession()).toBeUndefined();
    expect((await db.sessions.get(first.id))?.status).toBe("abandoned");
    await expect(repos.startSession(newSession())).resolves.toBeDefined();
  });

  it("ghi hiệp và trạng thái player cùng lúc; tải lại thấy đúng vị trí", async () => {
    const session = await repos.startSession(newSession());
    const next = reducePlayer(session.player, plan, { type: "logSet", now: 1 });
    await repos.logSet(session.id, { exerciseId: "push-up", setIndex: 0, reps: 10 }, next);

    const reloaded = await repos.getActiveSession();
    expect(reloaded?.player).toEqual(next);
    expect(await repos.getSessionSets(session.id)).toMatchObject([
      { sessionId: session.id, exerciseId: "push-up", setIndex: 0, reps: 10 },
    ]);
  });

  it("không ghi được hiệp vào buổi đã kết thúc", async () => {
    const session = await repos.startSession(newSession());
    await repos.completeSession(session.id, { ...session.player, phase: { kind: "done" } });
    await expect(
      repos.logSet(session.id, { exerciseId: "push-up", setIndex: 0, reps: 10 }, session.player),
    ).rejects.toThrow("không còn diễn ra");
    expect(await repos.getSessionSets(session.id)).toEqual([]);
  });

  it("kết thúc buổi ghi đánh giá thành RPE vào hiệp cuối của bài", async () => {
    const session = await repos.startSession(newSession());
    await repos.logSet(
      session.id,
      { exerciseId: "push-up", setIndex: 0, reps: 10 },
      session.player,
    );
    await repos.logSet(session.id, { exerciseId: "push-up", setIndex: 1, reps: 9 }, session.player);
    const rated = reducePlayer(session.player, plan, { type: "rate", item: 0, rating: "hard" });
    await repos.completeSession(session.id, { ...rated, phase: { kind: "done" } });

    const sets = await repos.getSessionSets(session.id);
    expect(sets.map((s) => s.rpe)).toEqual([undefined, 9]);
    const stored = await db.sessions.get(session.id);
    expect(stored?.status).toBe("completed");
    expect(stored?.endedAt).toBeDefined();

    await repos.rateExercise(session.id, 0, "easy");
    expect((await repos.getSessionSets(session.id))[1].rpe).toBe(6);
  });

  it("báo đau đánh dấu hiệp cuối và tạo đề xuất hạ bậc chờ xử lý", async () => {
    const session = await repos.startSession(newSession());
    await repos.logSet(
      session.id,
      { exerciseId: "push-up", setIndex: 0, reps: 10 },
      session.player,
    );
    const next = reducePlayer(session.player, plan, { type: "reportPain" });
    await repos.reportPain(session.id, next, "push-up", "Đau vai");

    expect((await repos.getSessionSets(session.id))[0].painReported).toBe(true);
    expect(await db.suggestions.toArray()).toMatchObject([
      { exerciseId: "push-up", kind: "regress", status: "pending", reasonVi: "Đau vai" },
    ]);
    expect((await repos.getActiveSession())?.player.items[0].pain).toBe(true);
  });

  it("'Lần trước' lấy buổi gần nhất khác buổi hiện tại; kỷ lục bỏ qua buổi hiện tại", async () => {
    const old = await repos.startSession(newSession());
    await repos.logSet(old.id, { exerciseId: "push-up", setIndex: 1, reps: 8 }, old.player);
    await repos.logSet(old.id, { exerciseId: "push-up", setIndex: 0, reps: 9 }, old.player);
    await repos.completeSession(old.id, old.player);

    const current = await repos.startSession(newSession());
    await repos.logSet(
      current.id,
      { exerciseId: "push-up", setIndex: 0, reps: 12 },
      current.player,
    );

    expect(await repos.getLastPerformance("push-up", current.id)).toEqual([9, 8]);
    expect(await repos.getLastPerformance("plank", current.id)).toBeUndefined();
    expect(await repos.getBests(["push-up", "plank"], current.id)).toEqual(
      new Map([["push-up", 9]]),
    );
  });
});
