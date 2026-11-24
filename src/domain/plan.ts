import type { Exercise, Gear, Ladder, SessionTemplate } from "@/content/schema";
import type { LadderState } from "@/data/types";
import { currentExerciseOf } from "./profile";
import type { PlannedItem } from "./session";

type PlanExercise = Pick<Exercise, "id" | "equipment" | "measure">;

/**
 * Chuyển buổi mẫu (A/B) thành danh sách bài cụ thể theo dụng cụ và bậc tập hiện tại.
 * Bỏ bài cần dụng cụ người dùng không có, hoặc thang không có bậc nào tập được.
 */
export function buildSessionPlan<E extends PlanExercise>(
  template: Pick<SessionTemplate, "items">,
  ladders: ReadonlyMap<string, Pick<Ladder, "id" | "steps">>,
  exercisesById: ReadonlyMap<string, E>,
  ladderStates: ReadonlyMap<string, LadderState>,
  gear: readonly Gear[],
): PlannedItem[] {
  const plan: PlannedItem[] = [];
  for (const item of template.items) {
    if (item.requires && !gear.includes(item.requires)) continue;
    const ladder = item.ladderId ? ladders.get(item.ladderId) : undefined;
    const exercise = ladder
      ? currentExerciseOf(ladder, ladderStates, exercisesById, gear)
      : item.exerciseId
        ? exercisesById.get(item.exerciseId)
        : undefined;
    if (!exercise) continue;

    plan.push({
      exerciseId: exercise.id,
      ...(ladder && { ladderId: ladder.id }),
      measure: exercise.measure,
      sets: item.sets,
      ...(item.repsMin !== undefined && { repsMin: item.repsMin, repsMax: item.repsMax }),
      ...(item.secondsMin !== undefined && {
        secondsMin: item.secondsMin,
        secondsMax: item.secondsMax,
      }),
      restSec: item.restSec,
    });
  }
  return plan;
}
