import { describe, expect, it } from "vitest";
import { adjustPlan, adjustmentsFor, computeSchedule, type CompletedSessionRef } from "./schedule";
import type { PlannedItem } from "./session";

const phase = (id: string, weeks = 4) => ({
  id,
  order: 1,
  titleVi: id,
  goalVi: id,
  weeks,
  deloadLastWeek: true,
  sessions: [
    { id: "A", titleVi: "A", items: [] },
    { id: "B", titleVi: "B", items: [] },
  ],
});
const program = { id: "p", phases: [phase("foundation"), phase("build", 2)] };
const NOW = new Date("2026-11-24T12:00:00");

/** n buổi đã xong ở giai đoạn, cách nhau 2 ngày, buổi cuối cách NOW `lastDaysAgo` ngày. */
function done(phaseId: string, templates: string[], lastDaysAgo = 1): CompletedSessionRef[] {
  return templates.map((t, i) => {
    const d = new Date(NOW.getTime() - (lastDaysAgo + (templates.length - 1 - i) * 2) * 86_400_000);
    return { programId: "p", phaseId, sessionTemplateId: t, startedAt: d.toISOString() };
  });
}

describe("computeSchedule", () => {
  it("chưa tập buổi nào: giai đoạn 1, tuần 1, buổi A", () => {
    expect(computeSchedule(program, [], 3, NOW)).toMatchObject({
      phaseId: "foundation",
      week: 1,
      sessionsDone: 0,
      sessionsTotal: 12,
      nextTemplateId: "A",
      isDeloadWeek: false,
      isComeback: false,
      trainedToday: false,
    });
  });

  it("buổi kế tiếp đứng sau buổi vừa tập, không theo số đếm", () => {
    expect(computeSchedule(program, done("foundation", ["A"]), 3, NOW).nextTemplateId).toBe("B");
    expect(computeSchedule(program, done("foundation", ["A", "B"]), 3, NOW).nextTemplateId).toBe(
      "A",
    );
    expect(computeSchedule(program, done("foundation", ["B", "B"]), 3, NOW).nextTemplateId).toBe(
      "A",
    );
  });

  it("lỡ nhiều ngày không làm mất buổi: vẫn là buổi tiếp theo trong hàng đợi", () => {
    const s = computeSchedule(program, done("foundation", ["A", "B", "A"], 6), 3, NOW);
    expect(s).toMatchObject({ week: 2, sessionsDone: 3, nextTemplateId: "B", isComeback: false });
  });

  it("tuần cuối giai đoạn là tuần giảm tải", () => {
    const nine = done(
      "foundation",
      Array.from({ length: 9 }, (_, i) => (i % 2 ? "B" : "A")),
    );
    expect(computeSchedule(program, nine, 3, NOW)).toMatchObject({ week: 4, isDeloadWeek: true });
  });

  it("đủ số buổi thì sang giai đoạn tiếp; số buổi/tuần đổi thì tuần tính lại", () => {
    const twelve = done(
      "foundation",
      Array.from({ length: 12 }, (_, i) => (i % 2 ? "B" : "A")),
    );
    expect(computeSchedule(program, twelve, 3, NOW)).toMatchObject({
      phaseId: "build",
      week: 1,
      nextTemplateId: "A",
      phaseProgress: 0,
    });
    expect(computeSchedule(program, twelve.slice(0, 8), 2, NOW)).toMatchObject({
      phaseId: "build",
    });
  });

  it("xong mọi giai đoạn thì lặp lại giai đoạn cuối", () => {
    const all = [...done("foundation", Array(12).fill("A")), ...done("build", Array(6).fill("A"))];
    expect(computeSchedule(program, all, 3, NOW)).toMatchObject({
      programComplete: true,
      phaseId: "build",
    });
  });

  it("bỏ qua buổi của chương trình khác", () => {
    const other = done("foundation", ["A", "B"]).map((s) => ({ ...s, programId: "khac" }));
    expect(computeSchedule(program, other, 3, NOW).sessionsDone).toBe(0);
  });

  it("nghỉ từ 10 ngày → buổi khởi động lại; tập hôm nay thì báo đã tập", () => {
    expect(computeSchedule(program, done("foundation", ["A"], 12), 3, NOW)).toMatchObject({
      isComeback: true,
      daysSinceLast: 12,
    });
    expect(computeSchedule(program, done("foundation", ["A"], 0), 3, NOW).trainedToday).toBe(true);
  });
});

describe("adjustPlan", () => {
  const plan: PlannedItem[] = [
    { exerciseId: "a", measure: "reps", sets: 3, repsMin: 8, repsMax: 12, restSec: 90 },
    { exerciseId: "b", measure: "reps", sets: 4, repsMin: 8, repsMax: 12, restSec: 90 },
    { exerciseId: "c", measure: "reps", sets: 1, repsMin: 8, repsMax: 12, restSec: 90 },
  ];

  it("tuần giảm tải giảm khoảng một nửa số hiệp, tối thiểu 1", () => {
    expect(adjustPlan(plan, ["deload"]).map((p) => p.sets)).toEqual([2, 2, 1]);
  });

  it("buổi khởi động lại giảm ~30%; cả hai thì lấy mức giảm nhiều hơn", () => {
    expect(adjustPlan(plan, ["comeback"]).map((p) => p.sets)).toEqual([3, 3, 1]);
    expect(adjustPlan(plan, ["comeback", "deload"]).map((p) => p.sets)).toEqual([2, 2, 1]);
  });

  it("không điều chỉnh thì giữ nguyên", () => {
    expect(adjustPlan(plan, [])).toEqual(plan);
    expect(adjustmentsFor({ isDeloadWeek: true, isComeback: false })).toEqual(["deload"]);
  });
});
