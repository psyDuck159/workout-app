import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve(__dirname, "../src/content");

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

/** Đọc nội dung thô (chưa validate) từ src/content để các script dùng chung. */
export async function loadRawContent() {
  const exerciseFiles = (await readdir(path.join(CONTENT_DIR, "exercises"))).filter((f) =>
    f.endsWith(".json"),
  );
  const programFiles = (await readdir(path.join(CONTENT_DIR, "programs"))).filter((f) =>
    f.endsWith(".json"),
  );

  const exerciseLists = await Promise.all(
    exerciseFiles.map((f) => readJson(path.join(CONTENT_DIR, "exercises", f))),
  );

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu thô, validate sau
    exercises: (exerciseLists as any[][]).flat(),
    ladders: await readJson(path.join(CONTENT_DIR, "ladders.json")),
    programs: await Promise.all(
      programFiles.map((f) => readJson(path.join(CONTENT_DIR, "programs", f))),
    ),
    attributionFile: path.join(CONTENT_DIR, "media-attribution.json"),
  };
}
