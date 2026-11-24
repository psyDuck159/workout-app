import { expect, test, type Page } from "@playwright/test";

/** Onboarding bỏ qua hết (không dụng cụ) rồi mở trang giai đoạn 1. */
async function setUp(page: Page) {
  await page.goto("/welcome");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/program/phase/foundation");
}

async function startSession(page: Page, id: "A" | "B") {
  await page.getByRole("button", { name: `Bắt đầu buổi ${id}` }).click();
  await expect(page).toHaveURL(/\/workout$/);
}

const position = (page: Page) => page.getByText(/^Bài \d+\/\d+ · Hiệp \d+\/\d+$/);

test("ghi 3 hiệp → tải lại → tiếp tục đúng vị trí → hoàn thành", async ({ page }) => {
  await setUp(page);
  await startSession(page, "A");

  await expect(page.getByRole("heading", { name: "Chống đẩy vào tường" })).toBeVisible();
  await expect(position(page)).toHaveText("Bài 1/4 · Hiệp 1/3");

  for (let set = 1; set <= 3; set++) {
    if (set === 2) await page.getByRole("button", { name: "Thêm 1 lần" }).click();
    await page.getByRole("button", { name: /^Xong — \d+ lần$/ }).click();
    await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();
    if (set < 3) {
      await page.getByRole("button", { name: "Bỏ qua nghỉ" }).click();
      await expect(position(page)).toHaveText(`Bài 1/4 · Hiệp ${set + 1}/3`);
    }
  }
  await expect(page.getByText("Chống đẩy vào tường thế nào?")).toBeVisible();
  await page.getByRole("button", { name: "Vừa" }).click();
  // Giao diện đọc từ IndexedDB nên nút chỉ được bật khi đánh giá đã lưu xong.
  await expect(page.getByRole("button", { name: "Vừa" })).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();
  await expect(page.getByText("Tiếp theo: Kéo khăn ở cửa · Hiệp 1/3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vừa" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Bỏ qua nghỉ" }).click();
  await expect(position(page)).toHaveText("Bài 2/4 · Hiệp 1/3");
  await expect(page.getByRole("heading", { name: "Kéo khăn ở cửa" })).toBeVisible();

  await page.getByRole("button", { name: "Kết thúc buổi" }).click();
  await page.getByRole("button", { name: "Kết thúc", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Hoàn thành buổi tập!" })).toBeVisible();
  await expect(page.getByText("8 · 9 · 8")).toBeVisible();

  await page.getByRole("link", { name: "Về trang chủ" }).click();
  await expect(page.getByRole("heading", { name: "Kế hoạch của bạn" })).toBeVisible();
  await expect(page.getByText("Bạn đang tập dở")).toHaveCount(0);
});

test("timer nghỉ đúng theo đồng hồ, kể cả khi tab bị bỏ đi 2 phút", async ({ page }) => {
  await page.clock.install();
  await setUp(page);
  await startSession(page, "A");

  await page.getByRole("button", { name: /^Xong — \d+ lần$/ }).click();
  const timer = page.getByRole("timer", { name: "Thời gian nghỉ còn lại" });
  await expect(timer).toHaveText("1:30");

  await page.clock.fastForward("00:30");
  await expect(timer).toHaveText(/^(0:59|1:00|1:01)$/);

  await page.getByRole("button", { name: "+15 giây" }).click();
  await expect(timer).toHaveText(/^(1:14|1:15|1:16)$/);

  // Mô phỏng người dùng chuyển sang app khác 2 phút: hết giờ nghỉ thì tự sang hiệp kế.
  await page.clock.fastForward("02:00");
  await expect(position(page)).toHaveText("Bài 1/4 · Hiệp 2/3");
});

test("bài giữ theo thời gian: đếm ngược 3-2-1 rồi ghi số giây đã giữ", async ({ page }) => {
  await page.clock.install();
  await setUp(page);
  await startSession(page, "B");

  // Buổi B không dụng cụ: pike, kéo khăn, glute bridge, plank nghiêng, superman.
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Bỏ qua bài" }).click();
  await expect(page.getByRole("heading", { name: "Plank nghiêng" })).toBeVisible();

  await page.getByRole("button", { name: "Bắt đầu giữ" }).click();
  // Đồng hồ giả vẫn chạy theo thời gian thật, máy chậm có thể đã đếm qua số 3.
  await expect(page.getByText(/^[123]$/)).toBeVisible();
  await page.clock.fastForward("00:03");
  const done = page.getByRole("button", { name: /^Xong — \d+ giây$/ });
  await expect(done).toBeVisible();
  await page.clock.fastForward("00:22");
  await expect(done).toHaveText(/Xong — 2[1-6] giây/);
  await expect(page.getByText("Đã đạt mức tối thiểu")).toBeVisible();
  await done.click();

  await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();
});

test("báo đau dừng bài, hiện lời khuyên và ghi nhận trong tóm tắt", async ({ page }) => {
  await setUp(page);
  await startSession(page, "A");

  await page.getByRole("button", { name: "Đau / khó chịu" }).click();
  await page.getByRole("button", { name: "Dừng bài này" }).click();
  await expect(page.getByRole("heading", { name: "Đã dừng bài" })).toBeVisible();
  await page.getByRole("button", { name: "Đã hiểu" }).click();
  await expect(position(page)).toHaveText("Bài 2/4 · Hiệp 1/3");

  await page.getByRole("button", { name: "Kết thúc buổi" }).click();
  await page.getByRole("button", { name: "Kết thúc", exact: true }).click();
  await expect(page.getByText("Báo đau")).toBeVisible();
});

test("trang chủ nhắc tiếp tục buổi tập dở; bỏ buổi thì hết nhắc", async ({ page }) => {
  await setUp(page);
  await startSession(page, "A");
  await page.getByRole("button", { name: /^Xong — \d+ lần$/ }).click();
  await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Bạn đang tập dở")).toBeVisible();
  await expect(page.getByText("Buổi A — Toàn thân A · đã xong 1/")).toBeVisible();
  await page.getByRole("link", { name: "Tiếp tục", exact: true }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Bỏ buổi này" }).click();
  await page.getByRole("button", { name: "Bỏ buổi", exact: true }).click();
  await expect(page.getByText("Bạn đang tập dở")).toHaveCount(0);

  await page.goto("/program/phase/foundation");
  await expect(page.getByRole("button", { name: "Bắt đầu buổi A" })).toBeVisible();
});
