import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id phải là kebab-case");

export const muscleGroups = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "legs",
  "glutes",
  "full_body",
] as const;
export const MuscleGroup = z.enum(muscleGroups);
export type MuscleGroup = z.infer<typeof MuscleGroup>;

/** Dụng cụ người dùng khai báo ở onboarding. Bài không cần dụng cụ có `equipment: []`. */
export const gear = ["pullup_bar", "resistance_band"] as const;
export const Gear = z.enum(gear);
export type Gear = z.infer<typeof Gear>;

/** Đồ gia dụng mặc định coi như nhà nào cũng có. */
export const HouseholdItem = z.enum(["wall", "chair", "table", "towel", "door"]);
export type HouseholdItem = z.infer<typeof HouseholdItem>;

export const MeasureType = z.enum(["reps", "time", "reps_each_side"]);
export type MeasureType = z.infer<typeof MeasureType>;

export const Source = z.object({
  title: z.string().min(1),
  url: z.url(),
});
export type Source = z.infer<typeof Source>;

export const Exercise = z.object({
  id: slug,
  nameVi: z.string().min(1),
  nameEn: z.string().min(1),
  primaryMuscles: z.array(MuscleGroup).min(1),
  secondaryMuscles: z.array(MuscleGroup).default([]),
  equipment: z.array(Gear).default([]),
  household: z.array(HouseholdItem).default([]),
  measure: MeasureType,
  difficulty: z.number().int().min(1).max(10),
  steps: z.array(z.string().min(1)).min(2),
  commonMistakes: z.array(z.string().min(1)).min(1),
  tips: z.array(z.string().min(1)).default([]),
  contraindications: z.array(z.string().min(1)).default([]),
  /** Đường dẫn tương đối trong `public/media/exercises/`. `null` = chưa có ảnh hợp lệ. */
  media: z
    .object({ frames: z.array(z.string().regex(/^[a-z0-9-]+\/\d+\.(svg|webp)$/)).min(1) })
    .nullable(),
  sources: z.array(Source).min(1),
});
export type Exercise = z.infer<typeof Exercise>;

export const AdvanceWhen = z
  .object({
    sets: z.number().int().positive(),
    reps: z.number().int().positive().optional(),
    seconds: z.number().int().positive().optional(),
    maxRpe: z.number().min(1).max(10),
    sessions: z.number().int().positive(),
  })
  .refine((a) => (a.reps === undefined) !== (a.seconds === undefined), {
    message: "advanceWhen cần đúng một trong reps hoặc seconds",
  });
export type AdvanceWhen = z.infer<typeof AdvanceWhen>;

export const Ladder = z.object({
  id: slug,
  nameVi: z.string().min(1),
  descriptionVi: z.string().min(1),
  steps: z
    .array(
      z.object({
        exerciseId: slug,
        /** Bỏ trống ở bậc cuối cùng. */
        advanceWhen: AdvanceWhen.optional(),
      }),
    )
    .min(2),
});
export type Ladder = z.infer<typeof Ladder>;

const range = (min: number, max: number) => min <= max;

export const SessionItem = z
  .object({
    ladderId: slug.optional(),
    exerciseId: slug.optional(),
    /** Chỉ đưa vào buổi tập khi người dùng có dụng cụ này. */
    requires: Gear.optional(),
    sets: z.number().int().min(1).max(8),
    repsMin: z.number().int().positive().optional(),
    repsMax: z.number().int().positive().optional(),
    secondsMin: z.number().int().positive().optional(),
    secondsMax: z.number().int().positive().optional(),
    restSec: z.number().int().min(15).max(300),
  })
  .refine((i) => (i.ladderId === undefined) !== (i.exerciseId === undefined), {
    message: "Mỗi bài trong buổi cần đúng một trong ladderId hoặc exerciseId",
  })
  .refine((i) => i.repsMin !== undefined || i.secondsMin !== undefined, {
    message: "Cần mục tiêu repsMin/repsMax hoặc secondsMin/secondsMax",
  })
  .refine(
    (i) =>
      (i.repsMin === undefined || (i.repsMax !== undefined && range(i.repsMin, i.repsMax))) &&
      (i.secondsMin === undefined ||
        (i.secondsMax !== undefined && range(i.secondsMin, i.secondsMax))),
    { message: "Khoảng mục tiêu không hợp lệ (thiếu max hoặc min > max)" },
  );
export type SessionItem = z.infer<typeof SessionItem>;

export const SessionTemplate = z.object({
  id: z.string().regex(/^[A-Z]$/),
  titleVi: z.string().min(1),
  items: z.array(SessionItem).min(1),
});
export type SessionTemplate = z.infer<typeof SessionTemplate>;

export const Phase = z.object({
  id: slug,
  order: z.number().int().positive(),
  titleVi: z.string().min(1),
  goalVi: z.string().min(1),
  weeks: z.number().int().min(1).max(8),
  deloadLastWeek: z.boolean(),
  sessions: z.array(SessionTemplate).min(1),
});
export type Phase = z.infer<typeof Phase>;

export const Program = z.object({
  id: slug,
  nameVi: z.string().min(1),
  descriptionVi: z.string().min(1),
  phases: z.array(Phase).min(1),
});
export type Program = z.infer<typeof Program>;

export const Attribution = z.object({
  source: z.string().min(1),
  sourceUrl: z.url().nullable(),
  license: z.string().min(1),
  licenseUrl: z.url().nullable(),
  author: z.string().min(1).nullable(),
  modified: z.string().min(1),
});
export type Attribution = z.infer<typeof Attribution>;

/** Giấy phép bắt buộc ghi tên tác giả. */
export const licensesRequiringAuthor = ["CC-BY-4.0", "CC-BY-SA-3.0", "CC-BY-SA-4.0"];
