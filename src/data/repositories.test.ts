import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkoutDB } from "./db";
import { createRepositories, type GearIndex, type Repositories } from "./repositories";
import { buildProfile } from "@/domain/profile";

const index: GearIndex = {
  ladders: [
    { id: "row", steps: [{ exerciseId: "towel-row" }, { exerciseId: "table-row" }] },
    { id: "vertical", steps: [{ exerciseId: "dead-hang" }, { exerciseId: "pull-up" }] },
  ],
  exercises: [
    { id: "towel-row", equipment: [] },
    { id: "table-row", equipment: [] },
    { id: "dead-hang", equipment: ["pullup_bar"] },
    { id: "pull-up", equipment: ["pullup_bar"] },
  ],
};

let db: WorkoutDB;
let repos: Repositories;
let counter = 0;

beforeEach(async () => {
  db = new WorkoutDB(`test-${++counter}`);
  repos = createRepositories(
    () => db,
    () => new Date("2026-11-24T08:00:00.000Z"),
  );
});

afterEach(async () => {
  await db.delete();
});

describe("WorkoutDB", () => {
  it("schema phiên bản 1 với đủ các bảng", async () => {
    await db.open();
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      "ladderStates",
      "meta",
      "profile",
      "sessions",
      "sets",
      "settings",
      "suggestions",
    ]);
  });
});

describe("repositories", () => {
  it("chưa onboarding thì chưa có hồ sơ, cài đặt dùng mặc định", async () => {
    expect(await repos.getProfile()).toBeUndefined();
    expect(await repos.getSettings()).toEqual({
      id: "me",
      sound: true,
      vibration: true,
      keepAwake: true,
    });
  });

  it("hoàn thành onboarding lưu hồ sơ và gán bậc khởi đầu theo dụng cụ", async () => {
    await repos.completeOnboarding(buildProfile({ gear: [] }, "p"), index);
    expect((await repos.getProfile())?.gear).toEqual([]);
    expect(await repos.getLadderStates()).toEqual([
      { ladderId: "row", exerciseId: "towel-row", updatedAt: "2026-11-24T08:00:00.000Z" },
    ]);
  });

  it("thêm dụng cụ thì mở thêm thang, giữ nguyên bậc của thang cũ", async () => {
    await repos.completeOnboarding(buildProfile({}, "p"), index);
    await db.ladderStates.put({ ladderId: "row", exerciseId: "table-row", updatedAt: "x" });

    const updated = await repos.updateProfile({ gear: ["pullup_bar"] }, index);

    expect(updated.gear).toEqual(["pullup_bar"]);
    expect(updated.updatedAt).toBe("2026-11-24T08:00:00.000Z");
    const states = Object.fromEntries(
      (await repos.getLadderStates()).map((s) => [s.ladderId, s.exerciseId]),
    );
    expect(states).toEqual({ row: "table-row", vertical: "dead-hang" });
  });

  it("sửa hồ sơ không đổi dụng cụ thì không đụng tới bậc tập", async () => {
    await repos.completeOnboarding(buildProfile({}, "p"), index);
    await db.ladderStates.clear();
    await repos.updateProfile({ daysPerWeek: 4 }, index);
    expect((await repos.getProfile())?.daysPerWeek).toBe(4);
    expect(await repos.getLadderStates()).toEqual([]);
  });

  it("cập nhật hồ sơ khi chưa onboarding thì báo lỗi", async () => {
    await expect(repos.updateProfile({ goal: "skill" }, index)).rejects.toThrow("Chưa có hồ sơ");
  });

  it("lưu cài đặt từng phần", async () => {
    await repos.saveSettings({ sound: false });
    await repos.saveSettings({ keepAwake: false });
    expect(await repos.getSettings()).toMatchObject({
      sound: false,
      vibration: true,
      keepAwake: false,
    });
  });
});
