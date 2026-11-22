import { expect, test } from "@playwright/test";

test("trang chủ dẫn tới giai đoạn 1, chọn dụng cụ đổi bài tập", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tập bodyweight tại nhà");

  await page.getByRole("link", { name: "Xem giai đoạn 1" }).click();
  await expect(page).toHaveURL(/\/program\/phase\/foundation$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Giai đoạn 1");

  // Không có dụng cụ: thang kéo bắt đầu bằng kéo khăn, chưa có bài treo xà.
  await expect(page.getByRole("link", { name: "Kéo khăn ở cửa" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Treo xà" })).toHaveCount(0);

  await page.getByLabel("Xà đơn").check();
  await expect(page.getByRole("link", { name: "Treo xà" })).toBeVisible();
});

test("thư viện tìm không dấu và mở chi tiết bài tập", async ({ page }) => {
  await page.goto("/exercises");
  await page.getByRole("searchbox", { name: "Tìm bài tập" }).fill("chong day tay hep");

  const result = page.getByRole("link", { name: /Chống đẩy tay hẹp/ });
  await expect(result).toHaveCount(1);
  await result.click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chống đẩy tay hẹp (kim cương)");
  await expect(page.getByRole("heading", { name: "Cách thực hiện" })).toBeVisible();
  await expect(page.getByAltText("Minh họa Chống đẩy tay hẹp (kim cương)")).toBeVisible();
  await expect(page.getByText("Unlicense")).toBeVisible();
});

test("trang không tồn tại trả về 404", async ({ page }) => {
  expect((await page.goto("/exercises/khong-co"))?.status()).toBe(404);
  expect((await page.goto("/phase/1"))?.status()).toBe(404);
});
