import { describe, expect, it } from "vitest";
import { availableSteps, hasGearFor, startingExercise } from "./ladder";
import type { Exercise, Gear } from "@/content/schema";

type E = Pick<Exercise, "id" | "equipment">;
const e = (id: string, equipment: Gear[] = []): E => ({ id, equipment });

const exercises = new Map(
  [
    e("dead-hang", ["pullup_bar"]),
    e("band-assisted", ["pullup_bar", "resistance_band"]),
    e("pull-up", ["pullup_bar"]),
    e("towel-row"),
    e("band-row", ["resistance_band"]),
  ].map((x) => [x.id, x]),
);

const pullLadder = {
  steps: [{ exerciseId: "dead-hang" }, { exerciseId: "band-assisted" }, { exerciseId: "pull-up" }],
};
const rowLadder = { steps: [{ exerciseId: "towel-row" }, { exerciseId: "band-row" }] };

describe("hasGearFor", () => {
  it("bài không cần dụng cụ luôn tập được", () => {
    expect(hasGearFor(e("x"), [])).toBe(true);
  });
  it("cần đủ mọi dụng cụ", () => {
    expect(hasGearFor(e("x", ["pullup_bar", "resistance_band"]), ["pullup_bar"])).toBe(false);
    expect(
      hasGearFor(e("x", ["pullup_bar", "resistance_band"]), ["resistance_band", "pullup_bar"]),
    ).toBe(true);
  });
});

describe("availableSteps", () => {
  it("bỏ qua bậc thiếu dụng cụ, giữ thứ tự", () => {
    expect(availableSteps(pullLadder, exercises, ["pullup_bar"]).map((x) => x.id)).toEqual([
      "dead-hang",
      "pull-up",
    ]);
    expect(
      availableSteps(pullLadder, exercises, ["pullup_bar", "resistance_band"]).map((x) => x.id),
    ).toEqual(["dead-hang", "band-assisted", "pull-up"]);
  });

  it("trả mảng rỗng khi không có dụng cụ nào phù hợp", () => {
    expect(availableSteps(pullLadder, exercises, [])).toEqual([]);
  });

  it("bỏ qua bài không tồn tại", () => {
    expect(
      availableSteps(
        { steps: [{ exerciseId: "missing" }, { exerciseId: "towel-row" }] },
        exercises,
        [],
      ).map((x) => x.id),
    ).toEqual(["towel-row"]);
  });
});

describe("startingExercise", () => {
  it("chọn bậc dễ nhất tập được", () => {
    expect(startingExercise(rowLadder, exercises, [])?.id).toBe("towel-row");
    expect(startingExercise(pullLadder, exercises, [])).toBeUndefined();
  });
});
