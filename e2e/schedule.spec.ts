import { expect, test, type Page } from "@playwright/test";

async function onboard(page: Page) {
  await page.goto("/welcome");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Ghi các hiệp của bài hiện tại với cùng số lần `reps`, bỏ qua thời gian nghỉ giữa các hiệp. */
async function logSets(page: Page, sets: number, reps: number) {
  for (let i = 0; i < sets; i++) {
    const done = page.getByRole("button", { name: /^Xong — \d+ lần/ });
    const current = Number((await done.textContent())?.match(/(\d+) lần/)?.[1]);
    const step = reps > current ? "Thêm 1 lần" : "Bớt 1 lần";
    for (let k = 0; k < Math.abs(reps - current); k++) {
      await page.getByRole("button", { name: step }).click();
    }
    await expect(done).toHaveText(new RegExp(`Xong — ${reps} lần`));
    await done.click();
    await expect(page.getByRole("heading", { name: "Nghỉ" })).toBeVisible();
    if (i < sets - 1) await page.getByRole("button", { name: "Bỏ qua nghỉ" }).click();
  }
}

async function finishSession(page: Page) {
  if (await page.getByRole("button", { name: "Bỏ qua nghỉ" }).isVisible()) {
    await page.getByRole("button", { name: "Bỏ qua nghỉ" }).click();
  }
  await page.getByRole("button", { name: "Kết thúc buổi" }).click();
  await page.getByRole("button", { name: "Kết thúc", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoàn thành buổi tập!" })).toBeVisible();
}

test("trang chủ: buổi tiếp theo theo hàng đợi, bắt đầu bằng một chạm", async ({ page }) => {
  await onboard(page);
  const today = page.getByRole("region", { name: "Buổi A — Toàn thân A" });
  await expect(today).toBeVisible();
  await expect(today.getByText("Tuần 1/4 · 0/12 buổi")).toBeVisible();

  await today.getByRole("button", { name: "Bắt đầu buổi A" }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toHaveCount(0);

  await logSets(page, 1, 8);
  await finishSession(page);
  await page.getByRole("link", { name: "Về trang chủ" }).click();

  const next = page.getByRole("region", { name: "Buổi B — Toàn thân B" });
  await expect(next.getByText("Tuần 1/4 · 1/12 buổi")).toBeVisible();
  await expect(next.getByText(/Bạn đã tập hôm nay/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
});

test("đạt tối đa 2 buổi liên tiếp → đề xuất lên bậc, chấp nhận thì buổi sau đổi bài", async ({
  page,
}) => {
  await onboard(page);

  for (let session = 1; session <= 2; session++) {
    await page.goto("/program/phase/foundation");
    await page.getByRole("button", { name: "Bắt đầu buổi A" }).click();
    await expect(page.getByRole("heading", { name: "Chống đẩy vào tường" })).toBeVisible();
    await logSets(page, 3, 12);
    await finishSession(page);
    if (session === 1) {
      await expect(page.getByText("Gợi ý cho buổi sau")).toHaveCount(0);
      await page.getByRole("link", { name: "Về trang chủ" }).click();
    }
  }

  const suggestion = page.getByRole("article").filter({ hasText: "Sẵn sàng thử" });
  await expect(suggestion).toContainText("Chống đẩy nghiêng (tay trên ghế/bàn)");
  await expect(suggestion).toContainText("Bạn đã đạt 3×12 trong 2 buổi liên tiếp.");
  await suggestion.getByRole("button", { name: "Thử ở buổi sau" }).click();
  await expect(suggestion).toHaveCount(0);

  await page.getByRole("link", { name: "Về trang chủ" }).click();
  await page.goto("/program/phase/foundation");
  await expect(
    page.getByRole("link", { name: "Chống đẩy nghiêng (tay trên ghế/bàn)" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Chống đẩy vào tường" })).toHaveCount(0);
});

test("lịch sử: xem, sửa hiệp, xóa rồi hoàn tác", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: "Bắt đầu buổi A" }).click();
  await logSets(page, 2, 9);
  await finishSession(page);

  await page.goto("/history");
  const item = page.getByRole("button", { name: /Buổi A — Toàn thân A/ });
  await expect(item).toContainText("2 hiệp");
  await item.click();

  const firstSet = page.getByRole("spinbutton", { name: "Chống đẩy vào tường hiệp 1 (lần)" });
  await expect(firstSet).toHaveValue("9");
  await firstSet.fill("11");
  await firstSet.blur();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Buổi A — Toàn thân A/ }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Chống đẩy vào tường hiệp 1 (lần)" }),
  ).toHaveValue("11");

  await page.getByRole("button", { name: "Xóa buổi này" }).click();
  await expect(page.getByRole("status")).toContainText("Đã xóa Buổi A — Toàn thân A");
  await expect(page.getByText("Chưa có buổi tập nào.")).toBeVisible();

  await page.getByRole("button", { name: "Hoàn tác" }).click();
  await expect(page.getByRole("button", { name: /Buổi A — Toàn thân A/ })).toBeVisible();
});
