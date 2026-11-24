import type { Gear } from "@/content/schema";
import { defaultSettings, reconcileLadderStates } from "@/domain/profile";
import {
  ratingToRpe,
  reducePlayer,
  type PlannedItem,
  type PlayerState,
  type Rating,
} from "@/domain/session";
import { newId } from "@/lib/id";
import type { WorkoutDB } from "./db";
import type { LadderState, SetLog, Settings, UserProfile, WorkoutSession } from "./types";

/** Dữ liệu nội dung tối thiểu để đồng bộ bậc tập theo dụng cụ. */
export interface GearIndex {
  ladders: { id: string; steps: { exerciseId: string }[] }[];
  exercises: { id: string; equipment: Gear[] }[];
}

export interface NewSession {
  programId: string;
  phaseId: string;
  sessionTemplateId: string;
  titleVi: string;
  plan: PlannedItem[];
  player: PlayerState;
}

export type NewSet = Pick<SetLog, "exerciseId" | "setIndex" | "reps" | "seconds" | "assistance">;

/**
 * Truy cập dữ liệu người dùng. UI chỉ dùng interface này để sau có thể thay
 * bằng bản có đồng bộ (v2) mà không sửa giao diện (NFR-MNT-04).
 */
export interface Repositories {
  getProfile(): Promise<UserProfile | undefined>;
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Omit<Settings, "id">>): Promise<void>;
  getLadderStates(): Promise<LadderState[]>;
  /** Lưu hồ sơ lần đầu và gán bậc khởi đầu cho mọi thang trong một giao dịch. */
  completeOnboarding(profile: UserProfile, index: GearIndex): Promise<void>;
  /** Cập nhật hồ sơ; nếu đổi dụng cụ thì đồng bộ lại bậc tập. */
  updateProfile(
    patch: Partial<Omit<UserProfile, "id" | "createdAt">>,
    index: GearIndex,
  ): Promise<UserProfile>;

  /** Bắt đầu buổi tập; báo lỗi nếu đang có buổi dở (mỗi lúc chỉ một buổi). */
  startSession(session: NewSession): Promise<WorkoutSession>;
  getActiveSession(): Promise<WorkoutSession | undefined>;
  /** Ghi một hiệp và trạng thái player trong cùng một giao dịch (NFR-REL-01). */
  logSet(sessionId: string, set: NewSet, player: PlayerState): Promise<void>;
  updatePlayer(sessionId: string, player: PlayerState): Promise<void>;
  /** Ghi nhận báo đau: cập nhật player và tạo đề xuất hạ bậc chờ xử lý. */
  reportPain(
    sessionId: string,
    player: PlayerState,
    exerciseId: string,
    reasonVi: string,
  ): Promise<void>;
  /** Kết thúc buổi; đánh giá Dễ/Vừa/Khó được ghi thành RPE vào hiệp cuối của mỗi bài. */
  completeSession(sessionId: string, player: PlayerState): Promise<void>;
  /** Đánh giá (hoặc sửa đánh giá) một bài, kể cả sau khi buổi đã kết thúc. */
  rateExercise(sessionId: string, item: number, rating: Rating): Promise<void>;
  abandonSession(sessionId: string): Promise<void>;
  saveNotes(sessionId: string, notes: string): Promise<void>;
  getSessionSets(sessionId: string): Promise<SetLog[]>;
  /** Kết quả từng hiệp ở buổi gần nhất có tập bài này (không tính buổi `excludeSessionId`). */
  getLastPerformance(exerciseId: string, excludeSessionId?: string): Promise<number[] | undefined>;
  /** Kết quả tốt nhất của từng bài trước buổi `excludeSessionId`. */
  getBests(exerciseIds: string[], excludeSessionId: string): Promise<Map<string, number>>;
}

const setValue = (s: SetLog) => s.reps ?? s.seconds ?? 0;

/** `openDb` được gọi lúc dùng (không phải lúc tạo) để an toàn khi component render trên server. */
export function createRepositories(
  openDb: () => WorkoutDB,
  now: () => Date = () => new Date(),
): Repositories {
  const reconcile = async (db: WorkoutDB, gear: Gear[], index: GearIndex) => {
    const states = await db.ladderStates.toArray();
    const updates = reconcileLadderStates(
      states,
      index.ladders,
      new Map(index.exercises.map((e) => [e.id, e])),
      gear,
      now(),
    );
    if (updates.length > 0) await db.ladderStates.bulkPut(updates);
  };

  return {
    getProfile: () => openDb().profile.get("me"),

    async getSettings() {
      return { ...defaultSettings, ...(await openDb().settings.get("me")) };
    },

    async saveSettings(patch) {
      const db = openDb();
      const current = { ...defaultSettings, ...(await db.settings.get("me")) };
      await db.settings.put({ ...current, ...patch, id: "me" });
    },

    getLadderStates: () => openDb().ladderStates.toArray(),

    async completeOnboarding(profile, index) {
      const db = openDb();
      await db.transaction("rw", db.profile, db.ladderStates, async () => {
        await db.profile.put(profile);
        await reconcile(db, profile.gear, index);
      });
    },

    async updateProfile(patch, index) {
      const db = openDb();
      return db.transaction("rw", db.profile, db.ladderStates, async () => {
        const current = await db.profile.get("me");
        if (!current) throw new Error("Chưa có hồ sơ — cần hoàn thành onboarding trước");
        const next: UserProfile = {
          ...current,
          ...patch,
          id: "me",
          updatedAt: now().toISOString(),
        };
        await db.profile.put(next);
        if (patch.gear) await reconcile(db, next.gear, index);
        return next;
      });
    },

    async startSession(input) {
      const db = openDb();
      return db.transaction("rw", db.sessions, async () => {
        const active = await db.sessions.where("status").equals("in_progress").first();
        if (active) throw new Error("Đang có buổi tập dở — tiếp tục hoặc bỏ buổi đó trước");
        const session: WorkoutSession = {
          id: newId(),
          ...input,
          startedAt: now().toISOString(),
          status: "in_progress",
        };
        await db.sessions.add(session);
        return session;
      });
    },

    getActiveSession: () => openDb().sessions.where("status").equals("in_progress").first(),

    async logSet(sessionId, set, player) {
      const db = openDb();
      await db.transaction("rw", db.sessions, db.sets, async () => {
        const session = await db.sessions.get(sessionId);
        if (session?.status !== "in_progress") throw new Error("Buổi tập không còn diễn ra");
        await db.sets.add({ ...set, id: newId(), sessionId, completedAt: now().toISOString() });
        await db.sessions.update(sessionId, { player });
      });
    },

    async updatePlayer(sessionId, player) {
      await openDb().sessions.update(sessionId, { player });
    },

    async reportPain(sessionId, player, exerciseId, reasonVi) {
      const db = openDb();
      await db.transaction("rw", db.sessions, db.sets, db.suggestions, async () => {
        await db.sessions.update(sessionId, { player });
        const last = (await db.sets.where({ sessionId }).toArray())
          .filter((s) => s.exerciseId === exerciseId)
          .sort((a, b) => b.setIndex - a.setIndex)[0];
        if (last) await db.sets.update(last.id, { painReported: true });
        await db.suggestions.add({
          id: newId(),
          exerciseId,
          kind: "regress",
          reasonVi,
          createdAt: now().toISOString(),
          status: "pending",
        });
      });
    },

    async completeSession(sessionId, player) {
      const db = openDb();
      await db.transaction("rw", db.sessions, db.sets, async () => {
        const session = await db.sessions.get(sessionId);
        if (!session) return;
        const sets = await db.sets.where({ sessionId }).toArray();
        for (const [index, progress] of player.items.entries()) {
          const exerciseId = session.plan[index]?.exerciseId;
          if (!progress.rating || !exerciseId) continue;
          const last = sets
            .filter((s) => s.exerciseId === exerciseId)
            .sort((a, b) => b.setIndex - a.setIndex)[0];
          if (last) await db.sets.update(last.id, { rpe: ratingToRpe[progress.rating] });
        }
        await db.sessions.update(sessionId, {
          player,
          status: "completed",
          endedAt: now().toISOString(),
        });
      });
    },

    async rateExercise(sessionId, item, rating) {
      const db = openDb();
      await db.transaction("rw", db.sessions, db.sets, async () => {
        const session = await db.sessions.get(sessionId);
        const exerciseId = session?.plan[item]?.exerciseId;
        if (!session || !exerciseId) return;
        const player = reducePlayer(session.player, session.plan, { type: "rate", item, rating });
        await db.sessions.update(sessionId, { player });
        const last = (await db.sets.where({ sessionId }).toArray())
          .filter((s) => s.exerciseId === exerciseId)
          .sort((a, b) => b.setIndex - a.setIndex)[0];
        if (last) await db.sets.update(last.id, { rpe: ratingToRpe[rating] });
      });
    },

    async abandonSession(sessionId) {
      await openDb().sessions.update(sessionId, {
        status: "abandoned",
        endedAt: now().toISOString(),
      });
    },

    async saveNotes(sessionId, notes) {
      await openDb().sessions.update(sessionId, { notes });
    },

    getSessionSets: (sessionId) => openDb().sets.where({ sessionId }).sortBy("completedAt"),

    async getLastPerformance(exerciseId, excludeSessionId) {
      const sets = (await openDb().sets.where({ exerciseId }).toArray()).filter(
        (s) => s.sessionId !== excludeSessionId,
      );
      if (sets.length === 0) return undefined;
      const latest = sets.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
      return sets
        .filter((s) => s.sessionId === latest.sessionId)
        .sort((a, b) => a.setIndex - b.setIndex)
        .map(setValue);
    },

    async getBests(exerciseIds, excludeSessionId) {
      const sets = await openDb().sets.where("exerciseId").anyOf(exerciseIds).toArray();
      const bests = new Map<string, number>();
      for (const s of sets) {
        if (s.sessionId === excludeSessionId) continue;
        bests.set(s.exerciseId, Math.max(bests.get(s.exerciseId) ?? 0, setValue(s)));
      }
      return bests;
    },
  };
}
