import type { Gear } from "@/content/schema";
import { defaultSettings, reconcileLadderStates } from "@/domain/profile";
import {
  ratingToRpe,
  reducePlayer,
  type PlannedItem,
  type PlayerState,
  type Rating,
} from "@/domain/session";
import {
  evaluateProgression,
  type ExerciseSessionResult,
  type ProgressionLadder,
} from "@/domain/progression";
import { BACKUP_FORMAT, planImport, type BackupFile, type ImportPlan } from "@/domain/backup";
import { newId } from "@/lib/id";
import type { WorkoutDB } from "./db";
import type {
  LadderState,
  SetLog,
  Settings,
  Suggestion,
  UserProfile,
  WorkoutSession,
} from "./types";

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

/** Dữ liệu để engine tăng tiến chạy khi kết thúc buổi. */
export interface ProgressionContext {
  ladders: ProgressionLadder[];
  exercises: { id: string; equipment: Gear[] }[];
  gear: Gear[];
}

/** Số ngày giữ buổi tập đã xóa trong thùng rác (FR-DAT-06). */
export const TRASH_DAYS = 30;

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
  /** Ghi nhận báo đau: cập nhật player và tạo đề xuất hạ bậc (nếu có bậc dễ hơn) chờ xác nhận. */
  reportPain(
    sessionId: string,
    player: PlayerState,
    exerciseId: string,
    reasonVi: string,
    target?: { ladderId: string; toExerciseId: string },
  ): Promise<void>;
  /**
   * Kết thúc buổi; đánh giá Dễ/Vừa/Khó được ghi thành RPE vào hiệp cuối của mỗi bài.
   * Có `progression` thì chạy engine tăng tiến và lưu đề xuất chờ người dùng xác nhận.
   */
  completeSession(
    sessionId: string,
    player: PlayerState,
    progression?: ProgressionContext,
  ): Promise<void>;
  /** Đánh giá (hoặc sửa đánh giá) một bài, kể cả sau khi buổi đã kết thúc. */
  rateExercise(sessionId: string, item: number, rating: Rating): Promise<void>;
  abandonSession(sessionId: string): Promise<void>;
  saveNotes(sessionId: string, notes: string): Promise<void>;
  getSessionSets(sessionId: string): Promise<SetLog[]>;
  /** Kết quả từng hiệp ở buổi gần nhất có tập bài này (không tính buổi `excludeSessionId`). */
  getLastPerformance(exerciseId: string, excludeSessionId?: string): Promise<number[] | undefined>;
  /** Kết quả tốt nhất của từng bài trước buổi `excludeSessionId`. */
  getBests(exerciseIds: string[], excludeSessionId: string): Promise<Map<string, number>>;

  /** Buổi đã hoàn thành (không tính buổi đã xóa), dùng để tính lịch. */
  getCompletedSessions(): Promise<WorkoutSession[]>;
  /** Đề xuất còn hiệu lực: mỗi thang tối đa một, bỏ đề xuất cho bài không còn là bậc hiện tại. */
  getPendingSuggestions(): Promise<Suggestion[]>;
  /** Chấp nhận đề xuất: lên/hạ bậc thì cập nhật bậc tập của thang. */
  acceptSuggestion(id: string): Promise<void>;
  dismissSuggestion(id: string): Promise<void>;

  /** Lịch sử buổi tập (hoàn thành hoặc bỏ dở), mới nhất trước, không gồm buổi đã xóa. */
  listHistory(): Promise<WorkoutSession[]>;
  /** Sửa kết quả một hiệp. */
  updateSet(setId: string, value: number): Promise<void>;
  /** Xóa mềm (vào thùng rác) — hoàn tác được bằng `restoreSession`. */
  deleteSession(sessionId: string): Promise<void>;
  restoreSession(sessionId: string): Promise<void>;
  /** Xóa hẳn buổi đã nằm trong thùng rác quá `TRASH_DAYS` ngày. Trả về số buổi đã xóa. */
  purgeTrash(): Promise<number>;

  /** Xuất toàn bộ dữ liệu (FR-DAT-01). */
  exportBackup(): Promise<BackupFile>;
  /** Xem trước kết quả nhập: những gì sẽ được thêm, bao nhiêu bản ghi trùng. */
  previewImport(backup: BackupFile): Promise<ImportPlan>;
  /** Hợp nhất bản sao lưu vào dữ liệu hiện có trong một giao dịch. */
  importBackup(backup: BackupFile): Promise<ImportPlan>;
  /** Xóa toàn bộ dữ liệu trên thiết bị (FR-DAT-04). */
  wipeAll(): Promise<void>;
  schemaVersion(): number;
}

const setValue = (s: SetLog) => s.reps ?? s.seconds ?? 0;

/** Buổi còn hiệu lực (chưa bị xóa) trong số các id cho trước. */
async function liveSessions(db: WorkoutDB, ids: string[]): Promise<Map<string, WorkoutSession>> {
  const sessions = await db.sessions.bulkGet([...new Set(ids)]);
  return new Map(
    sessions
      .filter((s): s is WorkoutSession => s !== undefined && !s.deletedAt)
      .map((s) => [s.id, s]),
  );
}

/**
 * Kết quả các buổi đã hoàn thành gần nhất của một bài, mới nhất trước.
 * `since`: chỉ tính buổi bắt đầu từ lúc này (lần đổi bậc gần nhất), để vừa hạ bậc xong
 * không bị lịch sử cũ đề xuất lên lại ngay.
 */
async function exerciseHistory(
  db: WorkoutDB,
  exerciseId: string,
  limit: number,
  since?: string,
): Promise<ExerciseSessionResult[]> {
  const sets = await db.sets.where({ exerciseId }).toArray();
  const sessions = [
    ...(
      await liveSessions(
        db,
        sets.map((s) => s.sessionId),
      )
    ).values(),
  ]
    .filter((s) => s.status === "completed" && (!since || s.startedAt >= since))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);

  return sessions.flatMap((session) => {
    const index = session.plan.findIndex((p) => p.exerciseId === exerciseId);
    if (index < 0) return [];
    const progress = session.player.items[index];
    return [
      {
        target: session.plan[index],
        values: sets
          .filter((s) => s.sessionId === session.id)
          .sort((a, b) => a.setIndex - b.setIndex)
          .map(setValue),
        rpe: progress?.rating ? ratingToRpe[progress.rating] : undefined,
        pain: progress?.pain ?? false,
      },
    ];
  });
}

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

    async reportPain(sessionId, player, exerciseId, reasonVi, target) {
      const db = openDb();
      await db.transaction("rw", db.sessions, db.sets, db.suggestions, async () => {
        await db.sessions.update(sessionId, { player });
        const last = (await db.sets.where({ sessionId }).toArray())
          .filter((s) => s.exerciseId === exerciseId)
          .sort((a, b) => b.setIndex - a.setIndex)[0];
        if (last) await db.sets.update(last.id, { painReported: true });
        if (target) await dismissPendingFor(db, target.ladderId);
        await db.suggestions.add({
          id: newId(),
          exerciseId,
          kind: "regress",
          reasonVi,
          createdAt: now().toISOString(),
          status: "pending",
          sessionId,
          ...target,
        });
      });
    },

    async completeSession(sessionId, player, progression) {
      const db = openDb();
      const tables = [db.sessions, db.sets, db.suggestions, db.ladderStates];
      await db.transaction("rw", tables, async () => {
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
        if (progression) await suggestProgression(db, session, player, progression);
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
      const db = openDb();
      const all = (await db.sets.where({ exerciseId }).toArray()).filter(
        (s) => s.sessionId !== excludeSessionId,
      );
      const live = await liveSessions(
        db,
        all.map((s) => s.sessionId),
      );
      const sets = all.filter((s) => live.has(s.sessionId));
      if (sets.length === 0) return undefined;
      const latest = sets.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
      return sets
        .filter((s) => s.sessionId === latest.sessionId)
        .sort((a, b) => a.setIndex - b.setIndex)
        .map(setValue);
    },

    async getBests(exerciseIds, excludeSessionId) {
      const db = openDb();
      const sets = await db.sets.where("exerciseId").anyOf(exerciseIds).toArray();
      const live = await liveSessions(
        db,
        sets.map((s) => s.sessionId),
      );
      const bests = new Map<string, number>();
      for (const s of sets) {
        if (s.sessionId === excludeSessionId || !live.has(s.sessionId)) continue;
        bests.set(s.exerciseId, Math.max(bests.get(s.exerciseId) ?? 0, setValue(s)));
      }
      return bests;
    },

    async getCompletedSessions() {
      return (await openDb().sessions.where("status").equals("completed").toArray()).filter(
        (s) => !s.deletedAt,
      );
    },

    async getPendingSuggestions() {
      const db = openDb();
      const [pending, states] = await Promise.all([
        db.suggestions.where("status").equals("pending").toArray(),
        db.ladderStates.toArray(),
      ]);
      const current = new Map(states.map((s) => [s.ladderId, s.exerciseId]));
      const latest = new Map<string, Suggestion>();
      for (const s of pending.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
        if (!s.ladderId || current.get(s.ladderId) !== s.exerciseId) continue;
        if (!latest.has(s.ladderId)) latest.set(s.ladderId, s);
      }
      return [...latest.values()];
    },

    async acceptSuggestion(id) {
      const db = openDb();
      await db.transaction("rw", db.suggestions, db.ladderStates, async () => {
        const suggestion = await db.suggestions.get(id);
        if (!suggestion || suggestion.status !== "pending") return;
        if (suggestion.ladderId && suggestion.toExerciseId) {
          await db.ladderStates.put({
            ladderId: suggestion.ladderId,
            exerciseId: suggestion.toExerciseId,
            updatedAt: now().toISOString(),
          });
          await dismissPendingFor(db, suggestion.ladderId);
        }
        await db.suggestions.update(id, { status: "accepted" });
      });
    },

    async dismissSuggestion(id) {
      await openDb().suggestions.update(id, { status: "dismissed" });
    },

    async listHistory() {
      const sessions = await openDb().sessions.orderBy("startedAt").reverse().toArray();
      return sessions.filter((s) => !s.deletedAt && s.status !== "in_progress");
    },

    async updateSet(setId, value) {
      const db = openDb();
      const set = await db.sets.get(setId);
      if (!set) return;
      const safe = Math.max(0, Math.round(value));
      await db.sets.update(setId, set.seconds !== undefined ? { seconds: safe } : { reps: safe });
    },

    async deleteSession(sessionId) {
      await openDb().sessions.update(sessionId, { deletedAt: now().toISOString() });
    },

    async restoreSession(sessionId) {
      await openDb().sessions.update(sessionId, { deletedAt: undefined });
    },

    async purgeTrash() {
      const db = openDb();
      const cutoff = new Date(now().getTime() - TRASH_DAYS * 86_400_000).toISOString();
      return db.transaction("rw", db.sessions, db.sets, async () => {
        const expired = (await db.sessions.toArray()).filter(
          (s) => s.deletedAt && s.deletedAt < cutoff,
        );
        for (const s of expired) {
          await db.sets.where({ sessionId: s.id }).delete();
          await db.sessions.delete(s.id);
        }
        return expired.length;
      });
    },

    async exportBackup() {
      const db = openDb();
      return db.transaction("r", db.tables, async () => ({
        format: BACKUP_FORMAT,
        schemaVersion: db.verno,
        exportedAt: now().toISOString(),
        data: {
          profile: (await db.profile.get("me")) ?? null,
          settings: (await db.settings.get("me")) ?? null,
          ladderStates: await db.ladderStates.toArray(),
          sessions: await db.sessions.toArray(),
          sets: await db.sets.toArray(),
          suggestions: await db.suggestions.toArray(),
        },
      }));
    },

    async previewImport(backup) {
      return planImport(backup, await existingIds(openDb()));
    },

    async importBackup(backup) {
      const db = openDb();
      return db.transaction("rw", db.tables, async () => {
        const plan = planImport(backup, await existingIds(db));
        if (plan.profile) await db.profile.put(plan.profile);
        if (plan.settings) await db.settings.put(plan.settings);
        await db.ladderStates.bulkAdd(plan.ladderStates);
        await db.sessions.bulkAdd(plan.sessions);
        await db.sets.bulkAdd(plan.sets);
        await db.suggestions.bulkAdd(plan.suggestions);
        return plan;
      });
    },

    async wipeAll() {
      const db = openDb();
      await db.transaction("rw", db.tables, async () => {
        await Promise.all(db.tables.map((t) => t.clear()));
      });
    },

    schemaVersion: () => openDb().verno,
  };

  async function existingIds(db: WorkoutDB) {
    const [profile, settings, active, sessionIds, setIds, ladderIds, suggestionIds] =
      await Promise.all([
        db.profile.get("me"),
        db.settings.get("me"),
        db.sessions.where("status").equals("in_progress").first(),
        db.sessions.toCollection().primaryKeys(),
        db.sets.toCollection().primaryKeys(),
        db.ladderStates.toCollection().primaryKeys(),
        db.suggestions.toCollection().primaryKeys(),
      ]);
    return {
      hasProfile: profile !== undefined,
      hasSettings: settings !== undefined,
      hasActiveSession: active !== undefined,
      sessionIds: new Set(sessionIds),
      setIds: new Set(setIds),
      ladderIds: new Set(ladderIds),
      suggestionIds: new Set(suggestionIds),
    };
  }

  /** Bỏ các đề xuất cũ đang chờ của một thang (mỗi thang chỉ giữ đề xuất mới nhất). */
  async function dismissPendingFor(db: WorkoutDB, ladderId: string) {
    await db.suggestions
      .where("status")
      .equals("pending")
      .filter((s) => s.ladderId === ladderId)
      .modify({ status: "dismissed" });
  }

  /** Chạy engine cho từng bài thuộc thang trong buổi vừa xong và lưu đề xuất. */
  async function suggestProgression(
    db: WorkoutDB,
    session: WorkoutSession,
    player: PlayerState,
    ctx: ProgressionContext,
  ) {
    const exercisesById = new Map(ctx.exercises.map((e) => [e.id, e]));
    for (const [index, item] of session.plan.entries()) {
      const ladder = ctx.ladders.find((l) => l.id === item.ladderId);
      const progress = player.items[index];
      if (!ladder || !progress || progress.done === 0 || progress.pain) continue;

      const state = await db.ladderStates.get(ladder.id);
      const since = state?.exerciseId === item.exerciseId ? state.updatedAt : undefined;
      const history = await exerciseHistory(db, item.exerciseId, 3, since);
      const decision = evaluateProgression(
        item.exerciseId,
        history,
        ladder,
        exercisesById,
        ctx.gear,
      );
      if (decision.kind === "hold") continue;

      await dismissPendingFor(db, ladder.id);
      await db.suggestions.add({
        id: newId(),
        exerciseId: item.exerciseId,
        ladderId: ladder.id,
        kind: decision.kind,
        reasonVi: decision.reasonVi,
        createdAt: now().toISOString(),
        status: "pending",
        sessionId: session.id,
        ...("toExerciseId" in decision && { toExerciseId: decision.toExerciseId }),
      });
    }
  }
}
