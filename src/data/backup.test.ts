import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkoutDB } from "./db";
import { createRepositories, type Repositories } from "./repositories";
import { parseBackup } from "@/domain/backup";
import { buildProfile } from "@/domain/profile";
import { initialPlayer, reducePlayer, type PlannedItem } from "@/domain/session";

const plan: PlannedItem[] = [
  { exerciseId: "push-up", measure: "reps", sets: 2, repsMin: 8, repsMax: 12, restSec: 90 },
];
const index = {
  ladders: [{ id: "push", steps: [{ exerciseId: "push-up" }] }],
  exercises: [{ id: "push-up", equipment: [] }],
};

let counter = 0;
let clock = Date.parse("2026-11-20T07:00:00.000Z");
const dbs: WorkoutDB[] = [];

function makeRepos(): [WorkoutDB, Repositories] {
  const db = new WorkoutDB(`backup-${++counter}`);
  dbs.push(db);
  return [
    db,
    createRepositories(
      () => db,
      () => new Date((clock += 1000)),
    ),
  ];
}

/** Thiết bị có hồ sơ, cài đặt, một buổi đã xong với 2 hiệp và một đề xuất. */
async function seed(repos: Repositories) {
  await repos.completeOnboarding(buildProfile({ gear: ["pullup_bar"] }, "p"), index);
  await repos.saveSettings({ sound: false });
  const session = await repos.startSession({
    programId: "p",
    phaseId: "foundation",
    sessionTemplateId: "A",
    titleVi: "Buổi A",
    plan,
    player: initialPlayer(plan),
  });
  let player = session.player;
  for (const reps of [10, 9]) {
    player = reducePlayer(player, plan, { type: "logSet", now: 1 });
    await repos.logSet(
      session.id,
      { exerciseId: "push-up", setIndex: player.items[0].done - 1, reps },
      player,
    );
  }
  await repos.reportPain(session.id, player, "push-up", "Đau");
  await repos.completeSession(session.id, { ...player, phase: { kind: "done" } });
}

let a: Repositories;
let dbA: WorkoutDB;
beforeEach(() => {
  [dbA, a] = makeRepos();
});
afterEach(async () => {
  await Promise.all(dbs.splice(0).map((db) => db.delete()));
});

describe("sao lưu", () => {
  it("xuất → xóa toàn bộ → nhập lại cho dữ liệu giống hệt (round-trip, NFR-REL-04)", async () => {
    await seed(a);
    const exported = await a.exportBackup();
    const text = JSON.stringify(exported);

    await a.wipeAll();
    expect(await a.getProfile()).toBeUndefined();
    expect(await a.listHistory()).toEqual([]);

    const parsed = parseBackup(text, a.schemaVersion());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await a.importBackup(parsed.backup);

    const again = await a.exportBackup();
    expect({ ...again, exportedAt: "" }).toEqual({ ...exported, exportedAt: "" });
  });

  it("chuyển sang thiết bị mới đã có dữ liệu: hợp nhất, không ghi đè, nhập lại lần 2 không tạo trùng", async () => {
    await seed(a);
    const exported = await a.exportBackup();

    const [, b] = makeRepos();
    await b.completeOnboarding(buildProfile({ goal: "skill" }, "p"), index);

    const preview = await b.previewImport(exported);
    expect(preview.sessions).toHaveLength(1);
    expect(preview.profile).toBeNull();

    await b.importBackup(exported);
    expect((await b.getProfile())?.goal).toBe("skill");
    expect(await b.listHistory()).toHaveLength(1);
    expect(await b.getSessionSets(exported.data.sessions[0].id)).toHaveLength(2);

    const second = await b.importBackup(exported);
    expect(second.sessions).toEqual([]);
    expect(second.duplicates.sessions).toBe(1);
    expect(await b.listHistory()).toHaveLength(1);
  });

  it("xóa toàn bộ dọn sạch mọi bảng", async () => {
    await seed(a);
    await a.wipeAll();
    for (const table of dbA.tables) expect(await table.count()).toBe(0);
  });
});
