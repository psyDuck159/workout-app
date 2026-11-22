/**
 * Chạy trước mỗi lần build (prebuild). Thoát mã 1 nếu nội dung có lỗi.
 *   npm run validate:content
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadRawContent } from "./load-raw-content";
import { validateContent } from "../src/content/validate";

const MEDIA_DIR = path.resolve(__dirname, "../public/media/exercises");

async function main() {
  const raw = await loadRawContent();
  const attribution = existsSync(raw.attributionFile)
    ? JSON.parse(readFileSync(raw.attributionFile, "utf8"))
    : {};

  const { errors, warnings } = validateContent(
    { exercises: raw.exercises, ladders: raw.ladders, programs: raw.programs, attribution },
    (frame) => existsSync(path.join(MEDIA_DIR, frame)),
  );

  const withMedia = raw.exercises.filter((e) => e.media).length;
  console.log(
    `Nội dung: ${raw.exercises.length} bài tập (${withMedia} có ảnh), ` +
      `${(raw.ladders as unknown[]).length} thang, ${raw.programs.length} chương trình.`,
  );

  if (warnings.length) console.warn(`\n⚠ ${warnings.length} cảnh báo:\n- ${warnings.join("\n- ")}`);
  if (errors.length) {
    console.error(`\n✗ ${errors.length} lỗi:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\n✓ Nội dung hợp lệ.");
}

main();
