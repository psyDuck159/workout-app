/**
 * Sinh icon PWA (PNG) từ hình người que tự vẽ. Chạy lại khi đổi thiết kế icon:
 *   npm run generate:icons
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { poses } from "./illustrations/poses";
import { renderPose } from "./illustrations/skeleton";

const OUT = path.resolve(__dirname, "../public/icons");
const BG = "#18181b";
const FG = "#fafafa";

/** Icon vuông: nền tối, hình chống đẩy màu sáng. `padding` = tỉ lệ lề (icon maskable cần ≥ 10%). */
function iconSvg(size: number, padding: number, rounded: boolean): string {
  const figure = renderPose(poses["push-up"][0], "Workout App")
    .replace(/<style>.*<\/style>/, "")
    .replace(/<title>.*<\/title>/, "")
    .replace(
      /class="fig far"/g,
      `stroke="${FG}" stroke-opacity="0.45" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`,
    )
    .replace(
      /class="fig"/g,
      `stroke="${FG}" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`,
    )
    .replace(/class="head"/g, `fill="${FG}"`)
    .replace(/class="floor"/g, `stroke="${FG}" stroke-opacity="0.5" stroke-width="3"`);
  const inner = size * (1 - padding * 2);
  const radius = rounded ? size * 0.22 : 0;
  // Cắt vùng có hình (khung gốc 200×150) theo tỉ lệ 3:2 rồi căn giữa trong ô vuông.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
<svg x="${size * padding}" y="${size * padding + inner / 6}" width="${inner}" height="${(inner * 2) / 3}" viewBox="12 52 156 104">${figure.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</svg>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, padding: 0.06, rounded: true },
  { file: "icon-512.png", size: 512, padding: 0.06, rounded: true },
  { file: "icon-maskable-512.png", size: 512, padding: 0.16, rounded: false },
  { file: "apple-touch-icon.png", size: 180, padding: 0.1, rounded: false },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "icon.svg"), iconSvg(512, 0.06, true));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const t of targets) {
    await page.setViewportSize({ width: t.size, height: t.size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${iconSvg(t.size, t.padding, t.rounded)}</body></html>`,
    );
    await page.screenshot({ path: path.join(OUT, t.file), omitBackground: true });
    console.log(`✓ ${t.file}`);
  }
  await browser.close();
}

main();
