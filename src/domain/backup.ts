import { z } from "zod";
import type {
  LadderState,
  SetLog,
  Settings,
  Suggestion,
  UserProfile,
  WorkoutSession,
} from "@/data/types";

export const BACKUP_FORMAT = "workout-app-backup";

/** File sao lưu đầy đủ (FR-DAT-01): nhập lại được, kể cả trên thiết bị khác. */
export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  /** Phiên bản schema IndexedDB lúc xuất. */
  schemaVersion: number;
  exportedAt: string;
  data: {
    profile: UserProfile | null;
    settings: Settings | null;
    ladderStates: LadderState[];
    sessions: WorkoutSession[];
    sets: SetLog[];
    suggestions: Suggestion[];
  };
}

// Kiểm tra các trường then chốt; trường khác giữ nguyên để không mất dữ liệu của phiên bản mới hơn.
const record = <T extends z.ZodRawShape>(shape: T) => z.looseObject(shape);
const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  data: z.object({
    profile: record({ id: z.literal("me"), gear: z.array(z.string()) }).nullable(),
    settings: record({ id: z.literal("me") }).nullable(),
    ladderStates: z.array(record({ ladderId: z.string(), exerciseId: z.string() })),
    sessions: z.array(
      record({
        id: z.string(),
        status: z.enum(["in_progress", "completed", "abandoned"]),
        startedAt: z.string(),
        plan: z.array(record({ exerciseId: z.string() })),
        player: record({ items: z.array(z.unknown()) }),
      }),
    ),
    sets: z.array(
      record({
        id: z.string(),
        sessionId: z.string(),
        exerciseId: z.string(),
        setIndex: z.number(),
      }),
    ),
    suggestions: z.array(record({ id: z.string(), exerciseId: z.string(), status: z.string() })),
  }),
});

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };

export function parseBackup(text: string, currentSchemaVersion: number): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "File không phải JSON hợp lệ." };
  }
  const result = BackupSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: "File không phải bản sao lưu của Workout App hoặc đã bị hỏng." };
  }
  if (result.data.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      error: "File được xuất từ phiên bản ứng dụng mới hơn. Hãy cập nhật ứng dụng.",
    };
  }
  return { ok: true, backup: result.data as unknown as BackupFile };
}

export interface ExistingIds {
  hasProfile: boolean;
  hasSettings: boolean;
  hasActiveSession: boolean;
  sessionIds: ReadonlySet<string>;
  setIds: ReadonlySet<string>;
  ladderIds: ReadonlySet<string>;
  suggestionIds: ReadonlySet<string>;
}

export interface ImportPlan {
  profile: UserProfile | null;
  settings: Settings | null;
  ladderStates: LadderState[];
  sessions: WorkoutSession[];
  sets: SetLog[];
  suggestions: Suggestion[];
  duplicates: { sessions: number; sets: number };
}

/**
 * Hợp nhất bản sao lưu vào dữ liệu hiện có (UC-05): dữ liệu trên máy luôn được giữ,
 * chỉ thêm bản ghi chưa có. Hồ sơ/cài đặt/bậc tập chỉ lấy từ file khi máy chưa có.
 * Mỗi lúc chỉ một buổi đang tập — buổi dở trong file bị chuyển thành "bỏ dở" nếu cần.
 */
export function planImport(backup: BackupFile, existing: ExistingIds): ImportPlan {
  const { data } = backup;
  let activeTaken = existing.hasActiveSession;
  const sessions = data.sessions
    .filter((s) => !existing.sessionIds.has(s.id))
    .map((s) => {
      if (s.status !== "in_progress") return s;
      if (activeTaken) return { ...s, status: "abandoned" as const };
      activeTaken = true;
      return s;
    });
  const knownSessions = new Set([...existing.sessionIds, ...sessions.map((s) => s.id)]);
  const sets = data.sets.filter(
    (s) => !existing.setIds.has(s.id) && knownSessions.has(s.sessionId),
  );

  return {
    profile: existing.hasProfile ? null : data.profile,
    settings: existing.hasSettings ? null : data.settings,
    ladderStates: data.ladderStates.filter((l) => !existing.ladderIds.has(l.ladderId)),
    sessions,
    sets,
    suggestions: data.suggestions.filter((s) => !existing.suggestionIds.has(s.id)),
    duplicates: {
      sessions: data.sessions.length - sessions.length,
      sets: data.sets.filter((s) => existing.setIds.has(s.id)).length,
    },
  };
}

const statusLabels: Record<WorkoutSession["status"], string> = {
  completed: "Hoàn thành",
  abandoned: "Bỏ dở",
  in_progress: "Đang tập",
};

function csvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV mỗi dòng một hiệp (RFC 4180), mở được bằng Excel/Google Sheets. */
export function toCsv(
  sessions: readonly WorkoutSession[],
  sets: readonly SetLog[],
  exerciseNames: Readonly<Record<string, string>>,
): string {
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const header = [
    "Ngày",
    "Giờ",
    "Buổi",
    "Trạng thái",
    "Bài tập",
    "Mã bài",
    "Hiệp",
    "Số lần",
    "Số giây",
    "RPE",
    "Mức dây",
    "Báo đau",
  ];
  const rows = [...sets]
    .filter((s) => byId.has(s.sessionId))
    .sort(
      (a, b) =>
        byId.get(a.sessionId)!.startedAt.localeCompare(byId.get(b.sessionId)!.startedAt) ||
        a.completedAt.localeCompare(b.completedAt),
    )
    .map((s) => {
      const session = byId.get(s.sessionId)!;
      const start = new Date(session.startedAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      return [
        `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
        `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        session.titleVi,
        statusLabels[session.status],
        exerciseNames[s.exerciseId] ?? s.exerciseId,
        s.exerciseId,
        s.setIndex + 1,
        s.reps,
        s.seconds,
        s.rpe,
        s.assistance,
        s.painReported ? "Có" : "",
      ]
        .map(csvCell)
        .join(",");
    });
  return [header.join(","), ...rows].join("\r\n") + "\r\n";
}
