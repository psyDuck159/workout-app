import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ExerciseMedia from "@/components/ExerciseMedia";
import { exercises, findLadderOf, getExercise, mediaAttribution, mediaUrl } from "@/content";
import {
  difficultyLabels,
  gearLabels,
  householdLabels,
  measureLabels,
  muscleLabels,
} from "@/content/labels";
import type { Attribution } from "@/content/schema";
import { difficultyBucket } from "@/domain/search";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return exercises.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const exercise = getExercise((await params).id);
  return { title: exercise?.nameVi };
}

function Section({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <List className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </section>
  );
}

export default async function ExercisePage({ params }: Props) {
  const exercise = getExercise((await params).id);
  if (!exercise) notFound();

  const frames = exercise.media?.frames ?? [];
  const ladderInfo = findLadderOf(exercise.id);
  // Các khung hình của một bài thường chung nguồn — gộp theo sourceUrl.
  const credits = new Map<string, Attribution>();
  for (const frame of frames) {
    const credit = mediaAttribution[frame];
    if (credit) credits.set(credit.sourceUrl, credit);
  }
  const equipment = [
    ...exercise.equipment.map((g) => gearLabels[g]),
    ...exercise.household.map((h) => householdLabels[h]),
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <Link
        href="/exercises"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Thư viện bài tập
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{exercise.nameVi}</h1>
        <p className="text-muted-foreground">{exercise.nameEn}</p>
      </header>

      <ExerciseMedia frames={frames.map(mediaUrl)} alt={`Minh họa ${exercise.nameVi}`} />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Nhóm cơ chính</dt>
          <dd>{exercise.primaryMuscles.map((m) => muscleLabels[m]).join(", ")}</dd>
        </div>
        {exercise.secondaryMuscles.length > 0 && (
          <div>
            <dt className="text-muted-foreground">Nhóm cơ phụ</dt>
            <dd>{exercise.secondaryMuscles.map((m) => muscleLabels[m]).join(", ")}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Dụng cụ</dt>
          <dd>{equipment.length > 0 ? equipment.join(", ") : "Không cần"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Đo bằng</dt>
          <dd>{measureLabels[exercise.measure]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Độ khó</dt>
          <dd>
            {difficultyLabels[difficultyBucket(exercise.difficulty)]} ({exercise.difficulty}/10)
          </dd>
        </div>
        {ladderInfo && (
          <div>
            <dt className="text-muted-foreground">Thuộc thang</dt>
            <dd>
              {ladderInfo.ladder.nameVi} — bậc {ladderInfo.step}/{ladderInfo.ladder.steps.length}
            </dd>
          </div>
        )}
      </dl>

      <Section title="Cách thực hiện" items={exercise.steps} ordered />
      <Section title="Lỗi thường gặp" items={exercise.commonMistakes} />
      <Section title="Mẹo" items={exercise.tips} />
      {exercise.contraindications.length > 0 && (
        <section className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Không nên tập khi</h2>
          <ul className="list-disc space-y-1 pl-5">
            {exercise.contraindications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-muted-foreground space-y-3 border-t pt-4 text-sm">
        <p>
          Nội dung tham khảo từ nguồn công khai, chưa được chuyên gia kiểm duyệt. Dừng tập nếu thấy
          đau.
        </p>
        <div>
          <p className="font-medium">Nguồn tham khảo</p>
          <ul className="list-disc pl-5">
            {exercise.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {credits.size > 0 && (
          <div>
            <p className="font-medium">Ảnh minh họa</p>
            <ul className="list-disc pl-5">
              {[...credits.values()].map((c) => (
                <li key={c.sourceUrl}>
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {c.source}
                  </a>
                  {c.author && ` — ${c.author}`} ·{" "}
                  <a
                    href={c.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {c.license}
                  </a>{" "}
                  · {c.modified}
                </li>
              ))}
            </ul>
          </div>
        )}
      </footer>
    </main>
  );
}
