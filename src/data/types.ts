import type { Gear } from "@/content/schema";
import type { PlannedItem, PlayerState } from "@/domain/session";

export type Goal = "general" | "muscle" | "fat_loss" | "skill";
export type SessionMinutes = 15 | 30 | 45;

/** Hồ sơ duy nhất của người dùng trên thiết bị (không cần tài khoản). */
export interface UserProfile {
  id: "me";
  goal: Goal;
  daysPerWeek: number;
  /** Ngày tập ưa thích (0 = CN … 6 = T7), chỉ để nhắc — lịch vẫn là hàng đợi. */
  preferredDays?: number[];
  sessionMinutes: SessionMinutes;
  gear: Gear[];
  activeProgramId: string;
  /** `null` khi người dùng bỏ qua bước sàng lọc sức khỏe. */
  health: { flagged: boolean; answeredAt: string } | null;
  disclaimerAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: "me";
  sound: boolean;
  vibration: boolean;
  keepAwake: boolean;
}

/** Bậc hiện tại của người dùng trong một thang biến thể. */
export interface LadderState {
  ladderId: string;
  exerciseId: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  programId: string;
  phaseId: string;
  sessionTemplateId: string;
  /** VD "Buổi A — Toàn thân A". */
  titleVi: string;
  /** Kế hoạch chụp lại lúc bắt đầu buổi. */
  plan: PlannedItem[];
  /** Trạng thái player, lưu sau mỗi thao tác để tiếp tục được khi tải lại. */
  player: PlayerState;
  startedAt: string;
  endedAt?: string;
  status: "in_progress" | "completed" | "abandoned";
  notes?: string;
  deletedAt?: string;
}

export interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  reps?: number;
  seconds?: number;
  rpe?: number;
  assistance?: string;
  painReported?: boolean;
  completedAt: string;
}

export interface Suggestion {
  id: string;
  exerciseId: string;
  kind: "increase" | "hold" | "decrease" | "advance" | "regress" | "deload";
  reasonVi: string;
  createdAt: string;
  status: "pending" | "accepted" | "dismissed";
  ladderId?: string;
  /** Bậc đích khi lên/hạ bậc. */
  toExerciseId?: string;
  /** Buổi tập sinh ra đề xuất. */
  sessionId?: string;
}

export interface MetaEntry {
  key: string;
  value: string;
}
