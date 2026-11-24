/**
 * Sinh public/sw.js trước mỗi lần build (prebuild) từ scripts/sw-template.js:
 * điền danh sách trang cần lưu sẵn, toàn bộ hình minh họa và mã phiên bản.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadRawContent } from "./load-raw-content";

const ROOT = path.resolve(__dirname, "..");

async function listFiles(dir: string, prefix: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory()
        ? listFiles(path.join(dir, e.name), `${prefix}/${e.name}`)
        : [`${prefix}/${e.name}`],
    ),
  );
  return nested.flat().sort();
}

async function main() {
  const { exercises, programs } = await loadRawContent();
  const pages = [
    "/",
    "/program",
    "/exercises",
    "/history",
    "/settings",
    "/workout",
    "/welcome",
    "/about",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dữ liệu thô
    ...(programs as any[]).flatMap((p) =>
      p.phases.map((ph: { id: string }) => `/program/phase/${ph.id}`),
    ),
    ...exercises.map((e: { id: string }) => `/exercises/${e.id}`),
  ];
  const assets = [
    "/manifest.webmanifest",
    ...(await listFiles(path.join(ROOT, "public/icons"), "/icons")),
    ...(await listFiles(path.join(ROOT, "public/media"), "/media")),
  ];
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? new Date().toISOString().replace(/\D/g, "");

  const template = await readFile(path.join(__dirname, "sw-template.js"), "utf8");
  const sw = template
    .replace("__VERSION__", version)
    .replace("__PAGES__", JSON.stringify(pages))
    .replace("__ASSETS__", JSON.stringify(assets));
  await writeFile(path.join(ROOT, "public/sw.js"), sw);
  console.log(`sw.js ${version}: ${pages.length} trang, ${assets.length} tệp tĩnh.`);
}

main();
