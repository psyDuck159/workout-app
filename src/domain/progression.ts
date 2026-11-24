import type { AdvanceWhen, Gear } from "@/content/schema";
import { availableSteps } from "./ladder";
import { progressionConfig, type ProgressionConfig } from "./progressionConfig";
import type { PlannedItem } from "./session";

/** Kết quả một buổi của một bài, dùng để đánh giá tăng tiến. */
export interface ExerciseSessionResult {
  /** Mục tiêu đã chụp trong kế hoạch buổi đó. */
  target: Pick<
    PlannedItem,
    "sets" | "repsMin" | "repsMax" | "secondsMin" | "secondsMax" | "measure"
  >;
  /** Kết quả từng hiệp (số lần hoặc số giây). */
  values: number[];
  /** RPE từ đánh giá Dễ/Vừa/Khó; `undefined` nếu không đánh giá. */
  rpe?: number;
  pain: boolean;
}

export interface ProgressionLadder {
  id: string;
  steps: { exerciseId: string; advanceWhen?: AdvanceWhen }[];
}

export type ProgressionDecision =
  | { kind: "advance"; toExerciseId: string; reasonVi: string }
  | { kind: "regress"; toExerciseId: string; reasonVi: string }
  | { kind: "increase"; reasonVi: string }
  | { kind: "hold" };

const minOf = (t: ExerciseSessionResult["target"]) =>
  t.measure === "time" ? (t.secondsMin ?? 0) : (t.repsMin ?? 0);
const maxOf = (t: ExerciseSessionResult["target"]) =>
  t.measure === "time" ? (t.secondsMax ?? minOf(t)) : (t.repsMax ?? minOf(t));
const unit = (t: ExerciseSessionResult["target"]) => (t.measure === "time" ? " giây" : "");

/**
 * Tiêu chí lên bậc của một buổi: lấy mức thấp hơn giữa tiêu chí của thang và mục tiêu tối đa
 * của giai đoạn, để "đạt tối đa mục tiêu" là đủ (double progression).
 */
function advanceThreshold(rule: AdvanceWhen, target: ExerciseSessionResult["target"]) {
  const ruleValue = target.measure === "time" ? rule.seconds : rule.reps;
  return {
    sets: Math.min(rule.sets, target.sets),
    value: Math.min(ruleValue ?? Infinity, maxOf(target)),
  };
}

function metAdvance(result: ExerciseSessionResult, rule: AdvanceWhen): boolean {
  const { sets, value } = advanceThreshold(rule, result.target);
  const reached = result.values.filter((v) => v >= value).length;
  return reached >= sets && (result.rpe === undefined || result.rpe <= rule.maxRpe) && !result.pain;
}

function struggled(result: ExerciseSessionResult, config: ProgressionConfig): boolean {
  const belowMin = result.values.filter((v) => v < minOf(result.target)).length;
  return (result.rpe ?? 0) >= config.hardRpe || belowMin >= config.setsBelowMinToStruggle;
}

/**
 * Quyết định cho một bài trong thang sau khi kết thúc buổi (FR-PRO-01…04).
 * `history`: kết quả các buổi gần nhất của bài này, mới nhất trước.
 * Không bao giờ tự đổi bậc — chỉ trả về đề xuất để người dùng xác nhận.
 */
export function evaluateProgression<E extends { id: string; equipment: Gear[] }>(
  exerciseId: string,
  history: readonly ExerciseSessionResult[],
  ladder: ProgressionLadder,
  exercisesById: ReadonlyMap<string, E>,
  gear: readonly Gear[],
  config: ProgressionConfig = progressionConfig,
): ProgressionDecision {
  const latest = history[0];
  if (!latest) return { kind: "hold" };

  const available = availableSteps(ladder, exercisesById, gear).map((e) => e.id);
  const order = ladder.steps.map((s) => s.exerciseId);
  const index = order.indexOf(exerciseId);
  const easier = available.filter((id) => order.indexOf(id) < index).at(-1);
  const harder = available.find((id) => order.indexOf(id) > index);
  const recent = history.slice(0, config.historySessions);

  // Báo đau đã được xử lý ngay trong buổi tập (Sprint 3) — không tạo thêm đề xuất trùng.
  if (latest.pain) return { kind: "hold" };

  if (recent.length === config.historySessions && recent.every((r) => struggled(r, config))) {
    if (!easier) return { kind: "hold" };
    const hard = recent.every((r) => (r.rpe ?? 0) >= config.hardRpe);
    return {
      kind: "regress",
      toExerciseId: easier,
      reasonVi: hard
        ? `Bạn đánh giá "Khó" ${recent.length} buổi liên tiếp.`
        : `${recent.length} buổi gần nhất có nhiều hiệp chưa đạt mức tối thiểu ${minOf(latest.target)}${unit(latest.target)}.`,
    };
  }

  const rule = ladder.steps[index]?.advanceWhen;
  if (rule) {
    const needed = Math.max(rule.sessions, 1);
    const window = history.slice(0, needed);
    if (window.length === needed && window.every((r) => metAdvance(r, rule))) {
      const { sets, value } = advanceThreshold(rule, latest.target);
      const reason = `Bạn đã đạt ${sets}×${value}${unit(latest.target)} trong ${needed} buổi liên tiếp.`;
      if (harder) return { kind: "advance", toExerciseId: harder, reasonVi: reason };
    }
    return { kind: "hold" };
  }

  // Bậc cuối của thang: gợi ý tăng khối lượng thay vì lên bậc.
  if (
    recent.length === config.historySessions &&
    recent.every(
      (r) =>
        r.values.length >= r.target.sets &&
        r.values.every((v) => v >= maxOf(r.target)) &&
        (r.rpe ?? 0) < config.hardRpe,
    )
  ) {
    return {
      kind: "increase",
      reasonVi: `Bạn đã đạt tối đa mục tiêu ${recent.length} buổi liên tiếp ở bậc cao nhất — có thể thêm một hiệp hoặc tập chậm hơn để tăng độ khó.`,
    };
  }
  return { kind: "hold" };
}
