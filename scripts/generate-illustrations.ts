/**
 * Sinh hình minh họa SVG tự vẽ cho mọi bài tập từ scripts/illustrations/poses.ts,
 * cập nhật `media.frames` trong src/content/exercises/*.json và ghi công trong
 * src/content/media-attribution.json.
 *
 *   npm run generate:illustrations
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { poses } from "./illustrations/poses";
import { renderPose } from "./illustrations/skeleton";
import type { Attribution } from "../src/content/schema";

const ROOT = path.resolve(__dirname, "..");
const MEDIA_DIR = path.join(ROOT, "public/media/exercises");
const EXERCISES_DIR = path.join(ROOT, "src/content/exercises");
const ATTRIBUTION_FILE = path.join(ROOT, "src/content/media-attribution.json");

const credit: Attribution = {
  source: "workout-app (tự vẽ)",
  sourceUrl: null,
  license: "MIT",
  licenseUrl: "https://opensource.org/license/mit",
  author: null,
  modified: "Sinh tự động từ tư thế khớp xương (scripts/generate-illustrations.ts)",
};

interface ExerciseJson {
  id: string;
  nameVi: string;
  media: { frames: string[] } | null;
}

async function main() {
  await rm(MEDIA_DIR, { recursive: true, force: true });
  const attribution: Record<string, Attribution> = {};
  const seen = new Set<string>();
  const missing: string[] = [];

  for (const file of (await readdir(EXERCISES_DIR)).filter((f) => f.endsWith(".json"))) {
    const fullPath = path.join(EXERCISES_DIR, file);
    const exercises: ExerciseJson[] = JSON.parse(await readFile(fullPath, "utf8"));

    for (const exercise of exercises) {
      seen.add(exercise.id);
      const frames = poses[exercise.id];
      if (!frames?.length) {
        missing.push(exercise.id);
        exercise.media = null;
        continue;
      }
      await mkdir(path.join(MEDIA_DIR, exercise.id), { recursive: true });
      exercise.media = { frames: [] };
      for (const [index, pose] of frames.entries()) {
        const frame = `${exercise.id}/${index}.svg`;
        const title =
          frames.length > 1 ? `${exercise.nameVi} — tư thế ${index + 1}` : exercise.nameVi;
        await writeFile(path.join(MEDIA_DIR, frame), renderPose(pose, title));
        exercise.media.frames.push(frame);
        attribution[frame] = credit;
      }
    }
    await writeFile(fullPath, JSON.stringify(exercises, null, 2) + "\n");
  }

  await writeFile(ATTRIBUTION_FILE, JSON.stringify(attribution, null, 2) + "\n");

  const unused = Object.keys(poses).filter((id) => !seen.has(id));
  console.log(
    `Đã sinh ${Object.keys(attribution).length} hình cho ${seen.size - missing.length} bài.`,
  );
  if (missing.length) console.warn(`Chưa có tư thế: ${missing.join(", ")}`);
  if (unused.length) {
    console.error(`Tư thế không khớp bài tập nào: ${unused.join(", ")}`);
    process.exit(1);
  }
}

main();
