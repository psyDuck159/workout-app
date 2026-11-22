import type { Exercise, Gear, MuscleGroup } from "@/content/schema";

/** Bỏ dấu tiếng Việt, chữ thường: "Hít đất" → "hit dat". */
export function normalizeVi(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type GearFilter = "none" | Gear;
export type DifficultyFilter = "easy" | "medium" | "hard";

export interface ExerciseFilters {
  query?: string;
  muscle?: MuscleGroup;
  gear?: GearFilter;
  difficulty?: DifficultyFilter;
}

const difficultyRanges: Record<DifficultyFilter, [number, number]> = {
  easy: [1, 3],
  medium: [4, 6],
  hard: [7, 10],
};

export function difficultyBucket(difficulty: number): DifficultyFilter {
  if (difficulty <= 3) return "easy";
  if (difficulty <= 6) return "medium";
  return "hard";
}

type SearchableExercise = Pick<
  Exercise,
  "nameVi" | "nameEn" | "primaryMuscles" | "secondaryMuscles" | "equipment" | "difficulty"
>;

/**
 * Lọc bài tập. Mọi từ trong `query` phải xuất hiện (không phân biệt dấu) trong tên tiếng Việt,
 * tên tiếng Anh hoặc nhãn nhóm cơ chính.
 */
export function filterExercises<T extends SearchableExercise>(
  exercises: readonly T[],
  filters: ExerciseFilters,
  muscleLabels: Readonly<Record<MuscleGroup, string>>,
): T[] {
  const tokens = normalizeVi(filters.query ?? "")
    .split(" ")
    .filter(Boolean);

  return exercises.filter((e) => {
    if (filters.muscle && !e.primaryMuscles.includes(filters.muscle)) return false;

    if (filters.gear === "none" && e.equipment.length > 0) return false;
    if (filters.gear && filters.gear !== "none" && !e.equipment.includes(filters.gear)) {
      return false;
    }

    if (filters.difficulty) {
      const [min, max] = difficultyRanges[filters.difficulty];
      if (e.difficulty < min || e.difficulty > max) return false;
    }

    if (tokens.length === 0) return true;
    const haystack = normalizeVi(
      [e.nameVi, e.nameEn, ...e.primaryMuscles.map((m) => muscleLabels[m])].join(" "),
    );
    return tokens.every((t) => haystack.includes(t));
  });
}
