import type { Exercise, Gear, Ladder } from "@/content/schema";

type GearedExercise = Pick<Exercise, "equipment">;

/** Bài tập dùng được khi người dùng có đủ mọi dụng cụ bài yêu cầu. */
export function hasGearFor(exercise: GearedExercise, gear: readonly Gear[]): boolean {
  return exercise.equipment.every((g) => gear.includes(g));
}

/** Các bậc của thang mà người dùng tập được với dụng cụ hiện có, giữ nguyên thứ tự dễ → khó. */
export function availableSteps<E extends GearedExercise>(
  ladder: Pick<Ladder, "steps">,
  exercisesById: ReadonlyMap<string, E>,
  gear: readonly Gear[],
): E[] {
  return ladder.steps
    .map((step) => exercisesById.get(step.exerciseId))
    .filter((e): e is E => e !== undefined && hasGearFor(e, gear));
}

/** Bậc ngay dưới `exerciseId` mà người dùng tập được (gợi ý khi báo đau). */
export function easierExercise<E extends GearedExercise & { id: string }>(
  ladder: Pick<Ladder, "steps">,
  exerciseId: string,
  exercisesById: ReadonlyMap<string, E>,
  gear: readonly Gear[],
): E | undefined {
  const index = ladder.steps.findIndex((s) => s.exerciseId === exerciseId);
  if (index <= 0) return undefined;
  return availableSteps({ steps: ladder.steps.slice(0, index) }, exercisesById, gear).at(-1);
}

/** Bậc khởi đầu cho người mới: bậc dễ nhất tập được. `undefined` nếu không có bậc nào phù hợp. */
export function startingExercise<E extends GearedExercise>(
  ladder: Pick<Ladder, "steps">,
  exercisesById: ReadonlyMap<string, E>,
  gear: readonly Gear[],
): E | undefined {
  return availableSteps(ladder, exercisesById, gear)[0];
}
