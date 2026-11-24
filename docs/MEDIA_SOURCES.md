# Nguồn media minh họa — kết quả xác minh (Sprint 0, S0-5)

Ngày kiểm tra: 22/11/2026. Kiểm tra trực tiếp qua GitHub API và wger REST API.

> Đây là đánh giá kỹ thuật về giấy phép, không phải tư vấn pháp lý.

## Quyết định hiện hành (22/11/2026, sau Sprint 1)

**Toàn bộ ảnh bên thứ ba đã được gỡ.** Ảnh free-exercise-db có dấu hiệu là ảnh thương mại (xem mục 1) và một số ảnh wger cũng không rõ nguồn gốc, nên ứng dụng dùng **hình người que SVG tự sinh** cho cả 44 bài:

- Tư thế khai báo trong `scripts/illustrations/poses.ts`, dựng hình bằng `scripts/illustrations/skeleton.ts` (IK 2 đoạn để tay chân chạm đúng sàn/xà/ghế).
- Sinh lại bằng `npm run generate:illustrations` — cập nhật `media.frames` và `src/content/media-attribution.json`.
- Phát hành theo giấy phép MIT cùng toàn bộ repo (xem `LICENSE`); không phụ thuộc giấy phép bên ngoài; mỗi file ~4 KB; tự đổi màu theo chế độ sáng/tối của hệ điều hành.

Các mục bên dưới giữ lại làm hồ sơ kiểm tra, phòng khi sau này muốn bổ sung ảnh chụp thật.

## Tóm tắt

| Nguồn                                                   | Giấy phép                                                                | Dùng được?          | Ghi chú                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------- |
| **free-exercise-db** (yuhonas)                          | Unlicense (public domain) — xác nhận qua GitHub API                      | ✅ Nguồn chính      | Repo không ghi nguồn gốc gốc của ảnh → rủi ro trung bình (xem dưới) |
| **wger.de**                                             | Theo từng ảnh: CC-BY-SA 4 (301), CC-BY-SA 3 (88), CC0 (6) / tổng 395 ảnh | ✅ Nguồn phụ        | Bắt buộc ghi công; ảnh đã chỉnh sửa phải giữ CC-BY-SA; bỏ ảnh AI    |
| **Wikimedia Commons**                                   | Theo từng file                                                           | ✅ Bổ sung từng bài | Kiểm tra license từng file khi dùng                                 |
| **SVG tự vẽ**                                           | Của dự án                                                                | ✅ Dự phòng         | Cho bài không có ảnh hợp lệ                                         |
| ExerciseDB / RapidAPI, iStock, ảnh từ trang review/blog | Thương mại / không rõ                                                    | ❌ Không dùng       | Bao gồm các link đang có trong `workout-data.tsx`                   |

## 1. free-exercise-db

- Repo: https://github.com/yuhonas/free-exercise-db — `LICENSE.md`, SPDX `Unlicense`.
- Dẫn xuất từ https://github.com/wrkout/exercises.json, cũng `Unlicense`, mô tả là "Open Public Domain Exercise Dataset".
- 876 bài; mỗi bài có 2 ảnh JPG (tư thế đầu / cuối) → hiển thị luân phiên thành ảnh động.
- Liên quan phạm vi MVP: `body only` 111 bài, `bands` 20 bài, các bài xà đơn (Pullups, Chin-Up, Hanging Leg Raise, Hanging Pike…).
- Có sẵn: Pushups, Incline Push-Up, Push-Ups With Feet Elevated, Close Triceps Push-Up, Single-Arm Push-Up, Bodyweight Squat, Butt Lift (Bridge), Single Leg Glute Bridge, Plank, Side Bridge, Bench Dips, Handstand Push-Ups, Pullups, Chin-Up, Hanging Leg Raise…

**Rủi ro:** Hai repo đều tuyên bố public domain nhưng không ghi ai là tác giả gốc của ảnh. Nếu ảnh được lấy từ nơi khác thì tuyên bố Unlicense không có hiệu lực với ảnh đó.

**Quan sát khi tải về (Sprint 1):** các ảnh là ảnh chụp chuyên nghiệp trong cùng một phòng gym (tường đỏ, giá tạ), phong cách giống thư viện bài tập của một trang thể hình thương mại. Đây là dấu hiệu ảnh có thể không thực sự thuộc public domain → **rủi ro nâng lên mức cao**. Khuyến nghị: dùng tạm cho MVP cá nhân/thử nghiệm; trước khi phát hành công khai rộng rãi, thay dần bằng ảnh wger/Wikimedia/SVG tự vẽ.

Ảnh wger của Bulgarian split squat là hình minh họa có cầm tạ đơn và nhãn cơ tiếng Tây Ban Nha; ảnh pistol squat có cầm đĩa tạ làm đối trọng — chấp nhận được nhưng nên thay khi có ảnh bodyweight tốt hơn.
**Cách giảm thiểu:** ghi nguồn đầy đủ trong `src/content/media-attribution.json`, mỗi ảnh có `id` để thay thế độc lập; nếu có khiếu nại thì gỡ và thay ảnh wger/SVG.

## 2. wger.de

- API: `GET https://wger.de/api/v2/exerciseimage/` trả về `license`, `license_author`, `is_ai_generated` cho từng ảnh.
- 395 ảnh: CC-BY-SA 4.0 = 301, CC-BY-SA 3.0 = 88, CC0 = 6.
- 104 ảnh để trống `license_author` → ghi công "wger.de contributors" kèm link bài tập.
- 46 ảnh `is_ai_generated: true` → **không dùng** (độ chính xác kỹ thuật động tác không đảm bảo).
- Độ phủ ảnh thấp: bodyweight 85/295 bài có ảnh, xà đơn 5/31, dây kháng lực 6/21.

**Nghĩa vụ CC-BY-SA:** ghi tác giả + tên giấy phép + link giấy phép + ghi rõ "đã chuyển định dạng/resize". Ảnh WebP sau khi chỉnh phải phát hành cùng giấy phép CC-BY-SA. Điều này **không** ảnh hưởng giấy phép code của app (ảnh là tác phẩm riêng, chỉ được hiển thị trong app).

## 3. Wikimedia Commons

Dùng cho bài còn thiếu (VD: dead hang, hollow body). Mỗi file ghi giấy phép riêng trên trang file; chỉ nhận CC0, CC-BY, CC-BY-SA, public domain.

## 4. Thiếu ảnh dự kiến (cần kiểm tra ở Sprint 1)

Towel row, inverted row dưới bàn, scapular pull, band-assisted pull-up, negative pull-up, dead hang, hollow body, dead bug, Pallof press, shrimp squat, wall walk, band pull-apart. Bài nào không tìm được ảnh hợp lệ thì vẽ SVG.

## 5. Định dạng ghi công (`src/content/media-attribution.json`)

```json
{
  "push-up/0.webp": {
    "source": "free-exercise-db",
    "sourceUrl": "https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Pushups",
    "license": "Unlicense",
    "licenseUrl": "https://unlicense.org/",
    "author": null,
    "modified": "Chuyển sang WebP, resize 600px"
  }
}
```

Các trường `source`, `license`, `licenseUrl`, `modified` là bắt buộc; `author` bắt buộc với CC-BY/CC-BY-SA. Script `validate-content.ts` (Sprint 1) sẽ fail build nếu thiếu.
