import type { Program } from "@/content/schema";
import { progressionConfig, type ProgressionConfig } from "./progressionConfig";
import type { PlannedItem } from "./session";

/** Buổi đã hoàn thành, tối thiểu để tính lịch. */
export interface CompletedSessionRef {
  programId: string;
  phaseId: string;
  sessionTemplateId: string;
  startedAt: string;
  endedAt?: string;
}

export interface ScheduleState {
  phaseIndex: number;
  phaseId: string;
  /** Tuần hiện tại trong giai đoạn, bắt đầu từ 1. */
  week: number;
  weeks: number;
  sessionsDone: number;
  sessionsTotal: number;
  /** 0–1. */
  phaseProgress: number;
  nextTemplateId: string;
  isDeloadWeek: boolean;
  /** Đã nghỉ đủ lâu để buổi tới nên nhẹ hơn (FR-PRO-05). */
  isComeback: boolean;
  daysSinceLast?: number;
  trainedToday: boolean;
  /** Đã hoàn thành mọi giai đoạn; khi đó lặp lại giai đoạn cuối. */
  programComplete: boolean;
}

const DAY_MS = 86_400_000;

const localDay = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * Lịch dạng hàng đợi (FR-SCH-02): tiến độ tính theo số buổi đã hoàn thành, không theo ngày.
 * Lỡ buổi thì buổi đó vẫn là buổi tiếp theo; mỗi giai đoạn cần `weeks × daysPerWeek` buổi.
 */
export function computeSchedule(
  program: Pick<Program, "id" | "phases">,
  completed: readonly CompletedSessionRef[],
  daysPerWeek: number,
  now: Date = new Date(),
  config: ProgressionConfig = progressionConfig,
): ScheduleState {
  const mine = completed
    .filter((s) => s.programId === program.id)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const perWeek = Math.max(1, daysPerWeek);

  let phaseIndex = program.phases.findIndex((phase) => {
    const done = mine.filter((s) => s.phaseId === phase.id).length;
    return done < phase.weeks * perWeek;
  });
  const programComplete = phaseIndex === -1;
  if (programComplete) phaseIndex = program.phases.length - 1;

  const phase = program.phases[phaseIndex];
  const inPhase = mine.filter((s) => s.phaseId === phase.id);
  const sessionsTotal = phase.weeks * perWeek;
  const sessionsDone = programComplete ? 0 : inPhase.length;
  const week = Math.min(phase.weeks, Math.floor(sessionsDone / perWeek) + 1);

  // Buổi kế tiếp là buổi đứng sau buổi vừa tập trong giai đoạn (A → B → A…).
  const templates = phase.sessions.map((s) => s.id);
  const lastTemplate = inPhase.at(-1)?.sessionTemplateId;
  const lastIndex = lastTemplate ? templates.indexOf(lastTemplate) : -1;
  const nextTemplateId = templates[(lastIndex + 1) % templates.length];

  const last = mine.at(-1);
  const lastDate = last ? new Date(last.endedAt ?? last.startedAt) : undefined;
  const daysSinceLast = lastDate
    ? Math.floor((now.getTime() - lastDate.getTime()) / DAY_MS)
    : undefined;

  return {
    phaseIndex,
    phaseId: phase.id,
    week,
    weeks: phase.weeks,
    sessionsDone,
    sessionsTotal,
    phaseProgress: Math.min(1, sessionsDone / sessionsTotal),
    nextTemplateId,
    isDeloadWeek: phase.deloadLastWeek && week === phase.weeks,
    isComeback: daysSinceLast !== undefined && daysSinceLast >= config.comebackAfterDays,
    daysSinceLast,
    trainedToday: lastDate !== undefined && localDay(lastDate) === localDay(now),
    programComplete,
  };
}

export type PlanAdjustment = "deload" | "comeback";

/** Giảm số hiệp cho tuần giảm tải hoặc buổi quay lại sau thời gian nghỉ (lấy mức giảm nhiều hơn). */
export function adjustPlan(
  plan: readonly PlannedItem[],
  adjustments: readonly PlanAdjustment[],
  config: ProgressionConfig = progressionConfig,
): PlannedItem[] {
  const factors = adjustments.map((a) =>
    a === "deload" ? config.deloadSetFactor : config.comebackSetFactor,
  );
  if (factors.length === 0) return [...plan];
  const factor = Math.min(...factors);
  return plan.map((item) => ({ ...item, sets: Math.max(1, Math.ceil(item.sets * factor)) }));
}

export function adjustmentsFor(schedule: Pick<ScheduleState, "isDeloadWeek" | "isComeback">) {
  const result: PlanAdjustment[] = [];
  if (schedule.isDeloadWeek) result.push("deload");
  if (schedule.isComeback) result.push("comeback");
  return result;
}
