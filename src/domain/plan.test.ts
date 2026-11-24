import { describe, expect, it } from "vitest";
import type { Gear, MeasureType } from "@/content/schema";
import type { LadderState } from "@/data/types";
import { buildSessionPlan } from "./plan";
import { easierExercise } from "./ladder";

const ex = (id: string, measure: MeasureType = "reps", equipment: Gear[] = []) => ({
  id,
  measure,
  equipment,
});
const exercises = new Map(
  [
    ex("towel-row"),
    ex("table-row"),
    ex("dead-hang", "time", ["pullup_bar"]),
    ex("pull-up", "reps", ["pullup_bar"]),
    ex("band-pull-apart", "reps", ["resistance_band"]),
    ex("side-plank", "time"),
  ].map((e) => [e.id, e]),
);
const ladders = new Map([
  ["row", { id: "row", steps: [{ exerciseId: "towel-row" }, { exerciseId: "table-row" }] }],
  ["vertical", { id: "vertical", steps: [{ exerciseId: "dead-hang" }, { exerciseId: "pull-up" }] }],
]);
const template = {
  items: [
    { ladderId: "row", sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
    {
      ladderId: "vertical",
      requires: "pullup_bar" as const,
      sets: 3,
      repsMin: 5,
      repsMax: 8,
      secondsMin: 15,
      secondsMax: 30,
      restSec: 90,
    },
    {
      exerciseId: "band-pull-apart",
      requires: "resistance_band" as const,
      sets: 2,
      repsMin: 12,
      repsMax: 15,
      restSec: 60,
    },
    { exerciseId: "side-plank", sets: 2, secondsMin: 20, secondsMax: 30, restSec: 60 },
  ],
};
const state = (ladderId: string, exerciseId: string): [string, LadderState] => [
  ladderId,
  { ladderId, exerciseId, updatedAt: "x" },
];

describe("buildSessionPlan", () => {
  it("không dụng cụ: bỏ bài cần xà/dây, chọn bậc dễ nhất", () => {
    const plan = buildSessionPlan(template, ladders, exercises, new Map(), []);
    expect(plan).toEqual([
      {
        exerciseId: "towel-row",
        ladderId: "row",
        measure: "reps",
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSec: 90,
      },
      {
        exerciseId: "side-plank",
        measure: "time",
        sets: 2,
        secondsMin: 20,
        secondsMax: 30,
        restSec: 60,
      },
    ]);
  });

  it("dùng bậc đã lưu và mở bài theo dụng cụ", () => {
    const plan = buildSessionPlan(
      template,
      ladders,
      exercises,
      new Map([state("row", "table-row"), state("vertical", "pull-up")]),
      ["pullup_bar", "resistance_band"],
    );
    expect(plan.map((p) => p.exerciseId)).toEqual([
      "table-row",
      "pull-up",
      "band-pull-apart",
      "side-plank",
    ]);
    expect(plan[1]).toMatchObject({ measure: "reps", repsMin: 5, secondsMin: 15 });
  });
});

describe("easierExercise", () => {
  it("trả bậc ngay dưới còn tập được, không có thì undefined", () => {
    const row = ladders.get("row")!;
    expect(easierExercise(row, "table-row", exercises, [])?.id).toBe("towel-row");
    expect(easierExercise(row, "towel-row", exercises, [])).toBeUndefined();
    const vertical = ladders.get("vertical")!;
    expect(easierExercise(vertical, "pull-up", exercises, [])).toBeUndefined();
  });
});
