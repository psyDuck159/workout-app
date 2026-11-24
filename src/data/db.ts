import Dexie, { type EntityTable } from "dexie";
import type {
  LadderState,
  MetaEntry,
  SetLog,
  Settings,
  Suggestion,
  UserProfile,
  WorkoutSession,
} from "./types";

export const DB_NAME = "workout-app";

/**
 * Cơ sở dữ liệu IndexedDB trên thiết bị. `db.verno` là schemaVersion của dữ liệu.
 *
 * Thêm phiên bản mới: KHÔNG sửa `version(1)`; khai báo `this.version(2).stores({...}).upgrade(tx => ...)`
 * và viết test migration trong db.test.ts (NFR-REL-03).
 */
export class WorkoutDB extends Dexie {
  profile!: EntityTable<UserProfile, "id">;
  settings!: EntityTable<Settings, "id">;
  ladderStates!: EntityTable<LadderState, "ladderId">;
  sessions!: EntityTable<WorkoutSession, "id">;
  sets!: EntityTable<SetLog, "id">;
  suggestions!: EntityTable<Suggestion, "id">;
  meta!: EntityTable<MetaEntry, "key">;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      profile: "&id",
      settings: "&id",
      ladderStates: "&ladderId",
      sessions: "&id, startedAt, status",
      sets: "&id, sessionId, exerciseId, [sessionId+setIndex]",
      suggestions: "&id, exerciseId, status",
      meta: "&key",
    });
  }
}

let instance: WorkoutDB | undefined;

/** DB dùng chung trong trình duyệt. Chỉ gọi ở client. */
export function getDb(): WorkoutDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() chỉ dùng được trong trình duyệt");
  }
  instance ??= new WorkoutDB();
  return instance;
}
