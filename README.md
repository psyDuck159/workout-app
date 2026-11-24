# workout-app

Ứng dụng web (PWA) hướng dẫn tập **bodyweight tại nhà theo giai đoạn**, tiếng Việt, không quảng cáo. Tập được không cần dụng cụ, hoặc với xà đơn và dây kháng lực.

> Dự án học tập. Nội dung bài tập tham khảo từ nguồn công khai, chưa được chuyên gia kiểm duyệt.

## Tính năng hiện có

- **Thư viện 44 bài tập**: các bước thực hiện, lỗi thường gặp, trường hợp không nên tập, nguồn tham khảo và hình minh họa động.
- **Tìm kiếm không dấu** ("chong day" → "Chống đẩy"), lọc theo nhóm cơ, dụng cụ, độ khó.
- **Chương trình 12 tuần**: 3 giai đoạn × 4 tuần, buổi A/B xen kẽ, tuần giảm tải; tự chọn bài theo dụng cụ.
- **8 thang biến thể** từ dễ đến khó (VD: chống đẩy tường → … → chống đẩy một tay).

Lộ trình tiếp theo (lưu dữ liệu, ghi log buổi tập, timer, tăng tiến tự động, offline): xem [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Bắt đầu

Yêu cầu Node.js 22.

```bash
npm install
npm run dev          # http://localhost:3000
```

## Lệnh thường dùng

| Lệnh                              | Mô tả                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                     | Chạy dev server                                                        |
| `npm run build`                   | Build production (tự chạy `validate:content` trước)                    |
| `npm run build:static`            | Build dạng static export ra `out/` — kiểm tra khả năng đóng gói mobile |
| `npm run validate:content`        | Kiểm tra schema và tham chiếu chéo của nội dung bài tập/chương trình   |
| `npm run generate:illustrations`  | Sinh lại hình SVG minh họa từ `scripts/illustrations/poses.ts`         |
| `npm test`                        | Unit test (Vitest)                                                     |
| `npm run test:e2e`                | E2E test (Playwright, giả lập Pixel 7 và iPhone 14)                    |
| `npm run lint` · `typecheck`      | ESLint · TypeScript                                                    |
| `npm run format` · `format:check` | Prettier                                                               |

Lần đầu chạy E2E cần cài trình duyệt: `npx playwright install chromium webkit`.

## Cấu trúc

```
src/
├─ app/            # Các trang (Next.js App Router)
├─ components/     # Component giao diện (+ ui/ từ shadcn)
├─ content/        # Nội dung tĩnh: schema Zod, bài tập, thang biến thể, chương trình
└─ domain/         # Logic thuần, có unit test: tìm kiếm, chọn bậc theo dụng cụ, định dạng
scripts/
├─ illustrations/  # Bộ dựng hình người que (IK) và tư thế từng bài
├─ generate-illustrations.ts
└─ validate-content.ts
public/media/exercises/   # Hình SVG đã sinh
e2e/                      # Playwright
docs/                     # SRS, kế hoạch triển khai, nguồn media
```

## Thêm hoặc sửa bài tập

1. Sửa file JSON trong `src/content/exercises/` (và `ladders.json` / `programs/` nếu cần).
2. Thêm tư thế cho bài mới trong `scripts/illustrations/poses.ts`, rồi chạy `npm run generate:illustrations`.
3. Chạy `npm run validate:content` và `npm test` — build sẽ thất bại nếu nội dung sai hoặc thiếu hình.

## Công nghệ

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zod · Vitest · Playwright.

## Tài liệu

- [Đặc tả yêu cầu (SRS)](docs/SRS.md) — khảo sát thị trường, pain point, yêu cầu chức năng/phi chức năng
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Nguồn media](docs/MEDIA_SOURCES.md)

## Giấy phép

[MIT](LICENSE) © 2026 Le Dac Anh — áp dụng cho toàn bộ repo, gồm code, nội dung bài tập và hình minh họa.
