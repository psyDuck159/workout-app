"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./db";
import { createRepositories, type Repositories } from "./repositories";
import type { LadderState, SetLog, Settings, UserProfile, WorkoutSession } from "./types";
import { defaultSettings } from "@/domain/profile";

type QueryResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface DbQuery<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
}

/** useLiveQuery kèm trạng thái loading/lỗi (VD: trình duyệt chặn IndexedDB). */
function useDbQuery<T>(querier: () => Promise<T>, deps: unknown[] = []): DbQuery<T> {
  const result = useLiveQuery(async (): Promise<QueryResult<T>> => {
    try {
      return { ok: true, value: await querier() };
    } catch (error) {
      return { ok: false, error };
    }
  }, deps);
  if (!result) return { data: undefined, loading: true, error: undefined };
  return result.ok
    ? { data: result.value, loading: false, error: undefined }
    : { data: undefined, loading: false, error: result.error };
}

export function useRepositories(): Repositories {
  return useMemo(() => createRepositories(getDb), []);
}

/** `data` là `null` khi chưa có hồ sơ (chưa onboarding). */
export function useProfile(): DbQuery<UserProfile | null> {
  return useDbQuery(async () => (await getDb().profile.get("me")) ?? null);
}

export function useSettings(): DbQuery<Settings> {
  return useDbQuery(async () => ({ ...defaultSettings, ...(await getDb().settings.get("me")) }));
}

export function useLadderStates(): DbQuery<Map<string, LadderState>> {
  return useDbQuery(
    async () => new Map((await getDb().ladderStates.toArray()).map((s) => [s.ladderId, s])),
  );
}

/** Buổi đang tập dở; `data` là `null` nếu không có. */
export function useActiveSession(): DbQuery<WorkoutSession | null> {
  return useDbQuery(
    async () => (await getDb().sessions.where("status").equals("in_progress").first()) ?? null,
  );
}

export function useSessionSets(sessionId: string | undefined): DbQuery<SetLog[]> {
  return useDbQuery(
    async () => (sessionId ? getDb().sets.where({ sessionId }).sortBy("completedAt") : []),
    [sessionId],
  );
}

export function useSession(sessionId: string | undefined): DbQuery<WorkoutSession | null> {
  return useDbQuery(
    async () => (sessionId ? ((await getDb().sessions.get(sessionId)) ?? null) : null),
    [sessionId],
  );
}
