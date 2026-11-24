import type { Exercise, Gear, Ladder } from "@/content/schema";
import type { Goal, LadderState, SessionMinutes, Settings, UserProfile } from "@/data/types";
import { availableSteps } from "./ladder";

export const DAYS_PER_WEEK = { min: 2, max: 6, default: 3 } as const;
export const SESSION_MINUTES: readonly SessionMinutes[] = [15, 30, 45];

export interface OnboardingAnswers {
  goal?: Goal;
  daysPerWeek?: number;
  sessionMinutes?: SessionMinutes;
  gear?: Gear[];
  /** `undefined` = bỏ qua bước sàng lọc. */
  healthYes?: boolean;
}

export const defaultSettings: Settings = {
  id: "me",
  sound: true,
  vibration: true,
  keepAwake: true,
};

/** Tạo hồ sơ từ câu trả lời onboarding; bước nào bỏ qua dùng giá trị mặc định (FR-ONB-02). */
export function buildProfile(
  answers: OnboardingAnswers,
  programId: string,
  now: Date = new Date(),
): UserProfile {
  const iso = now.toISOString();
  const days = answers.daysPerWeek ?? DAYS_PER_WEEK.default;
  return {
    id: "me",
    goal: answers.goal ?? "general",
    daysPerWeek: Math.min(DAYS_PER_WEEK.max, Math.max(DAYS_PER_WEEK.min, Math.round(days))),
    sessionMinutes: answers.sessionMinutes ?? 30,
    gear: [...new Set(answers.gear ?? [])],
    activeProgramId: programId,
    health:
      answers.healthYes === undefined ? null : { flagged: answers.healthYes, answeredAt: iso },
    disclaimerAcceptedAt: iso,
    createdAt: iso,
    updatedAt: iso,
  };
}

type GearedExercise = Pick<Exercise, "id" | "equipment">;

/**
 * Đồng bộ bậc hiện tại của từng thang với dụng cụ người dùng có (FR-PRG-07).
 * - Thang chưa có trạng thái → bậc dễ nhất tập được.
 * - Bài hiện tại không còn tập được → bậc gần nhất dễ hơn còn tập được, nếu không có thì bậc dễ nhất.
 * - Thang không có bậc nào phù hợp → giữ nguyên để khi có lại dụng cụ thì tập tiếp.
 * Trả về các trạng thái cần ghi (đã đổi hoặc mới).
 */
export function reconcileLadderStates(
  current: readonly LadderState[],
  ladders: readonly Pick<Ladder, "id" | "steps">[],
  exercisesById: ReadonlyMap<string, GearedExercise>,
  gear: readonly Gear[],
  now: Date = new Date(),
): LadderState[] {
  const byLadder = new Map(current.map((s) => [s.ladderId, s]));
  const updates: LadderState[] = [];

  for (const ladder of ladders) {
    const available = availableSteps(ladder, exercisesById, gear);
    if (available.length === 0) continue;

    const state = byLadder.get(ladder.id);
    if (state && available.some((e) => e.id === state.exerciseId)) continue;

    let next = available[0];
    if (state) {
      const order = ladder.steps.map((s) => s.exerciseId);
      const currentIndex = order.indexOf(state.exerciseId);
      const easier = available.filter((e) => order.indexOf(e.id) < currentIndex);
      if (easier.length > 0) next = easier[easier.length - 1];
    }
    updates.push({ ladderId: ladder.id, exerciseId: next.id, updatedAt: now.toISOString() });
  }
  return updates;
}

/** Bài người dùng đang tập trong thang: theo trạng thái đã lưu, nếu không hợp lệ thì bậc dễ nhất. */
export function currentExerciseOf<E extends GearedExercise>(
  ladder: Pick<Ladder, "id" | "steps">,
  states: ReadonlyMap<string, LadderState>,
  exercisesById: ReadonlyMap<string, E>,
  gear: readonly Gear[],
): E | undefined {
  const available = availableSteps(ladder, exercisesById, gear);
  const saved = states.get(ladder.id);
  return available.find((e) => e.id === saved?.exerciseId) ?? available[0];
}
