import { expect, test } from "@playwright/test";

test("onboarding lưu hồ sơ, tải lại vẫn còn, chương trình chọn bài theo dụng cụ", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Thiết lập lộ trình" }).click();
  await expect(page).toHaveURL(/\/welcome$/);

  // Bước 1: mục tiêu
  await page.getByText("Kỹ năng calisthenics").click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Bước 2: lịch tập
  await page.getByRole("radio", { name: "4", exact: true }).check({ force: true });
  await page.getByText("45 phút").click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Bước 3: dụng cụ
  await page.getByRole("checkbox", { name: /Xà đơn/ }).check();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Bước 4: sức khỏe + lưu ý
  await expect(page.getByText("Bước 4/4")).toBeVisible();
  await page.getByText("Không có ý nào").click();
  await page.getByRole("button", { name: "Bắt đầu tập" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Kế hoạch của bạn" })).toBeVisible();
  await expect(page.getByText("Kỹ năng calisthenics")).toBeVisible();
  await expect(page.getByText("4 buổi/tuần · 45 phút")).toBeVisible();

  await page.reload();
  await expect(page.getByText("4 buổi/tuần · 45 phút")).toBeVisible();

  await expect(page.getByText("Buổi tiếp theo")).toBeVisible();
  await page.goto("/program/phase/foundation");
  await expect(page.getByRole("link", { name: "Treo xà" })).toBeVisible();
});

test("bỏ qua mọi bước dùng giá trị mặc định; đổi dụng cụ trong Cài đặt đổi bài tập", async ({
  page,
}) => {
  await page.goto("/welcome");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Bỏ qua" }).click();
  }
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("3 buổi/tuần · 30 phút")).toBeVisible();
  await expect(page.getByText("Không dụng cụ")).toBeVisible();

  await page.goto("/program/phase/foundation");
  await expect(page.getByRole("link", { name: "Treo xà" })).toHaveCount(0);

  await page.getByRole("link", { name: "Cài đặt", exact: true }).click();
  await page.getByRole("checkbox", { name: /Xà đơn/ }).check();
  await expect(page.getByRole("status")).toHaveText("Đã lưu.");

  await page.goto("/program/phase/foundation");
  await expect(page.getByRole("link", { name: "Treo xà" })).toBeVisible();
  await expect(page.getByText("Dụng cụ: Xà đơn")).toBeVisible();
});

test("vào lại trang thiết lập khi đã có hồ sơ thì không tạo lại", async ({ page }) => {
  await page.goto("/welcome");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Bỏ qua" }).click();
  }
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/welcome");
  await expect(page.getByText("Bạn đã thiết lập hồ sơ trên thiết bị này.")).toBeVisible();
});
