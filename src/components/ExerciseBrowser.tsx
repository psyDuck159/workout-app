"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Exercise, MuscleGroup } from "@/content/schema";
import { difficultyLabels, gearLabels, muscleLabels } from "@/content/labels";
import {
  difficultyBucket,
  filterExercises,
  type DifficultyFilter,
  type GearFilter,
} from "@/domain/search";

export type ExerciseSummary = Pick<
  Exercise,
  "id" | "nameVi" | "nameEn" | "primaryMuscles" | "secondaryMuscles" | "equipment" | "difficulty"
> & { thumbnail: string | null };

const selectClass =
  "border-input bg-background h-11 rounded-md border px-3 text-sm focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none";

export default function ExerciseBrowser({ exercises }: { exercises: ExerciseSummary[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "">("");
  const [gear, setGear] = useState<GearFilter | "">("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter | "">("");

  const results = useMemo(
    () =>
      filterExercises(
        exercises,
        {
          query,
          muscle: muscle || undefined,
          gear: gear || undefined,
          difficulty: difficulty || undefined,
        },
        muscleLabels,
      ),
    [exercises, query, muscle, gear, difficulty],
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm bài tập, VD: chong day, squat…"
          aria-label="Tìm bài tập"
          className="border-input bg-background focus-visible:ring-ring/50 h-11 w-full rounded-md border pr-3 pl-9 text-base outline-none focus-visible:ring-[3px]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label="Nhóm cơ"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value as MuscleGroup | "")}
          className={selectClass}
        >
          <option value="">Nhóm cơ</option>
          {Object.entries(muscleLabels)
            .filter(([key]) => key !== "full_body")
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
        </select>
        <select
          aria-label="Dụng cụ"
          value={gear}
          onChange={(e) => setGear(e.target.value as GearFilter | "")}
          className={selectClass}
        >
          <option value="">Dụng cụ</option>
          <option value="none">Không cần</option>
          {Object.entries(gearLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Độ khó"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as DifficultyFilter | "")}
          className={selectClass}
        >
          <option value="">Độ khó</option>
          {Object.entries(difficultyLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {results.length} bài tập
      </p>

      <ul className="space-y-2">
        {results.map((e) => (
          <li key={e.id}>
            <Link
              href={`/exercises/${e.id}`}
              className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-2 transition-colors"
            >
              {e.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh đã tối ưu sẵn
                <img
                  src={e.thumbnail}
                  alt=""
                  loading="lazy"
                  className="bg-muted size-16 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="bg-muted size-16 shrink-0 rounded-md" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.nameVi}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {e.primaryMuscles.map((m) => muscleLabels[m]).join(", ")}
                  {e.equipment.length > 0 &&
                    ` · ${e.equipment.map((g) => gearLabels[g]).join(", ")}`}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {difficultyLabels[difficultyBucket(e.difficulty)]}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">Không tìm thấy bài tập phù hợp.</p>
      )}
    </div>
  );
}
