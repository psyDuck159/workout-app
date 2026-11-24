import type { Metadata } from "next";
import WorkoutPlayer from "@/components/workout/WorkoutPlayer";
import type { WorkoutExercise } from "@/components/workout/types";
import { exercises, ladders, mediaUrl } from "@/content";

export const metadata: Metadata = { title: "Đang tập" };

export default function WorkoutPage() {
  const catalog: WorkoutExercise[] = exercises.map((e) => ({
    id: e.id,
    nameVi: e.nameVi,
    measure: e.measure,
    equipment: e.equipment,
    assistance: e.assistance,
    frames: (e.media?.frames ?? []).map(mediaUrl),
    cues: e.commonMistakes.slice(0, 2),
  }));

  return (
    <main className="mx-auto max-w-md px-4 pt-4 pb-40">
      <WorkoutPlayer
        catalog={catalog}
        ladders={ladders.map((l) => ({
          id: l.id,
          steps: l.steps.map((s) => ({ exerciseId: s.exerciseId })),
        }))}
      />
    </main>
  );
}
