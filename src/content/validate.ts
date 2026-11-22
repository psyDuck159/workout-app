import { z } from "zod";
import {
  Attribution,
  Exercise,
  Ladder,
  Program,
  licensesRequiringAuthor,
  type Gear,
  type SessionItem,
} from "./schema";
import { availableSteps, hasGearFor } from "@/domain/ladder";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface RawContent {
  exercises: unknown;
  ladders: unknown;
  programs: unknown;
  attribution: unknown;
}

/** Mọi tổ hợp dụng cụ người dùng có thể khai báo. */
const gearCombos: Gear[][] = [
  [],
  ["pullup_bar"],
  ["resistance_band"],
  ["pullup_bar", "resistance_band"],
];

function formatIssues(label: string, error: z.ZodError): string[] {
  return error.issues.map((i) => `${label}: ${i.path.join(".") || "(gốc)"} — ${i.message}`);
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

/**
 * Validate schema và tham chiếu chéo của toàn bộ nội dung.
 * `mediaExists` nhận đường dẫn tương đối trong public/media/exercises/.
 */
export function validateContent(
  raw: RawContent,
  mediaExists: (frame: string) => boolean,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const exercisesResult = z.array(Exercise).safeParse(raw.exercises);
  const laddersResult = z.array(Ladder).safeParse(raw.ladders);
  const programsResult = z.array(Program).safeParse(raw.programs);
  const attributionResult = z.record(z.string(), Attribution).safeParse(raw.attribution);

  if (!exercisesResult.success) errors.push(...formatIssues("exercises", exercisesResult.error));
  if (!laddersResult.success) errors.push(...formatIssues("ladders", laddersResult.error));
  if (!programsResult.success) errors.push(...formatIssues("programs", programsResult.error));
  if (!attributionResult.success) {
    errors.push(...formatIssues("media-attribution", attributionResult.error));
  }
  if (
    !exercisesResult.success ||
    !laddersResult.success ||
    !programsResult.success ||
    !attributionResult.success
  ) {
    return { errors, warnings };
  }

  const exercises = exercisesResult.data;
  const ladders = laddersResult.data;
  const programs = programsResult.data;
  const attribution = attributionResult.data;
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const laddersById = new Map(ladders.map((l) => [l.id, l]));
  const used = new Set<string>();

  for (const id of findDuplicates(exercises.map((e) => e.id)))
    errors.push(`Trùng exercise id: ${id}`);
  for (const id of findDuplicates(ladders.map((l) => l.id))) errors.push(`Trùng ladder id: ${id}`);
  for (const id of findDuplicates(programs.map((p) => p.id)))
    errors.push(`Trùng program id: ${id}`);

  // Media & ghi công
  for (const e of exercises) {
    if (!e.media) {
      warnings.push(`${e.id}: chưa có ảnh minh họa`);
      continue;
    }
    for (const frame of e.media.frames) {
      if (!mediaExists(frame)) errors.push(`${e.id}: thiếu file ảnh ${frame}`);
      const credit = attribution[frame];
      if (!credit) {
        errors.push(`${e.id}: ảnh ${frame} chưa có ghi công trong media-attribution.json`);
      } else if (licensesRequiringAuthor.includes(credit.license) && !credit.author) {
        errors.push(`${frame}: giấy phép ${credit.license} bắt buộc ghi tác giả`);
      }
    }
  }

  // Thang biến thể
  for (const ladder of ladders) {
    const seen = new Set<string>();
    ladder.steps.forEach((step, index) => {
      const where = `ladder ${ladder.id} bậc ${index + 1}`;
      const exercise = exercisesById.get(step.exerciseId);
      if (!exercise) {
        errors.push(`${where}: không có bài ${step.exerciseId}`);
        return;
      }
      used.add(exercise.id);
      if (seen.has(exercise.id)) errors.push(`${where}: bài ${exercise.id} lặp lại trong thang`);
      seen.add(exercise.id);

      const isLast = index === ladder.steps.length - 1;
      if (isLast && step.advanceWhen) errors.push(`${where}: bậc cuối không được có advanceWhen`);
      if (!isLast && !step.advanceWhen) errors.push(`${where}: thiếu advanceWhen`);
      if (step.advanceWhen) {
        const wantsSeconds = exercise.measure === "time";
        if (wantsSeconds && step.advanceWhen.seconds === undefined) {
          errors.push(`${where}: bài ${exercise.id} đo thời gian, advanceWhen cần seconds`);
        }
        if (!wantsSeconds && step.advanceWhen.reps === undefined) {
          errors.push(`${where}: bài ${exercise.id} đo số lần, advanceWhen cần reps`);
        }
      }

      const prev = index > 0 ? exercisesById.get(ladder.steps[index - 1].exerciseId) : undefined;
      if (prev && prev.difficulty > exercise.difficulty) {
        warnings.push(
          `${where}: độ khó ${exercise.difficulty} thấp hơn bậc trước (${prev.difficulty})`,
        );
      }
    });
  }

  // Chương trình
  for (const program of programs) {
    const orders = program.phases.map((p) => p.order).sort((a, b) => a - b);
    if (orders.some((o, i) => o !== i + 1)) {
      errors.push(`program ${program.id}: order các giai đoạn phải liên tục từ 1`);
    }
    for (const id of findDuplicates(program.phases.map((p) => p.id))) {
      errors.push(`program ${program.id}: trùng phase id ${id}`);
    }

    for (const phase of program.phases) {
      for (const session of phase.sessions) {
        session.items.forEach((item, index) => {
          const where = `${program.id}/${phase.id}/${session.id} bài ${index + 1}`;
          errors.push(...validateSessionItem(item, where, exercisesById, laddersById, used));
        });
      }
    }
  }

  for (const e of exercises) {
    if (!used.has(e.id)) warnings.push(`${e.id}: không thuộc thang hay chương trình nào`);
  }

  return { errors, warnings };
}

function validateSessionItem(
  item: SessionItem,
  where: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  laddersById: ReadonlyMap<string, Ladder>,
  used: Set<string>,
): string[] {
  const errors: string[] = [];
  const combos = gearCombos.filter((g) => !item.requires || g.includes(item.requires));
  let candidates: Exercise[] = [];

  if (item.ladderId) {
    const ladder = laddersById.get(item.ladderId);
    if (!ladder) return [`${where}: không có ladder ${item.ladderId}`];
    for (const gear of combos) {
      if (availableSteps(ladder, exercisesById, gear).length === 0) {
        errors.push(
          `${where}: ladder ${ladder.id} không có bậc nào cho dụng cụ [${gear.join(", ") || "không"}] — cần thêm requires`,
        );
      }
    }
    candidates = ladder.steps
      .map((s) => exercisesById.get(s.exerciseId))
      .filter((e): e is Exercise => e !== undefined);
  } else if (item.exerciseId) {
    const exercise = exercisesById.get(item.exerciseId);
    if (!exercise) return [`${where}: không có bài ${item.exerciseId}`];
    used.add(exercise.id);
    for (const gear of combos) {
      if (!hasGearFor(exercise, gear)) {
        errors.push(`${where}: bài ${exercise.id} cần dụng cụ, hãy thêm requires`);
        break;
      }
    }
    candidates = [exercise];
  }

  if (candidates.some((e) => e.measure !== "time") && item.repsMin === undefined) {
    errors.push(`${where}: có bài đo số lần nhưng thiếu repsMin/repsMax`);
  }
  if (candidates.some((e) => e.measure === "time") && item.secondsMin === undefined) {
    errors.push(`${where}: có bài đo thời gian nhưng thiếu secondsMin/secondsMax`);
  }
  return errors;
}
