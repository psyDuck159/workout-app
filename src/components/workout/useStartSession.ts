"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProgramClientData } from "@/content/client";
import type { Gear } from "@/content/schema";
import { useRepositories } from "@/data/hooks";
import type { LadderState } from "@/data/types";
import { buildSessionPlan } from "@/domain/plan";
import { adjustPlan, type PlanAdjustment } from "@/domain/schedule";
import { initialPlayer, type PlannedItem } from "@/domain/session";
import { unlockAudio } from "@/platform/audio";

/** Kế hoạch cụ thể của một buổi mẫu theo dụng cụ, bậc tập và điều chỉnh lịch (giảm tải…). */
export function planFor(
  data: ProgramClientData,
  phaseId: string,
  templateId: string,
  ladderStates: ReadonlyMap<string, LadderState>,
  gear: readonly Gear[],
  adjustments: readonly PlanAdjustment[] = [],
): PlannedItem[] {
  const template = data.program.phases
    .find((p) => p.id === phaseId)
    ?.sessions.find((s) => s.id === templateId);
  if (!template) return [];
  const plan = buildSessionPlan(
    template,
    new Map(data.ladders.map((l) => [l.id, l])),
    new Map(data.exercises.map((e) => [e.id, e])),
    ladderStates,
    gear,
  );
  return adjustPlan(plan, adjustments);
}

/** Bắt đầu một buổi tập rồi mở màn hình đang tập. Dùng chung cho trang chủ và trang giai đoạn. */
export function useStartSession(data: ProgramClientData) {
  const router = useRouter();
  const repos = useRepositories();
  const [starting, setStarting] = useState<string>();
  const [error, setError] = useState<string>();

  async function start(phaseId: string, templateId: string, plan: PlannedItem[]) {
    unlockAudio(); // iOS chỉ cho phát âm thanh sau một thao tác chạm.
    setStarting(`${phaseId}/${templateId}`);
    setError(undefined);
    const template = data.program.phases
      .find((p) => p.id === phaseId)
      ?.sessions.find((s) => s.id === templateId);
    try {
      await repos.startSession({
        programId: data.program.id,
        phaseId,
        sessionTemplateId: templateId,
        titleVi: `Buổi ${templateId} — ${template?.titleVi ?? ""}`,
        plan,
        player: initialPlayer(plan),
      });
      router.push("/workout");
    } catch {
      setError("Không bắt đầu được buổi tập.");
      setStarting(undefined);
    }
  }

  return { start, starting, error };
}
