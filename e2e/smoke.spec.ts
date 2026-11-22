import { expect, test } from "@playwright/test";

test("trang chủ hiển thị và chọn được giai đoạn", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Workout");

  await page.getByRole("combobox").selectOption("1");
  await expect(page).toHaveURL(/\/phase\/1$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Giai Đoạn 1");
});

test("giai đoạn không tồn tại trả về 404", async ({ page }) => {
  const response = await page.goto("/phase/999");
  expect(response?.status()).toBe(404);
});
