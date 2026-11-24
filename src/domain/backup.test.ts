import { describe, expect, it } from "vitest";
import type { SetLog, WorkoutSession } from "@/data/types";
import { BACKUP_FORMAT, parseBackup, planImport, toCsv, type BackupFile } from "./backup";

const session = (id: string, extra: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id,
  programId: "p",
  phaseId: "foundation",
  sessionTemplateId: "A",
  titleVi: "Buổi A — Toàn thân A",
  plan: [{ exerciseId: "push-up", measure: "reps", sets: 1, repsMin: 8, repsMax: 12, restSec: 90 }],
  player: { phase: { kind: "done" }, items: [{ sets: 1, done: 1, skipped: false, pain: false }] },
  startedAt: "2026-11-20T07:30:00.000Z",
  status: "completed",
  ...extra,
});
const set = (id: string, sessionId: string, extra: Partial<SetLog> = {}): SetLog => ({
  id,
  sessionId,
  exerciseId: "push-up",
  setIndex: 0,
  reps: 10,
  completedAt: "2026-11-20T07:31:00.000Z",
  ...extra,
});
const backup = (data: Partial<BackupFile["data"]> = {}): BackupFile => ({
  format: BACKUP_FORMAT,
  schemaVersion: 1,
  exportedAt: "2026-11-24T00:00:00.000Z",
  data: {
    profile: null,
    settings: null,
    ladderStates: [],
    sessions: [],
    sets: [],
    suggestions: [],
    ...data,
  },
});
const none = {
  hasProfile: false,
  hasSettings: false,
  hasActiveSession: false,
  sessionIds: new Set<string>(),
  setIds: new Set<string>(),
  ladderIds: new Set<string>(),
  suggestionIds: new Set<string>(),
};

describe("parseBackup", () => {
  it("nhận file hợp lệ, giữ trường lạ để không mất dữ liệu", () => {
    const file = backup({ sessions: [{ ...session("s1"), extra: "x" } as WorkoutSession] });
    const result = parseBackup(JSON.stringify(file), 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backup.data.sessions[0]).toMatchObject({ id: "s1", extra: "x" });
  });

  it.each([
    ["không phải JSON", "{oops", /JSON hợp lệ/],
    ["sai định dạng", JSON.stringify({ format: "khac" }), /không phải bản sao lưu/],
    [
      "thiếu trường bắt buộc",
      JSON.stringify(backup({ sets: [{ id: "x" } as SetLog] })),
      /không phải bản sao lưu/,
    ],
    [
      "từ phiên bản mới hơn",
      JSON.stringify({ ...backup(), schemaVersion: 9 }),
      /phiên bản ứng dụng mới hơn/,
    ],
  ])("từ chối file %s", (_, text, error) => {
    const result = parseBackup(text, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(error);
  });
});

describe("planImport", () => {
  it("máy trống: lấy toàn bộ", () => {
    const file = backup({
      profile: { id: "me" } as BackupFile["data"]["profile"],
      sessions: [session("s1")],
      sets: [set("x1", "s1")],
      ladderStates: [{ ladderId: "push", exerciseId: "push-up", updatedAt: "x" }],
    });
    const plan = planImport(file, none);
    expect(plan.profile).not.toBeNull();
    expect(plan.sessions).toHaveLength(1);
    expect(plan.sets).toHaveLength(1);
    expect(plan.ladderStates).toHaveLength(1);
  });

  it("dữ liệu trên máy luôn được giữ: bỏ bản ghi trùng, giữ hồ sơ và bậc tập hiện tại", () => {
    const file = backup({
      profile: { id: "me" } as BackupFile["data"]["profile"],
      sessions: [session("s1"), session("s2")],
      sets: [set("x1", "s1"), set("x2", "s2")],
      ladderStates: [{ ladderId: "push", exerciseId: "push-up", updatedAt: "x" }],
    });
    const plan = planImport(file, {
      ...none,
      hasProfile: true,
      sessionIds: new Set(["s1"]),
      setIds: new Set(["x1"]),
      ladderIds: new Set(["push"]),
    });
    expect(plan.profile).toBeNull();
    expect(plan.sessions.map((s) => s.id)).toEqual(["s2"]);
    expect(plan.sets.map((s) => s.id)).toEqual(["x2"]);
    expect(plan.ladderStates).toEqual([]);
    expect(plan.duplicates).toEqual({ sessions: 1, sets: 1 });
  });

  it("bỏ hiệp không thuộc buổi nào", () => {
    expect(planImport(backup({ sets: [set("x1", "mat-tich")] }), none).sets).toEqual([]);
  });

  it("chỉ giữ một buổi đang tập: buổi dở trong file thành 'bỏ dở' nếu máy đã có buổi dở", () => {
    const file = backup({ sessions: [session("s1", { status: "in_progress" })] });
    expect(planImport(file, none).sessions[0].status).toBe("in_progress");
    expect(planImport(file, { ...none, hasActiveSession: true }).sessions[0].status).toBe(
      "abandoned",
    );
  });
});

describe("toCsv", () => {
  it("mỗi dòng một hiệp, tiêu đề tiếng Việt, thoát dấu phẩy/ngoặc kép", () => {
    const csv = toCsv(
      [session("s1", { titleVi: 'Buổi "A", sáng' })],
      [
        set("x2", "s1", { setIndex: 1, reps: 9, completedAt: "2026-11-20T07:33:00.000Z", rpe: 7 }),
        set("x1", "s1", { painReported: true }),
        set("x3", "khong-co"),
      ],
      { "push-up": "Chống đẩy" },
    );
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      "Ngày,Giờ,Buổi,Trạng thái,Bài tập,Mã bài,Hiệp,Số lần,Số giây,RPE,Mức dây,Báo đau",
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"Buổi ""A"", sáng",Hoàn thành,Chống đẩy,push-up,1,10,,,,Có');
    expect(lines[2]).toContain(",2,9,,7,,");
  });
});
