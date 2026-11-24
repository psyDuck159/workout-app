import "server-only";
import { z } from "zod";
import { Attribution, Exercise, Ladder, Program } from "./schema";
import type { GearIndex } from "@/data/repositories";
import push from "./exercises/push.json";
import pull from "./exercises/pull.json";
import legs from "./exercises/legs.json";
import core from "./exercises/core.json";
import accessory from "./exercises/accessory.json";
import laddersJson from "./ladders.json";
import foundation12w from "./programs/foundation-12w.json";
import attributionJson from "./media-attribution.json";

// Nội dung đã được scripts/validate-content.ts kiểm tra chéo trước khi build;
// parse ở đây để có kiểu và giá trị mặc định của schema.
export const exercises: Exercise[] = z
  .array(Exercise)
  .parse([...push, ...pull, ...legs, ...core, ...accessory]);
export const ladders: Ladder[] = z.array(Ladder).parse(laddersJson);
export const programs: Program[] = z.array(Program).parse([foundation12w]);
export const mediaAttribution: Record<string, Attribution> = z
  .record(z.string(), Attribution)
  .parse(attributionJson);

export const exercisesById = new Map(exercises.map((e) => [e.id, e]));
export const laddersById = new Map(ladders.map((l) => [l.id, l]));

export const defaultProgram = programs[0];

export function getExercise(id: string): Exercise | undefined {
  return exercisesById.get(id);
}

export function getPhase(programId: string, phaseId: string) {
  return programs.find((p) => p.id === programId)?.phases.find((ph) => ph.id === phaseId);
}

/** Thang chứa bài tập, kèm vị trí bậc (bắt đầu từ 1). */
export function findLadderOf(exerciseId: string) {
  for (const ladder of ladders) {
    const index = ladder.steps.findIndex((s) => s.exerciseId === exerciseId);
    if (index >= 0) return { ladder, step: index + 1 };
  }
  return undefined;
}

export function mediaUrl(frame: string): string {
  return `/media/exercises/${frame}`;
}

/** Dữ liệu tối thiểu gửi xuống client để đồng bộ bậc tập theo dụng cụ. */
export const gearIndex: GearIndex = {
  ladders: ladders.map((l) => ({
    id: l.id,
    steps: l.steps.map((s) => ({ exerciseId: s.exerciseId })),
  })),
  exercises: exercises.map((e) => ({ id: e.id, equipment: e.equipment })),
};
