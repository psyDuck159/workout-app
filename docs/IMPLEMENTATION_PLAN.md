# Kế hoạch triển khai — workout-app

| Mục                | Giá trị                                        |
| ------------------ | ---------------------------------------------- |
| Phiên bản          | 1.0                                            |
| Ngày               | 22/11/2026                                     |
| Căn cứ             | `docs/SRS.md` v1.0 + các quyết định ở mục 11.2 |
| Nguồn lực giả định | 1 dev full-stack, sprint 1 tuần                |

---

## 1. Các quyết định đã chốt & tác động

| #   | Quyết định                                                 | Tác động lên thiết kế / SRS                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | MVP gồm **không dụng cụ + xà đơn + dây kháng lực**         | Mỗi thang biến thể phải có nhánh theo dụng cụ (VD thang kéo: towel row/inverted row dưới bàn → band-assisted pull-up → negative pull-up → pull-up). `SetLog` cần thêm trường `assistance` (mức dây kháng lực). FR-PRG-07 (tự đổi bài theo dụng cụ) và FR-EXL-07 nâng lên **Must**.                                      |
| Q2  | **Miễn phí** hiện tại                                      | Bỏ toàn bộ nhóm FR-MON-02/03 khỏi phạm vi (Won't). Kiến trúc phải **không có chi phí server**: client-side, lưu cục bộ, hosting tĩnh. Không cần backend trong MVP.                                                                                                                                                      |
| Q3  | **Không có chuyên gia review**, chỉ tham khảo nguồn public | NFR-CNT-01 đổi thành: mỗi bài phải có `sources[]` (nguồn công khai uy tín) và hiển thị trong app. Tăng an toàn bằng thiết kế: ngưỡng lên bậc thận trọng (RPE ≤ 7), nút **"Đau / khó chịu"** trong buổi tập → dừng bài và gợi ý hạ bậc, miễn trừ trách nhiệm rõ ràng, onboarding mặc định bậc dễ.                        |
| Q4  | Hướng **mobile app**, MVP làm **PWA** trước                | Code phải sẵn sàng đóng gói bằng **Capacitor** sau này: tương thích `output: "export"` (static), không dùng Server Actions/Route Handlers/`next/image` optimizer cho dữ liệu runtime, ID runtime truyền qua query string thay vì dynamic segment, API trình duyệt bọc trong lớp `platform/` để thay bằng plugin native. |
| Q5  | **Media thư viện mở**                                      | Cần bước xác minh giấy phép từng nguồn trước khi dùng; pipeline tải về, tối ưu WebP, lưu file `attribution` cho từng ảnh; trang "Nguồn & giấy phép" trong app. Không hotlink.                                                                                                                                           |

**Ứng viên nguồn media / dữ liệu (cần xác minh giấy phép ở Sprint 0 — chưa xác nhận):**

- `free-exercise-db` (GitHub: yuhonas) — dữ liệu + ảnh JPG 2 khung (đầu/cuối động tác), có thể ghép thành ảnh động.
- wger.de — thư viện bài tập mở, có ảnh do cộng đồng đóng góp (giấy phép theo từng ảnh).
- Wikimedia Commons — ảnh/GIF/SVG giải phẫu với giấy phép ghi trên từng file.
- Phương án dự phòng: tự vẽ minh họa SVG tối giản (người que) cho các bài thiếu ảnh hợp lệ.
- **Không dùng:** ExerciseDB/RapidAPI GIF, iStock, ảnh từ trang review (giấy phép không cho phép).

Nguồn tham khảo kỹ thuật động tác (dùng cho `sources[]`, viết lại bằng lời của mình, không chép nguyên văn): thư viện bài tập của ACE, NHS Fitness Studio, wiki r/bodyweightfitness (Recommended Routine & progressions).

---

## 2. Kiến trúc & công nghệ

### 2.1 Stack

| Lớp               | Lựa chọn                                                                               | Lý do                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework         | Next.js 15 App Router (giữ nguyên)                                                     | Đã có; static export được cho Capacitor                                                                                     |
| UI                | Tailwind 4 + shadcn/ui (giữ nguyên)                                                    | Đã có                                                                                                                       |
| Validate nội dung | **Zod**                                                                                | Schema = type TS + kiểm tra khi build (FR-ADM-01/02)                                                                        |
| Lưu trữ           | **Dexie.js** (IndexedDB) + `dexie-react-hooks`                                         | Migration theo version, `useLiveQuery` cho UI tự cập nhật                                                                   |
| PWA               | `app/manifest.ts` + service worker tự viết (theo hướng dẫn PWA chính thức của Next.js) | Ít phụ thuộc; kiểm soát cache media. Nếu cần precache tự động thì đánh giá Serwist (kiểm tra tương thích Turbopack lúc làm) |
| Unit test         | **Vitest**                                                                             | Nhanh, dùng cho domain thuần                                                                                                |
| E2E               | **Playwright** (profile mobile)                                                        | Kiểm thử reload giữa buổi, offline                                                                                          |
| Biểu đồ (v1)      | Recharts                                                                               |                                                                                                                             |
| Tối ưu media      | `sharp` trong script Node                                                              | Chuyển WebP, resize                                                                                                         |
| CI                | GitHub Actions: lint + typecheck + test + build                                        |                                                                                                                             |
| Hosting           | Vercel (static)                                                                        | Free tier, không cần server                                                                                                 |

### 2.2 Phân lớp

```
src/
├─ app/                      # Routes (chỉ UI + ghép nối)
│  ├─ page.tsx               # Hôm nay
│  ├─ welcome/               # Onboarding
│  ├─ program/               # Chương trình, giai đoạn (generateStaticParams)
│  ├─ exercises/             # Thư viện (generateStaticParams)
│  ├─ workout/               # Player: /workout?session=<id>
│  ├─ history/
│  ├─ settings/
│  ├─ about/                 # Miễn trừ trách nhiệm, nguồn & giấy phép
│  └─ manifest.ts
├─ content/                  # Nội dung tĩnh (thay workout-data.tsx)
│  ├─ schema.ts              # Zod schema: Exercise, Ladder, Program…
│  ├─ exercises/*.json
│  ├─ ladders.json
│  ├─ programs/*.json
│  └─ index.ts               # load + validate + export typed
├─ domain/                   # Hàm thuần, không import React/Dexie
│  ├─ progression.ts         # Engine tăng tiến (FR-PRO)
│  ├─ schedule.ts            # Hàng đợi buổi tập (FR-SCH-02)
│  ├─ session.ts             # State machine buổi tập
│  ├─ timer.ts               # Tính thời gian còn lại theo timestamp
│  ├─ streak.ts
│  ├─ search.ts              # Bỏ dấu tiếng Việt
│  └─ export.ts              # JSON/CSV serialize/parse
├─ data/                     # Lớp lưu trữ
│  ├─ db.ts                  # Dexie schema + migrations
│  └─ repositories/*.ts      # Interface + impl IndexedDB (sync v2 thay impl)
├─ platform/                 # Bọc API trình duyệt → thay bằng Capacitor sau
│  ├─ wakeLock.ts  haptics.ts  audio.ts  notifications.ts  files.ts  storage.ts
├─ components/               # UI thuần + ui/ (shadcn)
└─ lib/utils.ts
public/
├─ media/exercises/*.webp
├─ media/exercises/<id>/<n>.webp   (ghi công: src/content/media-attribution.json)
└─ sw.js
scripts/
├─ fetch-media.ts            # Tải + tối ưu + ghi attribution
└─ validate-content.ts       # Chạy trong prebuild
```

**Quy tắc phụ thuộc:** `app → components → domain`, `app → data → domain`; `domain` không phụ thuộc gì ngoài TS/Zod. Mục tiêu coverage domain ≥ 80% (NFR-MNT-01).

### 2.3 Quy tắc "sẵn sàng Capacitor" (áp dụng ngay từ MVP)

1. Không dùng Server Actions, Route Handlers, middleware, `cookies()`, ISR.
2. Route có dữ liệu runtime dùng query string (`/workout?session=…`); route nội dung dùng `generateStaticParams`.
3. `next/image` đặt `unoptimized` (hoặc dùng `<img>`), ảnh đã tối ưu sẵn bằng script.
4. Mọi API trình duyệt đi qua `src/platform/*`.
5. CI có job `next build` với `output: "export"` để phát hiện vi phạm sớm.

---

## 3. Lộ trình sprint — MVP (≈ 6 tuần)

Ký hiệu: **DoD** = Definition of Done. Mã FR/NFR tham chiếu SRS.

### Sprint 0 — Dọn nền (2–3 ngày)

| Việc | Chi tiết                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------- |
| S0-1 | Commit hiện trạng, tạo nhánh làm việc từ `main` (repo đang ở `master`, cần thống nhất nhánh chính) |
| S0-2 | Sửa `src/app/phase/[id]/page.tsx`: `params: Promise<{ id: string }>` + `await`                     |
| S0-3 | Bật TS `strict` (kiểm tra), thêm Vitest, Playwright, Prettier, script `typecheck`                  |
| S0-4 | GitHub Actions: lint → typecheck → test → build (+ build static export)                            |
| S0-5 | **Xác minh giấy phép media** các nguồn ở mục 1, ghi kết quả vào `docs/MEDIA_SOURCES.md`            |
| S0-6 | Dọn package thừa: `shadcn` và `shadcn-ui` là CLI, chuyển sang devDependencies hoặc gỡ              |

**DoD:** CI xanh; app chạy như cũ; có danh sách nguồn media hợp lệ.

### Sprint 1 — Nội dung & schema (1 tuần)

| Việc                                                                                                                        | FR                    |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| S1-1 Viết Zod schema theo SRS §6 (+ `sources[]`, `assistance`, `equipment` nhánh)                                           | FR-ADM-01, FR-PRG-03  |
| S1-2 Biên soạn **6 thang biến thể** (xem §5) ≈ 40 bài, mô tả tiếng Việt, lỗi thường gặp, chống chỉ định, nguồn              | FR-EXL-01, 03, 04     |
| S1-3 Chuyển 3 giai đoạn hiện có thành chương trình 12 tuần có cấu trúc, buổi A/B, tuần deload                               | FR-PRG-01, 02, 04     |
| S1-4 Script `fetch-media.ts`: tải, resize ≤ 600px, WebP ≤ 150KB/khung, ghi `media-attribution.json`                         | FR-EXL-02, NFR-CNT-03 |
| S1-5 Script `validate-content.ts` chạy ở `prebuild`: thiếu trường / media không tồn tại / thang tham chiếu sai → build fail | FR-ADM-02             |
| S1-6 Trang Thư viện bài tập + chi tiết bài (ảnh 2 khung luân phiên, nguồn, giấy phép); xóa `workout-data.tsx`               | FR-EXL-02             |
| S1-7 Tìm kiếm không dấu + lọc dụng cụ/nhóm cơ                                                                               | FR-EXL-05             |

**DoD:** Toàn bộ nội dung validate pass; không còn link minh họa ngoài; unit test cho `search.ts`.

### Sprint 2 — Lưu trữ & Onboarding (1 tuần)

| Việc                                                                                                                                                         | FR / NFR              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| S2-1 `db.ts` Dexie: `profile`, `ladderStates`, `sessions`, `sets`, `suggestions`, `meta(schemaVersion)`                                                      | NFR-REL-03            |
| S2-2 Repository interface + impl IndexedDB; test bằng `fake-indexeddb`                                                                                       | NFR-MNT-04            |
| S2-3 `platform/storage.ts`: `navigator.storage.persist()`, cảnh báo khi trình duyệt riêng tư/không hỗ trợ                                                    | FR-DAT-07             |
| S2-4 Onboarding ≤ 5 bước, bỏ qua được: mục tiêu, số buổi, thời lượng, **dụng cụ (không / xà đơn / dây kháng lực)**, sàng lọc sức khỏe + miễn trừ trách nhiệm | FR-ONB-01, 02, 04, 05 |
| S2-5 Gán bậc khởi đầu = bậc dễ nhất phù hợp dụng cụ (bài test trình độ để v1)                                                                                | FR-PRG-07             |
| S2-6 Trang Cài đặt cơ bản: sửa hồ sơ, âm thanh/rung/giữ màn hình                                                                                             | FR-ONB-06, FR-SET-02  |

**DoD:** Reload trang giữ nguyên hồ sơ; đổi dụng cụ → chương trình đổi bài tương ứng.

### Sprint 3 — Workout Player (1 tuần) — sprint quan trọng nhất

| Việc                                                                                                      | FR / NFR                   |
| --------------------------------------------------------------------------------------------------------- | -------------------------- |
| S3-1 `domain/session.ts`: state machine `idle → exercise → resting → … → summary`, hàm thuần, test đầy đủ | FR-WKP-01                  |
| S3-2 Ghi hiệp 1 chạm ("Xong ✓" điền sẵn mục tiêu), +/− lớn, trường dây kháng lực cho bài assisted         | FR-WKP-02, NFR-USE-02      |
| S3-3 `domain/timer.ts`: lưu `endsAt`, tính còn lại từ `Date.now()`; xử lý `visibilitychange`              | FR-WKP-04, 05, NFR-PERF-05 |
| S3-4 Bài loại `time`: đếm ngược 3-2-1, âm báo                                                             | FR-WKP-03                  |
| S3-5 `platform/wakeLock`, `haptics`, `audio` (Web Audio beep, mở khóa âm thanh ở chạm đầu tiên cho iOS)   | FR-WKP-06, NFR-A11Y-02     |
| S3-6 Commit từng hiệp vào IndexedDB trước khi UI báo thành công; mở lại app → "Tiếp tục buổi tập dở?"     | FR-WKP-08, NFR-REL-01, 02  |
| S3-7 Hiển thị "Lần trước" cạnh mục tiêu                                                                   | FR-WKP-10                  |
| S3-8 Đánh giá Dễ/Vừa/Khó sau hiệp cuối; nút **"Đau / khó chịu"** → dừng bài, ghi nhận, gợi ý hạ bậc       | FR-WKP-07, Q3              |
| S3-9 Bỏ qua bài, thêm hiệp, ghi chú                                                                       | FR-WKP-11                  |

**DoD:** E2E: bắt đầu buổi → ghi 3 hiệp → reload → tiếp tục đúng vị trí → hoàn thành. Timer đúng ±1s sau khi chuyển tab 2 phút.

### Sprint 4 — Tăng tiến, lịch, trang chủ, lịch sử (1 tuần)

| Việc                                                                                                                                                  | FR                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| S4-1 `domain/progression.ts`: double progression, ngưỡng thận trọng (lên bậc: đạt `repsMax` mọi hiệp, RPE ≤ 7, 2 buổi liên tiếp), luôn kèm `reasonVi` | FR-PRO-01, 03, 06                    |
| S4-2 Thẻ đề xuất lên/hạ bậc — chỉ áp dụng khi người dùng xác nhận                                                                                     | FR-PRO-02                            |
| S4-3 `domain/schedule.ts`: hàng đợi buổi A/B/C, lỡ buổi không bị phạt                                                                                 | FR-SCH-01, 02                        |
| S4-4 Trang chủ "Hôm nay": buổi tiếp theo (≤ 2 chạm để bắt đầu), % giai đoạn, tuần hiện tại                                                            | FR-PRG-09, NFR-USE-01                |
| S4-5 Màn hình tóm tắt buổi: thời lượng, tổng hiệp/reps, gợi ý lần sau                                                                                 | FR-WKP-12                            |
| S4-6 Lịch sử buổi: xem / sửa / xóa (có Hoàn tác 10s)                                                                                                  | FR-STA-01, FR-DAT-06 (phần hoàn tác) |
| S4-7 Thanh tab dưới: Hôm nay · Chương trình · Bài tập · Lịch sử · Cài đặt                                                                             | SRS §8.1                             |

**DoD:** Bộ test bảng (table-driven) cho engine với ≥ 15 kịch bản; mô phỏng 4 tuần dữ liệu cho ra gợi ý hợp lý.

### Sprint 5 — PWA offline, dữ liệu, phát hành (1 tuần)

| Việc                                                                                                                                           | FR / NFR                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| S5-1 `manifest.ts`, icon, `sw.js`: precache app shell, cache-first cho `/media`, tải trước media của giai đoạn hiện tại                        | NFR-OFF-01, FR-EXL-08            |
| S5-2 Xuất JSON (round-trip) & CSV; nhập JSON của chính app với màn hình xem trước                                                              | FR-DAT-01, (FR-DAT-02 phần JSON) |
| S5-3 Xóa toàn bộ dữ liệu (xác nhận 2 lần)                                                                                                      | FR-DAT-04                        |
| S5-4 Trang Giới thiệu: miễn trừ trách nhiệm, "nội dung tham khảo từ nguồn công khai, chưa được chuyên gia kiểm duyệt", nguồn & giấy phép media | NFR-CNT-02, 03                   |
| S5-5 Rà soát a11y (axe), Lighthouse mobile ≥ 90 Performance/A11y/PWA                                                                           | NFR-A11Y-01, NFR-PERF-01         |
| S5-6 E2E offline: tắt mạng → mở app → tập → ghi log → xem lịch sử                                                                              | NFR-OFF-01, 02                   |
| S5-7 Deploy Vercel; test thật trên 1 Android + 1 iPhone (cài lên màn hình chính)                                                               |                                  |
| S5-8 Usability test 5 người mới (NFR-USE-03), ghi lại vấn đề cho v1                                                                            |                                  |

**DoD = MVP phát hành.**

---

## 4. Sau MVP

### v1 (≈ 6–8 tuần)

- Bài kiểm tra trình độ đầu vào + kiểm tra lại cuối giai đoạn (FR-ONB-03, FR-STA-07)
- Đổi bài trong buổi, khởi động / giãn cơ (FR-PRG-08, FR-WKP-13)
- Hạ bậc / deload tự động, buổi khởi động lại sau nghỉ dài (FR-PRO-04, 05)
- Thống kê, biểu đồ, PR, streak theo tuần (FR-STA-02…04)
- Nhắc tập Web Push (FR-SCH-04) — trên iOS chỉ hoạt động khi đã cài PWA
- Nhập CSV từ Strong/Hevy, thùng rác 30 ngày, nhắc sao lưu (FR-DAT-02, 03, 06)
- Bài tập & chương trình tùy chỉnh (FR-EXL-06, FR-PRG-06), dark mode

### v2 — Đóng gói mobile

- **Capacitor**: Android trước (chi phí Google Play một lần), iOS sau (cần Apple Developer, phí năm)
- Thay `platform/*` bằng plugin: `@capacitor/haptics`, `local-notifications` (giải quyết timer/âm báo nền trên iOS), `keep-awake`, `filesystem` + `share` cho xuất dữ liệu
- Tài khoản & đồng bộ chỉ cân nhắc nếu có nhu cầu thật — vì app miễn phí, phương án rẻ: đồng bộ qua file backup lên Google Drive/iCloud của chính người dùng thay vì tự vận hành server
- Giọng nói tiếng Việt, huy hiệu, tiếng Anh

---

## 5. Kế hoạch nội dung MVP

| Thang                   | Không dụng cụ                                                                        | Xà đơn                                                   | Dây kháng lực                                   |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------- |
| **Đẩy ngang**           | Wall → Incline (ghế/bàn) → Knee → Push-up → Diamond → Archer                         | —                                                        | Band-resisted push-up                           |
| **Kéo**                 | Towel row (cửa) → Inverted row dưới bàn (gối gập → chân thẳng)                       | Dead hang → Scapular pull → Negative → Pull-up → Chin-up | Band row, Band-assisted pull-up (nhiều mức dây) |
| **Chân (squat)**        | Assisted squat → Squat → Split squat → Bulgarian split squat → Shrimp squat (hỗ trợ) | —                                                        | Band squat                                      |
| **Hông / mông (hinge)** | Glute bridge → Single-leg bridge → Hip thrust (ghế)                                  | —                                                        | Band good morning, Band pull-through            |
| **Vai (đẩy dọc)**       | Pike push-up → Elevated pike → Wall walk (giai đoạn 3)                               | —                                                        | Band overhead press, Band pull-apart            |
| **Core**                | Plank → Side plank → Hollow body (gập gối → duỗi) → Dead bug                         | Hanging knee raise → Hanging leg raise                   | Pallof press                                    |

Khoảng 40 bài. Chương trình 12 tuần: GĐ1 nền tảng (bậc thấp, 3×8–12), GĐ2 tăng cường độ (bậc giữa, thêm tempo), GĐ3 nâng cao (bậc cao, kỹ năng xà); tuần 4/8/12 là deload. Mỗi buổi chọn bài từ thang theo `LadderState` của người dùng và dụng cụ đã khai báo.

---

## 6. Chiến lược kiểm thử

| Lớp      | Công cụ                                   | Trọng tâm                                                                                   |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Nội dung | `validate-content.ts` + Zod               | Mọi bài/thang/chương trình hợp lệ, media tồn tại, có `sources` và `license`                 |
| Domain   | Vitest                                    | progression, schedule, session, timer (giả lập thời gian), search bỏ dấu, export round-trip |
| Data     | Vitest + `fake-indexeddb`                 | Repository, migration từ mọi version cũ                                                     |
| E2E      | Playwright (Pixel 7, iPhone 14 emulation) | Onboarding → tập → reload → tiếp tục; offline; xuất/nhập                                    |
| Thủ công | Thiết bị thật                             | Âm báo khi khóa màn hình (iOS), wake lock, cài PWA                                          |

---

## 7. Rủi ro triển khai

| Rủi ro                                            | Mức        | Xử lý                                                                                           |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Không đủ media có giấy phép phù hợp cho cả 40 bài | Cao        | Xác minh ở Sprint 0; dự phòng SVG tự vẽ; bài thiếu ảnh vẫn phát hành với mô tả chi tiết         |
| iOS PWA không phát âm báo khi khóa màn hình       | Cao        | MVP: wake lock + rung khi quay lại; giải quyết triệt để bằng Capacitor local notifications ở v2 |
| Không có chuyên gia → hướng dẫn sai               | Trung bình | Chỉ dùng nguồn uy tín, ghi nguồn từng bài, ngưỡng thận trọng, nút "Đau", miễn trừ trách nhiệm   |
| Turbopack chưa tương thích plugin PWA             | Thấp       | Dùng service worker tự viết; nếu cần, build production bằng webpack                             |
| Phạm vi MVP phình (thêm thống kê, social…)        | Trung bình | Giữ đúng danh sách sprint; mọi thứ khác đưa vào backlog v1                                      |

---

## 8. Việc làm ngay

1. Duyệt kế hoạch này.
2. Bắt đầu Sprint 0: commit hiện trạng → sửa `params` → thiết lập Vitest/Playwright/CI → xác minh giấy phép media.
