import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function onboard(page: Page) {
  await page.goto("/welcome");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function finishWithOneSet(page: Page) {
  await page.getByRole("button", { name: /^Xong — \d+ lần/ }).click();
  await page.getByRole("button", { name: "Bỏ qua nghỉ" }).click();
  await page.getByRole("button", { name: "Kết thúc buổi" }).click();
  await page.getByRole("button", { name: "Kết thúc", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoàn thành buổi tập!" })).toBeVisible();
}

test.describe("offline", () => {
  // Service worker trong Playwright chỉ ổn định trên Chromium.
  test.skip(({ browserName }) => browserName !== "chromium", "Chỉ Chromium");

  test("mất mạng vẫn mở app, tập, ghi log và xem lịch sử", async ({ page, context }) => {
    await onboard(page);
    // Chờ service worker cài xong (đã lưu sẵn trang và tài nguyên).
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

    await context.setOffline(true);

    await page.goto("/");
    const today = page.getByRole("region", { name: "Buổi A — Toàn thân A" });
    await expect(today).toBeVisible();
    await today.getByRole("button", { name: "Bắt đầu buổi A" }).click();
    await expect(page.getByRole("heading", { name: "Chống đẩy vào tường" })).toBeVisible();
    await finishWithOneSet(page);

    await page.goto("/history");
    await expect(page.getByRole("button", { name: /Buổi A — Toàn thân A/ })).toBeVisible();

    await page.goto("/exercises/push-up");
    const image = page.getByAltText("Minh họa Chống đẩy");
    await expect(image).toBeVisible();
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });
});

test("xuất sao lưu, xóa toàn bộ, nhập lại khôi phục được lịch sử", async ({ page }, testInfo) => {
  await onboard(page);
  await page.getByRole("button", { name: "Bắt đầu buổi A" }).click();
  await finishWithOneSet(page);

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Xuất file sao lưu (JSON)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^workout-app-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath("backup.json");
  await download.saveAs(file);
  const backup = JSON.parse(await readFile(file, "utf8"));
  expect(backup.format).toBe("workout-app-backup");
  expect(backup.data.sessions).toHaveLength(1);

  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Xuất bảng tính (CSV)" }).click(),
  ]);
  const csvPath = testInfo.outputPath("sets.csv");
  await csv.saveAs(csvPath);
  expect(await readFile(csvPath, "utf8")).toContain("Chống đẩy vào tường");

  // Xóa toàn bộ: hai bước xác nhận.
  await page.getByRole("button", { name: "Xóa toàn bộ dữ liệu" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  const confirm = page.getByRole("button", { name: "Xóa vĩnh viễn" });
  await expect(confirm).toBeDisabled();
  await page.getByRole("textbox").fill("xóa");
  await confirm.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Thiết lập lộ trình" })).toBeVisible();

  // Khôi phục trên "máy mới" chưa có hồ sơ.
  await page.goto("/settings");
  await page.getByLabel("Chọn file sao lưu").setInputFiles(file);
  await expect(page.getByRole("heading", { name: "Nhập dữ liệu?" })).toBeVisible();
  await expect(page.getByText("1 buổi tập mới")).toBeVisible();
  await expect(page.getByText("Hồ sơ: dùng hồ sơ trong file")).toBeVisible();
  await page.getByRole("button", { name: "Nhập", exact: true }).click();
  await expect(page.getByText("Đã nhập 1 buổi tập, 1 hiệp.")).toBeVisible();

  await page.goto("/history");
  await expect(page.getByRole("button", { name: /Buổi A — Toàn thân A/ })).toBeVisible();
});

test("trang giới thiệu có lưu ý sức khỏe, giấy phép và nguồn", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText("chưa được chuyên gia kiểm duyệt", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "MIT" })).toBeVisible();
  await expect(page.getByRole("link", { name: /NHS — Strength exercises/ })).toBeVisible();
});

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  const pages = [
    "/",
    "/program",
    "/program/phase/foundation",
    "/exercises",
    "/exercises/push-up",
    "/history",
    "/settings",
    "/about",
    "/welcome",
  ];

  test("không có lỗi nghiêm trọng trên các trang chính", async ({ page }) => {
    await onboard(page);
    const problems: string[] = [];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      for (const v of violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
        problems.push(`${url}: ${v.id} — ${v.help} (${v.nodes.map((n) => n.target).join(", ")})`);
      }
    }

    // Màn hình đang tập.
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu buổi A" }).click();
    await expect(page.getByRole("heading", { name: "Chống đẩy vào tường" })).toBeVisible();
    for (const step of ["workout", "rest"]) {
      if (step === "rest") await page.getByRole("button", { name: /^Xong — \d+ lần/ }).click();
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      for (const v of violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
        problems.push(`/workout (${step}): ${v.id} — ${v.help}`);
      }
    }

    expect(problems).toEqual([]);
  });
});
