import type { Metadata } from "next";
import ExerciseBrowser, { type ExerciseSummary } from "@/components/ExerciseBrowser";
import { exercises, mediaUrl } from "@/content";

export const metadata: Metadata = { title: "Thư viện bài tập" };

export default function ExercisesPage() {
  const summaries: ExerciseSummary[] = [...exercises]
    .sort((a, b) => a.difficulty - b.difficulty || a.nameVi.localeCompare(b.nameVi, "vi"))
    .map((e) => ({
      id: e.id,
      nameVi: e.nameVi,
      nameEn: e.nameEn,
      primaryMuscles: e.primaryMuscles,
      secondaryMuscles: e.secondaryMuscles,
      equipment: e.equipment,
      difficulty: e.difficulty,
      thumbnail: e.media ? mediaUrl(e.media.frames[0]) : null,
    }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Thư viện bài tập</h1>
      <ExerciseBrowser exercises={summaries} />
    </main>
  );
}
