import type { Gear } from "@/content/schema";
import { defaultSettings, reconcileLadderStates } from "@/domain/profile";
import type { WorkoutDB } from "./db";
import type { LadderState, Settings, UserProfile } from "./types";

/** Dữ liệu nội dung tối thiểu để đồng bộ bậc tập theo dụng cụ. */
export interface GearIndex {
  ladders: { id: string; steps: { exerciseId: string }[] }[];
  exercises: { id: string; equipment: Gear[] }[];
}

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
  };
}
