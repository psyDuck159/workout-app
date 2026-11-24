import type { Gear } from "@/content/schema";

export type Goal = "general" | "muscle" | "fat_loss" | "skill";
export type SessionMinutes = 15 | 30 | 45;

/** Hồ sơ duy nhất của người dùng trên thiết bị (không cần tài khoản). */
export interface UserProfile {
  id: "me";
  goal: Goal;
  daysPerWeek: number;
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

// Các bảng dưới đây được tạo sẵn trong schema v1, dùng từ Sprint 3–4.

export interface WorkoutSession {
  id: string;
  programId: string;
  phaseId: string;
  sessionTemplateId: string;
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
}

export interface MetaEntry {
  key: string;
  value: string;
}
