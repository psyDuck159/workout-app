/**
 * Tải ảnh minh họa từ nguồn mở, chuyển sang WebP và ghi thông tin ghi công.
 *
 *   npx tsx scripts/fetch-media.ts           # chỉ tải file còn thiếu
 *   npx tsx scripts/fetch-media.ts --force   # tải lại tất cả
 *
 * Nguồn đã xác minh giấy phép: xem docs/MEDIA_SOURCES.md.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { loadRawContent } from "./load-raw-content";
import type { Attribution } from "../src/content/schema";

const ROOT = path.resolve(__dirname, "..");
const MEDIA_DIR = path.join(ROOT, "public/media/exercises");
const ATTRIBUTION_FILE = path.join(ROOT, "src/content/media-attribution.json");
const MAX_WIDTH = 600;
const MODIFIED = `Chuyển sang WebP, thu nhỏ tối đa ${MAX_WIDTH}px chiều rộng`;

const FEDB_RAW = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const FEDB_PAGE = "https://github.com/yuhonas/free-exercise-db/tree/main/exercises";

/** exercise id của app → thư mục trong free-exercise-db (ảnh 0.jpg, 1.jpg). */
const FREE_EXERCISE_DB: Record<string, string> = {
  "incline-push-up": "Incline_Push-Up",
  "push-up": "Pushups",
  "decline-push-up": "Decline_Push-Up",
  "diamond-push-up": "Push-Ups_-_Close_Triceps_Position",
  "single-arm-push-up": "Single-Arm_Push-Up",
  "wall-handstand-push-up": "Handstand_Push-Ups",
  "inverted-row": "Inverted_Row",
  "scapular-pull-up": "Scapular_Pull-Up",
  "band-assisted-pull-up": "Band_Assisted_Pull-Up",
  "chin-up": "Chin-Up",
  "pull-up": "Pullups",
  "bodyweight-squat": "Bodyweight_Squat",
  "split-squat": "Split_Squats",
  "glute-bridge": "Butt_Lift_Bridge",
  "single-leg-glute-bridge": "Single_Leg_Glute_Bridge",
  "nordic-curl": "Natural_Glute_Ham_Raise",
  "dead-bug": "Dead_Bug",
  plank: "Plank",
  "side-plank": "Side_Bridge",
  "hanging-leg-raise": "Hanging_Leg_Raise",
  "band-pull-apart": "Band_Pull_Apart",
  "band-shoulder-press": "Shoulder_Press_-_With_Bands",
  "band-squat": "Squats_-_With_Bands",
  "bench-dips": "Bench_Dips",
  superman: "Superman",
};

interface WgerSource {
  exerciseId: number;
  images: string[];
  author: string;
  license: "CC-BY-SA-3.0" | "CC-BY-SA-4.0" | "CC0-1.0";
}

/** Ảnh wger lấy từ API /api/v2/exerciseinfo/ — đã loại ảnh do AI tạo. */
const WGER: Record<string, WgerSource> = {
  "reverse-lunge": {
    exerciseId: 999,
    images: [
      "https://wger.de/media/exercise-images/999/d0931eb3-8db0-4049-bb08-aa4036072056.jfif",
      "https://wger.de/media/exercise-images/999/8548b2d2-004d-48b4-95fd-b1b25f4e53d0.jfif",
    ],
    author: "philip",
    license: "CC-BY-SA-4.0",
  },
  "bulgarian-split-squat": {
    exerciseId: 988,
    images: ["https://wger.de/media/exercise-images/988/6283b258-a4d7-4833-84f7-a38987022d3d.png"],
    author: "Franpol",
    license: "CC-BY-SA-4.0",
  },
  "pistol-squat": {
    exerciseId: 456,
    // Các ảnh còn lại của bài này gần như trùng tư thế nên chỉ lấy một.
    images: ["https://wger.de/media/exercise-images/456/3b681e59-377b-40db-9113-ca5873ce084b.jpg"],
    author: "wakanda90",
    license: "CC-BY-SA-4.0",
  },
};

const LICENSE_URLS: Record<string, string> = {
  Unlicense: "https://unlicense.org/",
  "CC-BY-SA-3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC-BY-SA-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
};

function resolveSource(exerciseId: string, frameIndex: number) {
  const fedb = FREE_EXERCISE_DB[exerciseId];
  if (fedb) {
    return {
      url: `${FEDB_RAW}/${fedb}/${frameIndex}.jpg`,
      attribution: {
        source: "free-exercise-db",
        sourceUrl: `${FEDB_PAGE}/${fedb}`,
        license: "Unlicense",
        licenseUrl: LICENSE_URLS.Unlicense,
        author: null,
        modified: MODIFIED,
      } satisfies Attribution,
    };
  }
  const wger = WGER[exerciseId];
  if (wger) {
    const url = wger.images[frameIndex];
    if (!url) return null;
    return {
      url,
      attribution: {
        source: "wger.de",
        sourceUrl: `https://wger.de/en/exercise/${wger.exerciseId}/view/`,
        license: wger.license,
        licenseUrl: LICENSE_URLS[wger.license],
        author: wger.author,
        modified: MODIFIED,
      } satisfies Attribution,
    };
  }
  return null;
}

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const { exercises } = await loadRawContent();

  let attribution: Record<string, Attribution> = {};
  if (await exists(ATTRIBUTION_FILE)) {
    attribution = JSON.parse(await readFile(ATTRIBUTION_FILE, "utf8"));
  }

  let downloaded = 0;
  const failures: string[] = [];

  for (const exercise of exercises) {
    const frames: string[] = exercise.media?.frames ?? [];
    for (const frame of frames) {
      const frameIndex = Number(path.basename(frame, ".webp"));
      const source = resolveSource(exercise.id, frameIndex);
      if (!source) {
        failures.push(`${frame}: không có nguồn trong FREE_EXERCISE_DB/WGER`);
        continue;
      }

      const outFile = path.join(MEDIA_DIR, frame);
      if (!force && (await exists(outFile))) {
        attribution[frame] = source.attribution;
        continue;
      }

      const res = await fetch(source.url);
      if (!res.ok) {
        failures.push(`${frame}: HTTP ${res.status} ${source.url}`);
        continue;
      }
      const input = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(outFile), { recursive: true });
      await sharp(input)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(outFile);

      attribution[frame] = source.attribution;
      downloaded++;
      console.log(`✓ ${frame}`);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(attribution).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(ATTRIBUTION_FILE, JSON.stringify(sorted, null, 2) + "\n");

  console.log(`\nĐã tải ${downloaded} ảnh. Ghi công: ${Object.keys(sorted).length} ảnh.`);
  if (failures.length) {
    console.error(`\n${failures.length} lỗi:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
}

main();
