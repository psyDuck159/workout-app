import { describe, expect, it } from "vitest";
import { difficultyBucket, filterExercises, normalizeVi } from "./search";
import { muscleLabels } from "@/content/labels";
import type { Exercise } from "@/content/schema";

describe("normalizeVi", () => {
  it.each([
    ["Hít đất", "hit dat"],
    ["ĐẨY VAI", "day vai"],
    ["  Chống   đẩy  ", "chong day"],
    ["Squat Bulgaria", "squat bulgaria"],
    ["Ngực", "nguc"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeVi(input)).toBe(expected);
  });
});

type E = Pick<
  Exercise,
  "nameVi" | "nameEn" | "primaryMuscles" | "secondaryMuscles" | "equipment" | "difficulty"
>;

const ex = (overrides: Partial<E>): E => ({
  nameVi: "Bài",
  nameEn: "Exercise",
  primaryMuscles: ["chest"],
  secondaryMuscles: [],
  equipment: [],
  difficulty: 2,
  ...overrides,
});

const pushUp = ex({
  nameVi: "Chống đẩy",
  nameEn: "Push-up",
  primaryMuscles: ["chest"],
  difficulty: 4,
});
const pullUp = ex({
  nameVi: "Hít xà sấp tay",
  nameEn: "Pull-up",
  primaryMuscles: ["back"],
  equipment: ["pullup_bar"],
  difficulty: 7,
});
const bandRow = ex({
  nameVi: "Kéo dây kháng lực",
  nameEn: "Band Row",
  primaryMuscles: ["back"],
  equipment: ["resistance_band"],
  difficulty: 2,
});
const all = [pushUp, pullUp, bandRow];

describe("filterExercises", () => {
  it("tìm không dấu theo tên tiếng Việt", () => {
    expect(filterExercises(all, { query: "chong day" }, muscleLabels)).toEqual([pushUp]);
  });

  it("tìm theo tên tiếng Anh và theo nhãn nhóm cơ", () => {
    expect(filterExercises(all, { query: "pull" }, muscleLabels)).toEqual([pullUp]);
    expect(filterExercises(all, { query: "lung" }, muscleLabels)).toEqual([pullUp, bandRow]);
  });

  it("mọi từ khóa đều phải khớp", () => {
    expect(filterExercises(all, { query: "keo day" }, muscleLabels)).toEqual([bandRow]);
    expect(filterExercises(all, { query: "keo xa" }, muscleLabels)).toEqual([]);
  });

  it("lọc 'không dụng cụ' và theo từng dụng cụ", () => {
    expect(filterExercises(all, { gear: "none" }, muscleLabels)).toEqual([pushUp]);
    expect(filterExercises(all, { gear: "pullup_bar" }, muscleLabels)).toEqual([pullUp]);
  });

  it("lọc theo nhóm cơ và độ khó", () => {
    expect(filterExercises(all, { muscle: "back", difficulty: "easy" }, muscleLabels)).toEqual([
      bandRow,
    ]);
  });

  it("không có bộ lọc trả về tất cả", () => {
    expect(filterExercises(all, {}, muscleLabels)).toEqual(all);
  });
});

describe("difficultyBucket", () => {
  it.each([
    [1, "easy"],
    [3, "easy"],
    [4, "medium"],
    [6, "medium"],
    [7, "hard"],
    [10, "hard"],
  ] as const)("%i → %s", (d, bucket) => {
    expect(difficultyBucket(d)).toBe(bucket);
  });
});
