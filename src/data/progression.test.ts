import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkoutDB } from "./db";
import { createRepositories, type ProgressionContext, type Repositories } from "./repositories";
import { initialPlayer, reducePlayer, type PlannedItem, type PlayerState } from "@/domain/session";

const plan: PlannedItem[] = [
  {
    exerciseId: "incline",
    ladderId: "push",
    measure: "reps",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSec: 90,
  },
];
const ctx: ProgressionContext = {
  ladders: [
    {
      id: "push",
      steps: [
        { exerciseId: "wall", advanceWhen: { sets: 3, reps: 12, maxRpe: 7, sessions: 2 } },
        { exerciseId: "incline", advanceWhen: { sets: 3, reps: 12, maxRpe: 7, sessions: 2 } },
        { exerciseId: "push-up" },
      ],
    },
  ],
  exercises: ["wall", "incline", "push-up"].map((id) => ({ id, equipment: [] })),
  gear: [],
};

let db: WorkoutDB;
let repos: Repositories;
let clock: number;
let counter = 0;

beforeEach(async () => {
  db = new WorkoutDB(`progression-${++counter}`);
  clock = Date.parse("2026-11-01T08:00:00.000Z");
  repos = createRepositories(
    () => db,
    () => new Date((clock += 60_000)),
  );
  await db.ladderStates.put({ ladderId: "push", exerciseId: "incline", updatedAt: "2026-01-01" });
});

afterEach(async () => {
  await db.delete();
});

/** Tập một buổi với các giá trị cho trước rồi kết thúc (có chạy engine). */
async function train(values: number[]) {
  const session = await repos.startSession({
    programId: "p",
    phaseId: "foundation",
    sessionTemplateId: "A",
    titleVi: "Buổi A",
    plan,
    player: initialPlayer(plan),
  });
  let player: PlayerState = session.player;
  for (const [setIndex, reps] of values.entries()) {
    player = reducePlayer(player, plan, { type: "logSet", now: clock });
    await repos.logSet(session.id, { exerciseId: "incline", setIndex, reps }, player);
    player = reducePlayer(player, plan, { type: "skipRest" });
  }
  await repos.completeSession(session.id, { ...player, phase: { kind: "done" } }, ctx);
  clock += 2 * 86_400_000;
  return session.id;
}

describe("đề xuất tăng tiến", () => {
  it("2 buổi đạt tối đa → đề xuất lên bậc; chấp nhận thì đổi bậc tập", async () => {
    await train([12, 12, 12]);
    expect(await repos.getPendingSuggestions()).toEqual([]);
    await train([12, 12, 12]);

    const [suggestion] = await repos.getPendingSuggestions();
    expect(suggestion).toMatchObject({
      kind: "advance",
      exerciseId: "incline",
      toExerciseId: "push-up",
      ladderId: "push",
    });

    await repos.acceptSuggestion(suggestion.id);
    expect((await db.ladderStates.get("push"))?.exerciseId).toBe("push-up");
    expect(await repos.getPendingSuggestions()).toEqual([]);
  });

  it("bỏ qua đề xuất thì không đổi bậc", async () => {
    await train([12, 12, 12]);
    await train([12, 12, 12]);
    const [suggestion] = await repos.getPendingSuggestions();
    await repos.dismissSuggestion(suggestion.id);
    expect((await db.ladderStates.get("push"))?.exerciseId).toBe("incline");
    expect(await repos.getPendingSuggestions()).toEqual([]);
  });

  it("chỉ tính buổi sau lần đổi bậc gần nhất", async () => {
    await train([12, 12, 12]);
    // Người dùng vừa được đặt lại bậc này (VD: hạ bậc) → buổi cũ không còn tính.
    await db.ladderStates.put({
      ladderId: "push",
      exerciseId: "incline",
      updatedAt: new Date(clock).toISOString(),
    });
    await train([12, 12, 12]);
    expect(await repos.getPendingSuggestions()).toEqual([]);
  });

  it("buổi đã xóa không được tính", async () => {
    const first = await train([12, 12, 12]);
    await repos.deleteSession(first);
    await train([12, 12, 12]);
    expect(await repos.getPendingSuggestions()).toEqual([]);
  });

  it("2 buổi chật vật → đề xuất hạ bậc; đề xuất cũ của thang bị thay thế", async () => {
    await train([12, 12, 12]);
    await train([12, 12, 12]); // đề xuất lên bậc
    await train([6, 5, 5]);
    await train([7, 6, 5]);
    const pending = await repos.getPendingSuggestions();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ kind: "regress", toExerciseId: "wall" });
  });

  it("đề xuất không còn khớp bậc hiện tại thì bị ẩn", async () => {
    await train([12, 12, 12]);
    await train([12, 12, 12]);
    await db.ladderStates.put({ ladderId: "push", exerciseId: "wall", updatedAt: "x" });
    expect(await repos.getPendingSuggestions()).toEqual([]);
  });

  it("báo đau kèm bậc đích tạo đề xuất hạ bậc chấp nhận được", async () => {
    const session = await repos.startSession({
      programId: "p",
      phaseId: "foundation",
      sessionTemplateId: "A",
      titleVi: "Buổi A",
      plan,
      player: initialPlayer(plan),
    });
    const next = reducePlayer(session.player, plan, { type: "reportPain" });
    await repos.reportPain(session.id, next, "incline", "Đau vai", {
      ladderId: "push",
      toExerciseId: "wall",
    });
    const [suggestion] = await repos.getPendingSuggestions();
    await repos.acceptSuggestion(suggestion.id);
    expect((await db.ladderStates.get("push"))?.exerciseId).toBe("wall");
  });
});

describe("lịch sử và thùng rác", () => {
  it("liệt kê mới nhất trước, sửa hiệp, xóa rồi hoàn tác", async () => {
    const first = await train([10, 10, 10]);
    const second = await train([11, 11, 11]);
    expect((await repos.listHistory()).map((s) => s.id)).toEqual([second, first]);
    expect((await repos.getCompletedSessions()).length).toBe(2);

    const [set] = await repos.getSessionSets(first);
    await repos.updateSet(set.id, 9.6);
    expect((await repos.getSessionSets(first))[0].reps).toBe(10);

    await repos.deleteSession(first);
    expect((await repos.listHistory()).map((s) => s.id)).toEqual([second]);
    expect((await repos.getCompletedSessions()).length).toBe(1);
    expect(await repos.getLastPerformance("incline")).toEqual([11, 11, 11]);

    await repos.restoreSession(first);
    expect((await repos.listHistory()).length).toBe(2);
  });

  it("xóa hẳn buổi trong thùng rác quá 30 ngày cùng các hiệp của nó", async () => {
    const old = await train([10, 10, 10]);
    const recent = await train([10, 10, 10]);
    await repos.deleteSession(old);
    clock += 31 * 86_400_000;
    await repos.deleteSession(recent);

    expect(await repos.purgeTrash()).toBe(1);
    expect(await db.sessions.get(old)).toBeUndefined();
    expect(await repos.getSessionSets(old)).toEqual([]);
    expect(await db.sessions.get(recent)).toBeDefined();
  });
});
