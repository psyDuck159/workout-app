import { describe, expect, it } from "vitest";
import type { Gear } from "@/content/schema";
import type { LadderState } from "@/data/types";
import { buildProfile, currentExerciseOf, reconcileLadderStates } from "./profile";

const NOW = new Date("2026-11-24T08:00:00.000Z");

describe("buildProfile", () => {
  it("bỏ qua mọi bước thì dùng giá trị mặc định", () => {
    expect(buildProfile({}, "foundation-12w", NOW)).toEqual({
      id: "me",
      goal: "general",
      daysPerWeek: 3,
      sessionMinutes: 30,
      gear: [],
      activeProgramId: "foundation-12w",
      health: null,
      disclaimerAcceptedAt: NOW.toISOString(),
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("giữ câu trả lời, giới hạn số buổi trong 2–6 và bỏ dụng cụ trùng", () => {
    const p = buildProfile(
      { goal: "skill", daysPerWeek: 9, gear: ["pullup_bar", "pullup_bar"], healthYes: true },
      "p",
      NOW,
    );
    expect(p.goal).toBe("skill");
    expect(p.daysPerWeek).toBe(6);
    expect(p.gear).toEqual(["pullup_bar"]);
    expect(p.health).toEqual({ flagged: true, answeredAt: NOW.toISOString() });
    expect(buildProfile({ daysPerWeek: 1 }, "p", NOW).daysPerWeek).toBe(2);
  });
});

const ex = (id: string, equipment: Gear[] = []) => ({ id, equipment });
const exercises = new Map(
  [
    ex("towel-row"),
    ex("band-row", ["resistance_band"]),
    ex("table-row"),
    ex("dead-hang", ["pullup_bar"]),
    ex("band-pull", ["pullup_bar", "resistance_band"]),
    ex("pull-up", ["pullup_bar"]),
  ].map((e) => [e.id, e]),
);
const row = {
  id: "row",
  steps: ["towel-row", "band-row", "table-row"].map((exerciseId) => ({ exerciseId })),
};
const vertical = {
  id: "vertical",
  steps: ["dead-hang", "band-pull", "pull-up"].map((exerciseId) => ({ exerciseId })),
};
const state = (ladderId: string, exerciseId: string): LadderState => ({
  ladderId,
  exerciseId,
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("reconcileLadderStates", () => {
  it("thang chưa có trạng thái được gán bậc dễ nhất; thang không tập được thì bỏ qua", () => {
    expect(reconcileLadderStates([], [row, vertical], exercises, [], NOW)).toEqual([
      { ladderId: "row", exerciseId: "towel-row", updatedAt: NOW.toISOString() },
    ]);
  });

  it("có xà thì thang hít xà bắt đầu từ treo xà", () => {
    const updates = reconcileLadderStates([], [vertical], exercises, ["pullup_bar"], NOW);
    expect(updates.map((u) => u.exerciseId)).toEqual(["dead-hang"]);
  });

  it("bài hiện tại vẫn tập được thì giữ nguyên", () => {
    expect(reconcileLadderStates([state("row", "table-row")], [row], exercises, [], NOW)).toEqual(
      [],
    );
  });

  it("mất dụng cụ thì lùi về bậc gần nhất dễ hơn còn tập được", () => {
    // Đang ở band-pull (cần xà + dây), bỏ dây → lùi về dead-hang chứ không nhảy lên pull-up.
    const updates = reconcileLadderStates(
      [state("vertical", "band-pull")],
      [vertical],
      exercises,
      ["pullup_bar"],
      NOW,
    );
    expect(updates.map((u) => u.exerciseId)).toEqual(["dead-hang"]);
  });

  it("không có bậc dễ hơn tập được thì về bậc dễ nhất còn tập được", () => {
    const updates = reconcileLadderStates([state("row", "band-row")], [row], exercises, [], NOW);
    expect(updates.map((u) => u.exerciseId)).toEqual(["towel-row"]);
  });

  it("mất hết dụng cụ của thang thì giữ trạng thái để tập tiếp khi có lại", () => {
    expect(
      reconcileLadderStates([state("vertical", "pull-up")], [vertical], exercises, [], NOW),
    ).toEqual([]);
  });
});

describe("currentExerciseOf", () => {
  it("dùng trạng thái đã lưu nếu hợp lệ, ngược lại bậc dễ nhất", () => {
    const states = new Map([["row", state("row", "table-row")]]);
    expect(currentExerciseOf(row, states, exercises, [])?.id).toBe("table-row");
    const invalid = new Map([["row", state("row", "band-row")]]);
    expect(currentExerciseOf(row, invalid, exercises, [])?.id).toBe("towel-row");
    expect(currentExerciseOf(vertical, new Map(), exercises, [])).toBeUndefined();
  });
});
