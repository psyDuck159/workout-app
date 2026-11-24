"use client";

import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { usePendingSuggestions, useRepositories } from "@/data/hooks";
import type { Suggestion } from "@/data/types";
import { Button } from "@/components/ui/button";

const titleOf = (s: Suggestion, name: (id: string) => string) => {
  if (s.kind === "advance" && s.toExerciseId) return `Sẵn sàng thử ${name(s.toExerciseId)}?`;
  if (s.kind === "regress" && s.toExerciseId) return `Thử bậc dễ hơn: ${name(s.toExerciseId)}?`;
  return `${name(s.exerciseId)}: tăng độ khó`;
};

const Icon = ({ kind }: { kind: Suggestion["kind"] }) =>
  kind === "advance" ? (
    <ArrowUp className="size-5 text-emerald-600" aria-hidden />
  ) : kind === "regress" ? (
    <ArrowDown className="size-5 text-amber-600" aria-hidden />
  ) : (
    <TrendingUp className="size-5 text-sky-600" aria-hidden />
  );

/**
 * Đề xuất lên/hạ bậc chờ xác nhận (FR-PRO-02, 03): luôn kèm lý do, chỉ đổi khi người dùng đồng ý.
 * `sessionId` để chỉ hiện đề xuất sinh ra từ một buổi (màn hình tóm tắt).
 */
export default function SuggestionList({
  exerciseNames,
  sessionId,
}: {
  exerciseNames: Record<string, string>;
  sessionId?: string;
}) {
  const repos = useRepositories();
  const { data } = usePendingSuggestions();
  const suggestions = (data ?? []).filter((s) => !sessionId || s.sessionId === sessionId);
  if (suggestions.length === 0) return null;

  const name = (id: string) => exerciseNames[id] ?? id;

  return (
    <section aria-label="Gợi ý cho buổi sau" className="space-y-2">
      <h2 className="font-semibold">Gợi ý cho buổi sau</h2>
      {suggestions.map((s) => (
        <article key={s.id} className="bg-card space-y-3 rounded-lg border p-4">
          <div className="flex gap-3">
            <Icon kind={s.kind} />
            <div className="space-y-1">
              <h3 className="font-medium">{titleOf(s, name)}</h3>
              <p className="text-muted-foreground text-sm">{s.reasonVi}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {s.toExerciseId ? (
              <>
                <Button variant="ghost" onClick={() => repos.dismissSuggestion(s.id)}>
                  Để sau
                </Button>
                <Button onClick={() => repos.acceptSuggestion(s.id)}>
                  {s.kind === "advance" ? "Thử ở buổi sau" : "Đổi bậc"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => repos.acceptSuggestion(s.id)}>
                Đã hiểu
              </Button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
