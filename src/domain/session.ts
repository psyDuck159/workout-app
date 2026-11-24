import type { MeasureType } from "@/content/schema";

/** Một bài trong buổi tập, chụp lại lúc bắt đầu buổi (không đổi khi hồ sơ đổi sau đó). */
export interface PlannedItem {
  exerciseId: string;
  ladderId?: string;
  measure: MeasureType;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  secondsMin?: number;
  secondsMax?: number;
  restSec: number;
}

export type Rating = "easy" | "medium" | "hard";

export interface ItemProgress {
  /** Số hiệp dự kiến (tăng khi "Thêm hiệp"). */
  sets: number;
  /** Số hiệp đã ghi. */
  done: number;
  skipped: boolean;
  pain: boolean;
  rating?: Rating;
}

export type PlayerPhase =
  /** Chờ người dùng tập hiệp `items[item].done` của bài `item`. */
  | { kind: "exercise"; item: number }
  /** Đang nghỉ, hết giờ thì sang bài `item`. `finishedItem` = bài vừa tập xong (để đánh giá / thêm hiệp). */
  | { kind: "rest"; item: number; endsAt: number; finishedItem?: number }
  | { kind: "done" };

export interface PlayerState {
  phase: PlayerPhase;
  items: ItemProgress[];
}

export type PlayerEvent =
  | { type: "logSet"; now: number }
  | { type: "restElapsed" }
  | { type: "skipRest" }
  | { type: "adjustRest"; deltaMs: number; now: number }
  | { type: "rate"; item: number; rating: Rating }
  | { type: "skipExercise" }
  | { type: "addSet" }
  | { type: "reportPain" }
  | { type: "finish" };

export const ratingToRpe: Record<Rating, number> = { easy: 6, medium: 8, hard: 10 };

export function initialPlayer(plan: readonly PlannedItem[]): PlayerState {
  const items = plan.map((p) => ({ sets: p.sets, done: 0, skipped: false, pain: false }));
  return { phase: plan.length > 0 ? { kind: "exercise", item: 0 } : { kind: "done" }, items };
}

const hasRemaining = (p: ItemProgress) => !p.skipped && !p.pain && p.done < p.sets;

/** Bài tiếp theo còn hiệp chưa tập, tính từ vị trí `from`. -1 nếu hết. */
function nextItem(items: readonly ItemProgress[], from: number): number {
  for (let i = from; i < items.length; i++) if (hasRemaining(items[i])) return i;
  return -1;
}

function goTo(items: ItemProgress[], from: number): PlayerState {
  const next = nextItem(items, from);
  return { items, phase: next === -1 ? { kind: "done" } : { kind: "exercise", item: next } };
}

const updateItem = (items: readonly ItemProgress[], index: number, patch: Partial<ItemProgress>) =>
  items.map((p, i) => (i === index ? { ...p, ...patch } : p));

/** Reducer thuần; sự kiện không hợp lệ với pha hiện tại thì trả nguyên trạng thái. */
export function reducePlayer(
  state: PlayerState,
  plan: readonly PlannedItem[],
  event: PlayerEvent,
): PlayerState {
  const { phase } = state;

  switch (event.type) {
    case "logSet": {
      if (phase.kind !== "exercise") return state;
      const current = state.items[phase.item];
      const items = updateItem(state.items, phase.item, { done: current.done + 1 });
      const endsAt = event.now + plan[phase.item].restSec * 1000;
      if (items[phase.item].done < items[phase.item].sets) {
        return { items, phase: { kind: "rest", item: phase.item, endsAt } };
      }
      const next = nextItem(items, phase.item + 1);
      if (next === -1) return { items, phase: { kind: "done" } };
      return { items, phase: { kind: "rest", item: next, endsAt, finishedItem: phase.item } };
    }

    case "restElapsed":
    case "skipRest":
      if (phase.kind !== "rest") return state;
      return { ...state, phase: { kind: "exercise", item: phase.item } };

    case "adjustRest":
      if (phase.kind !== "rest") return state;
      return {
        ...state,
        phase: { ...phase, endsAt: Math.max(event.now, phase.endsAt + event.deltaMs) },
      };

    case "rate":
      if (!state.items[event.item]) return state;
      return { ...state, items: updateItem(state.items, event.item, { rating: event.rating }) };

    case "skipExercise":
      if (phase.kind !== "exercise") return state;
      return goTo(updateItem(state.items, phase.item, { skipped: true }), phase.item + 1);

    case "reportPain":
      if (phase.kind !== "exercise") return state;
      return goTo(updateItem(state.items, phase.item, { pain: true }), phase.item + 1);

    case "addSet": {
      if (phase.kind === "exercise") {
        const sets = state.items[phase.item].sets + 1;
        return { ...state, items: updateItem(state.items, phase.item, { sets }) };
      }
      // Vừa xong một bài và đang nghỉ: thêm hiệp cho bài đó, nghỉ xong quay lại bài đó.
      if (phase.kind === "rest" && phase.finishedItem !== undefined) {
        const target = phase.finishedItem;
        const items = updateItem(state.items, target, { sets: state.items[target].sets + 1 });
        return { items, phase: { kind: "rest", item: target, endsAt: phase.endsAt } };
      }
      return state;
    }

    case "finish":
      return { ...state, phase: { kind: "done" } };
  }
}

/** Vị trí hiệp sắp tập (bài, hiệp bắt đầu từ 0). */
export function currentPosition(state: PlayerState): { item: number; set: number } | undefined {
  if (state.phase.kind === "done") return undefined;
  const item = state.phase.item;
  return { item, set: state.items[item].done };
}

/**
 * Số điền sẵn cho nút "Xong": kết quả hiệp tương ứng lần trước (giới hạn trong khoảng mục tiêu),
 * chưa có thì lấy mức thấp của mục tiêu.
 */
export function prefillValue(
  item: Pick<PlannedItem, "measure" | "repsMin" | "repsMax" | "secondsMin" | "secondsMax">,
  setIndex: number,
  last: readonly number[] | undefined,
): number {
  const [min, max] =
    item.measure === "time"
      ? [item.secondsMin ?? 1, item.secondsMax ?? item.secondsMin ?? 1]
      : [item.repsMin ?? 1, item.repsMax ?? item.repsMin ?? 1];
  const previous = last?.[setIndex] ?? last?.[last.length - 1];
  if (previous === undefined) return min;
  return Math.min(max, Math.max(min, previous));
}

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;
  reps?: number;
  seconds?: number;
}

export interface ExerciseSummary {
  item: number;
  exerciseId: string;
  measure: MeasureType;
  values: number[];
  skipped: boolean;
  pain: boolean;
  rating?: Rating;
  /** Kết quả tốt nhất từ trước tới nay (không tính buổi này) bị vượt. */
  isRecord: boolean;
}

export interface WorkoutSummaryData {
  durationMs: number;
  totalSets: number;
  exercises: ExerciseSummary[];
}

export function summarize(
  plan: readonly PlannedItem[],
  state: PlayerState,
  sets: readonly LoggedSet[],
  previousBest: ReadonlyMap<string, number>,
  startedAt: number,
  endedAt: number,
): WorkoutSummaryData {
  const exercises = plan.map((p, item): ExerciseSummary => {
    const values = sets
      .filter((s) => s.exerciseId === p.exerciseId)
      .sort((a, b) => a.setIndex - b.setIndex)
      .map((s) => (p.measure === "time" ? s.seconds : s.reps) ?? 0);
    const best = previousBest.get(p.exerciseId);
    const progress = state.items[item];
    return {
      item,
      exerciseId: p.exerciseId,
      measure: p.measure,
      values,
      skipped: progress?.skipped ?? false,
      pain: progress?.pain ?? false,
      rating: progress?.rating,
      isRecord: best !== undefined && values.some((v) => v > best),
    };
  });
  return {
    durationMs: Math.max(0, endedAt - startedAt),
    totalSets: sets.length,
    exercises,
  };
}
